export function httpError(status: number, message: string, body?: unknown) {
  return Object.assign(new Error(message), {
    status,
    body,
  })
}
