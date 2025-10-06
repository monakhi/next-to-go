export const CATEGORIES = {
  GREYHOUND: '9daef0d7-bf3c-4f50-921d-8e818c60fe61',
  HARNESS: '161d9be2-e909-4326-8c2c-35ed71fb460b',
  HORSE: '4a2788f8-e825-4d36-9894-efd4baf1cfae',
} as const

export type CategoryKey = keyof typeof CATEGORIES
export type CategoryId = (typeof CATEGORIES)[CategoryKey]

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  [CATEGORIES.GREYHOUND]: 'Greyhound',
  [CATEGORIES.HARNESS]: 'Harness',
  [CATEGORIES.HORSE]: 'Horse',
}

export const CATEGORY_IDS: CategoryId[] = Object.values(CATEGORIES)

export const CATEGORY_LIST: ReadonlyArray<{ id: CategoryId; label: string }> = [
  { id: CATEGORIES.GREYHOUND, label: CATEGORY_LABELS[CATEGORIES.GREYHOUND] },
  { id: CATEGORIES.HARNESS, label: CATEGORY_LABELS[CATEGORIES.HARNESS] },
  { id: CATEGORIES.HORSE, label: CATEGORY_LABELS[CATEGORIES.HORSE] },
] as const
