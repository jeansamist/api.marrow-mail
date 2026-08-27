#!/usr/bin/env python3
"""
Render .aws/task-definition.json for one environment.

The task definition is identical across environments apart from a handful of
values, so it is kept as a single template rather than three files that would
inevitably drift apart.

The Secrets Manager ARN is looked up at render time instead of being written
into the template. AWS appends a random six-character suffix to every secret
ARN, and a hand-written guess at that suffix silently breaks every container
start — which is exactly what happened with the placeholder this replaces.

Usage:
    render-task-def.py --env dev --account-id 123456789012 --image <ecr-uri>
"""

import argparse
import json
import pathlib
import subprocess
import sys

TEMPLATE = pathlib.Path(__file__).parent / "task-definition.json"

# Values that legitimately differ between environments. Anything not listed
# here is shared and lives in the template.
ENVIRONMENTS = {
    "production": {
        "FAMILY_SUFFIX": "",
        "SECRET_ID": "marrow-mail",
        "APP_URL": "https://api.marrowmails.com",
        "FRONTEND_APP_URL": "https://marrowmails.com",
        "CORS_ORIGIN": "https://marrowmails.com,https://www.marrowmails.com",
        "AWS_BUCKET": "marrow-mail-s3",
        "AWS_SES_RULE_SET_NAME": "marrow-mail",
        # Vercel's project-specific anycast IP shown on the frontend project's
        # domain card (Settings > Domains) — the same Vercel project serves
        # all three environments, so this IP is shared across them too.
        "CUSTOM_LOGIN_HOSTNAME_TARGET_IP": "216.198.79.1",
        "DB_DATABASE": "marrowmail_prod",
        "DB_SSL": "false",
        "SMTP_PORT": "465",
        "SMTP_SECURE": "true",
        "LOG_GROUP": "/ecs/marrow-mail-api",
        "LOG_LEVEL": "info",
        "MAIL_FROM_NAME": "Marrowmail",
        "MAIL_FROM_ADDRESS": "no-reply@marrowmails.com",
        "ELGIOPAY_API_BASE_URL": "https://api.elgiopay.com",
    },
    "staging": {
        "FAMILY_SUFFIX": "-staging",
        "SECRET_ID": "marrow-mail-staging",
        "APP_URL": "https://staging-api.marrowmails.com",
        "FRONTEND_APP_URL": "https://staging.marrowmails.com",
        "CORS_ORIGIN": "https://staging.marrowmails.com",
        "AWS_BUCKET": "marrow-mail-s3-staging",
        "AWS_SES_RULE_SET_NAME": "marrow-mail-staging",
        "CUSTOM_LOGIN_HOSTNAME_TARGET_IP": "216.198.79.1",
        "DB_DATABASE": "marrowmail_staging",
        "DB_SSL": "false",
        "SMTP_PORT": "1025",
        "SMTP_SECURE": "false",
        "LOG_GROUP": "/ecs/marrow-mail-api-staging",
        "LOG_LEVEL": "debug",
        "MAIL_FROM_NAME": "Marrowmail (staging)",
        "MAIL_FROM_ADDRESS": "no-reply@marrowmails.com",
        # Sandbox, so staging can never move real money.
        "ELGIOPAY_API_BASE_URL": "https://sandbox-api.elgiopay.com",
    },
    "dev": {
        "FAMILY_SUFFIX": "-dev",
        "SECRET_ID": "marrow-mail-dev",
        "APP_URL": "https://dev-api.marrowmails.com",
        "FRONTEND_APP_URL": "https://dev.marrowmails.com",
        # localhost is allowed so a frontend running locally can call the dev API.
        "CORS_ORIGIN": "https://dev.marrowmails.com,http://localhost:3000,http://localhost:5173",
        "AWS_BUCKET": "marrow-mail-s3-dev",
        "AWS_SES_RULE_SET_NAME": "marrow-mail-dev",
        "CUSTOM_LOGIN_HOSTNAME_TARGET_IP": "216.198.79.1",
        "DB_DATABASE": "marrowmail_dev",
        "DB_SSL": "false",
        "SMTP_PORT": "1025",
        "SMTP_SECURE": "false",
        "LOG_GROUP": "/ecs/marrow-mail-api-dev",
        "LOG_LEVEL": "debug",
        "MAIL_FROM_NAME": "Marrowmail (dev)",
        "MAIL_FROM_ADDRESS": "no-reply@marrowmails.com",
        "ELGIOPAY_API_BASE_URL": "https://sandbox-api.elgiopay.com",
    },
}


