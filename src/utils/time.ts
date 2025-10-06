export const nowSeconds = (): number => Math.floor(Date.now() / 1000)

export function isExpired(startSeconds: number, now = nowSeconds()): boolean {
  return now > startSeconds + 60
}
