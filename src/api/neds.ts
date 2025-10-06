export type Race = {
  id: string
  meeting_name: string
  race_number: number
  category_id: string
  advertised_start_seconds: number
}

type RaceSummary = {
  race_id: string
  meeting_name: string
  race_number: number
  category_id: string
  advertised_start: { seconds: number }
}

export async function fetchNextRaces(count = 10): Promise<Race[]> {
  const baseUrl = import.meta.env.VITE_NEDS_API_URL
  if (!baseUrl) throw new Error('Missing VITE_NEDS_API_URL in environment')

  const url = `${baseUrl}?method=nextraces&count=${count}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const json = await res.json()
  if (!json?.data?.next_to_go_ids || !json?.data?.race_summaries) {
    throw new Error('Invalid API shape: missing keys')
  }

  const { next_to_go_ids, race_summaries } = json.data as {
    next_to_go_ids: string[]
    race_summaries: Record<string, RaceSummary>
  }

  return next_to_go_ids
    .map((id) => {
      const r = race_summaries[id]
      if (!r) return null

      const secsNum = Number(r.advertised_start?.seconds ?? 0)
      if (!Number.isFinite(secsNum)) return null

      return {
        id: r.race_id,
        meeting_name: r.meeting_name,
        race_number: r.race_number,
        category_id: r.category_id,
        advertised_start_seconds: secsNum,
      }
    })
    .filter((r): r is Race => r !== null)
}
