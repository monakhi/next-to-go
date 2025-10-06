import { onMounted, onUnmounted } from 'vue'

type Opts = {
  tick: () => void

  poll: () => Promise<void>

  getExpiryThreshold: () => number | null

  getVisibleCount: () => number
}

export function useClockAndPoll({ tick, poll, getExpiryThreshold, getVisibleCount }: Opts) {
  let tickId: number | undefined
  let prevUntilExpiry: number | null = null
  let inFlight = false

  const nowSec = () => Math.floor(Date.now() / 1000)
  const computeUntilExpiry = (): number | null => {
    const expiryTs = getExpiryThreshold()
    if (expiryTs == null) return null
    return expiryTs - nowSec()
  }

  const triggerFetch = async () => {
    if (inFlight) return
    inFlight = true
    try {
      await poll()
    } finally {
      prevUntilExpiry = computeUntilExpiry()
      inFlight = false
    }
  }

  onMounted(async () => {
    tick()
    await triggerFetch()

    prevUntilExpiry = computeUntilExpiry()

    tickId = window.setInterval(async () => {
      tick()

      const untilExpiry = computeUntilExpiry()

      if (
        !inFlight &&
        prevUntilExpiry != null &&
        untilExpiry != null &&
        prevUntilExpiry > 0 &&
        untilExpiry <= 0
      ) {
        await triggerFetch()
        return
      }

      if (!inFlight && getVisibleCount() < 5) {
        await triggerFetch()
        return
      }

      prevUntilExpiry = untilExpiry
    }, 1000)
  })

  onUnmounted(() => {
    if (tickId) clearInterval(tickId)
  })
}
