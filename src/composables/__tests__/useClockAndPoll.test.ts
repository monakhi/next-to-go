import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { useClockAndPoll } from '../useClockAndPoll'

describe('useClockAndPoll', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function mountWith({
    tick,
    poll,
    getExpiryThreshold,
    getVisibleCount,
  }: {
    tick: () => void
    poll: () => Promise<void>
    getExpiryThreshold: () => number | null
    getVisibleCount: () => number
  }) {
    const component = defineComponent({
      setup() {
        useClockAndPoll({
          tick,
          poll,
          getExpiryThreshold,
          getVisibleCount,
        })
        return () => null
      },
    })
    return mount(component)
  }

  const sec = (n: number) => n * 1000

  it('polls immediately on mount', async () => {
    const tick = vi.fn()
    const poll = vi.fn().mockResolvedValue(undefined)
    const getExpiryThreshold = vi.fn(() => null)
    const getVisibleCount = vi.fn(() => 5)

    mountWith({ tick, poll, getExpiryThreshold, getVisibleCount })

    await Promise.resolve()

    expect(tick).toHaveBeenCalledTimes(1)
    expect(poll).toHaveBeenCalledTimes(1)
  })

  it('triggers poll when earliest race passes advertised_start + 60s', async () => {
    const tick = vi.fn()
    const poll = vi.fn().mockResolvedValue(undefined)

    const nowSec = Math.floor(Date.now() / 1000)
    const advertisedStart = nowSec
    const expiryTs = advertisedStart + 60

    const getExpiryThreshold = () => expiryTs
    const getVisibleCount = () => 5

    mountWith({ tick, poll, getExpiryThreshold, getVisibleCount })
    await Promise.resolve()

    expect(poll).toHaveBeenCalledTimes(1)

    // not expired yet at +59s
    await vi.advanceTimersByTimeAsync(sec(59))
    expect(poll).toHaveBeenCalledTimes(1)

    // crosses zero at +60s - triggers poll
    await vi.advanceTimersByTimeAsync(sec(1))
    expect(poll).toHaveBeenCalledTimes(2)
  })

  it('triggers poll when visible count drops below 5', async () => {
    const tick = vi.fn()
    const poll = vi.fn().mockResolvedValue(undefined)
    const getExpiryThreshold = () => null
    const getVisibleCount = () => 3 // force < 5 branch

    mountWith({ tick, poll, getExpiryThreshold, getVisibleCount })
    await Promise.resolve()

    // initial poll on mount
    expect(poll).toHaveBeenCalledTimes(1)

    // after next tick (1s), should poll again due to <5 visible
    await vi.advanceTimersByTimeAsync(sec(1))
    expect(poll).toHaveBeenCalledTimes(2)
  })
})
