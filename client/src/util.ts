import * as data from '../../data'
import { MessageType } from '../../stats'

export function rotateArray<T>(arr: T[], amount: number): T[] {
  return arr.map((_, index) => arr[(arr.length + index + amount) % arr.length]!)
}

export function toggleInArray<T>(arr: T[], item: T): T[] {
  if (arr.includes(item)) {
    return arr.filter((v) => v !== item)
  } else {
    return [...arr, item]
  }
}

export const getUserById = (userId: string) => {
  return data.allUsers.find((user) => user.id === userId)!
}
export const getEmojiById = (emojiId: string) => {
  return data.allEmojis[emojiId as keyof typeof data.allEmojis]
}

export const getEmojiUrl = (emojiId: string, isAnimated: boolean = false) => {
  return `https://cdn.discordapp.com/emojis/${emojiId}.${isAnimated ? 'gif' : 'webp'}`
}

export const getChannelById = (channelId: string) => {
  return data.allChannels[channelId as keyof typeof data.allChannels]
}

export const getAttachmentUrl = (
  attachment: MessageType['attachments'][number]
) => {
  if (process.env.NODE_ENV === 'production') {
    const url = new URL(attachment.url)
    const ext = url.pathname.split('.').pop()

    return `./attachments/${attachment.id}.${ext}`
  } else {
    return attachment.url
  }
}

export const groupBy = <T, G extends string | number | symbol>(
  items: T[],
  discriminator: (item: T) => G
): Record<G, T[]> => {
  const result = {} as Partial<Record<G, T[]>>

  for (const item of items) {
    const value = discriminator(item)
    const group = result[value] ?? []
    result[value] = group
    group.push(item)
  }

  return result as Record<G, T[]>
}

const MONTH_NAMES = [
  'tammikuu',
  'helmikuu',
  'maaliskuu',
  'huhtikuu',
  'toukokuu',
  'kesäkuu',
  'heinäkuu',
  'elokuu',
  'syyskuu',
  'lokakuu',
  'marraskuu',
  'joulukuu',
]

export const formatDate = (date: Date): string => {
  return `${date.getDate()}. ${MONTH_NAMES[date.getMonth()]}ta ${date.getFullYear()}`
}

export type UserId =
  keyof typeof data.topMessagesByReactionsIncludingImagesByUser

export const interleaveArrays = <T>(arrays: T[][]) => {
  const maxLength = Math.max(...arrays.map((arr) => arr.length))
  const res: T[] = []
  for (let i = 0; i < maxLength; i++) {
    for (const arr of arrays) {
      const item = arr[i]
      if (item) {
        res.push(item)
      }
    }
  }
  return res
}

export const distribute = <T>(arr: T[], bucketCount: number): T[][] => {
  const buckets: T[][] = Array(bucketCount)
    .fill(null)
    .map(() => [])
  let bucket = 0
  for (let item of arr) {
    buckets[bucket]!.push(item)
    bucket = (bucket + 1) % bucketCount
  }
  return buckets
}

export const uniqBy = <T, R>(arr: T[], discriminator: (item: T) => R): T[] => {
  const seen = new Set<R>()
  const res: T[] = []
  for (const item of arr) {
    const d = discriminator(item)
    if (seen.has(d)) continue
    seen.add(d)
    res.push(item)
  }

  return res
}
