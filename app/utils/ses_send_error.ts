/**
 * Extracts a human-readable reason from a failed SES send, and flags whether
 * it looks like the sending identity's verification was lost or revoked —
 * e.g. deleted directly in the AWS console, out-of-band from this app's
 * cached `domains.verified` flag.
 */
export function describeSendFailure(error: unknown): {
  message: string
  isUnverifiedIdentity: boolean
} {
  const message = error instanceof Error ? error.message : String(error)
  return {
    message,
    isUnverifiedIdentity: /not verified|does not exist/i.test(message),
  }
}
