# syntax=docker/dockerfile:1

# Pinned rather than `lts` so a rebuild months from now produces the same runtime.
ARG NODE_IMAGE=node:24-bookworm-slim
ARG PNPM_VERSION=10.28.2

# ----------------------------------------------------------------------------
# base — shared toolchain for every stage
# ----------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS base
ARG PNPM_VERSION
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    CI=true
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /app

# ----------------------------------------------------------------------------
# deps — full dependency tree, needed to compile TypeScript
#
# Only the manifest + lockfile are copied so this layer is cached across builds
# and only re-runs when dependencies actually change.
#
# pnpm-workspace.yaml is deliberately NOT copied. It carries `allowBuilds` for
# better-sqlite3, which would make pnpm compile it from source — the slim image
# has no python3/make/g++, so that would fail, and better-sqlite3 is only ever
# used by the test suite (config/database.ts defaults to the `pg` connection).
# ----------------------------------------------------------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ----------------------------------------------------------------------------
# build — compile to ./build (includes ace.js, .adonisjs/, package.json, lockfile)
# ----------------------------------------------------------------------------
FROM deps AS build
COPY . .
RUN node ace build --ignore-ts-errors

# ----------------------------------------------------------------------------
# prod-deps — production-only tree, resolved from the compiled app's own manifest
# ----------------------------------------------------------------------------
FROM base AS prod-deps
COPY --from=build /app/build/package.json /app/build/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# ----------------------------------------------------------------------------
# production — runtime image, no pnpm store, no dev dependencies, no sources
# ----------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS production
WORKDIR /app

ENV NODE_ENV=production \
    PORT=80 \
    HOST=0.0.0.0

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/build ./

# NOTE: runs as root because the app binds port 80, which is privileged.
# To drop to the `node` user, move the app to an unprivileged port (e.g. 3333)
# and update containerPort in .aws/task-definition.json plus the ALB target
# group / security group rules to match.

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||80)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "bin/server.js"]