def secret_arn(secret_id: str, region: str) -> str:
    """Full ARN including the suffix AWS assigned when the secret was created."""
    result = subprocess.run(
        ["aws", "secretsmanager", "describe-secret", "--secret-id", secret_id,
         "--region", region, "--query", "ARN", "--output", "text"],
        capture_output=True, text=True,
    )
    if result.returncode != 0 or not result.stdout.strip():
        sys.exit(f"error: cannot resolve secret '{secret_id}': {result.stderr.strip()}")
    return result.stdout.strip()


def add_mail_sink(task_def: dict, log_group: str, region: str) -> None:
    """
    Attach a Mailpit sidecar to non-production tasks.

    Historically this contained every mail a dev/staging box could send: the
    app's SMTP_HOST of localhost:1025 stayed inside the task's network
    namespace, so no configuration mistake could turn dev into an outbound
    mail server. That protection no longer applies now that MAIL_MAILER is
    "resend" in all three environments — Resend is an HTTP API, not SMTP, so
    dev/staging mail bypasses this sidecar entirely and goes out for real.
    The container is left attached (non-essential, so it costs nothing to
    keep) in case mail is ever pointed back at SMTP for a given environment.
    """
    task_def["containerDefinitions"].append({
        "name": "mailpit",
        "image": "axllent/mailpit:v1.21",
        "essential": False,
        "portMappings": [
            {"containerPort": 1025, "protocol": "tcp"},
            {"containerPort": 8025, "protocol": "tcp"},
        ],
        "environment": [
            # The app sends whatever SMTP credentials are in its secret;
            # Mailpit takes any of them rather than failing the handshake.
            {"name": "MP_SMTP_AUTH_ACCEPT_ANY", "value": "true"},
            {"name": "MP_SMTP_AUTH_ALLOW_INSECURE", "value": "true"},
            {"name": "MP_MAX_MESSAGES", "value": "5000"},
        ],
        "logConfiguration": {
            "logDriver": "awslogs",
            "options": {
                "awslogs-group": log_group,
                "awslogs-region": region,
                "awslogs-stream-prefix": "mailpit",
                "awslogs-create-group": "true",
            },
        },
    })


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--env", required=True, choices=sorted(ENVIRONMENTS))
    parser.add_argument("--account-id", required=True)
    parser.add_argument("--image", required=True)
    parser.add_argument("--region", default="us-east-1")
    parser.add_argument("--out", default="-", help="output path, or - for stdout")
    args = parser.parse_args()

    config = dict(ENVIRONMENTS[args.env])
    config["AWS_ACCOUNT_ID"] = args.account_id
    config["SECRET_ARN"] = secret_arn(config.pop("SECRET_ID"), args.region)

    rendered = TEMPLATE.read_text()
    for key, value in config.items():
        rendered = rendered.replace(f"<{key}>", value)

    # Fail loudly rather than registering a task definition with a literal
    # "<PLACEHOLDER>" in it, which ECS accepts and then fails at runtime.
    leftover = [line.strip() for line in rendered.splitlines() if "<" in line and ">" in line]
    if leftover:
        sys.exit("error: unsubstituted placeholders:\n  " + "\n  ".join(leftover))

    task_def = json.loads(rendered)
    task_def["containerDefinitions"][0]["image"] = args.image

    if args.env != "production":
        add_mail_sink(task_def, ENVIRONMENTS[args.env]["LOG_GROUP"], args.region)

    output = json.dumps(task_def, indent=2)
    if args.out == "-":
        print(output)
    else:
        pathlib.Path(args.out).write_text(output + "\n")
        print(f"wrote {args.out}", file=sys.stderr)


if __name__ == "__main__":
    main()
