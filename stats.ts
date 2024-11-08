import fs from 'node:fs'
import path from 'node:path'
import { initDb, sql } from './db'
import { EXCLUDED_EMOJI, INCLUDED_USERS_ARR, CUTOFF_DATE } from './config'

const INCLUDED_USERS_SET = new Set(INCLUDED_USERS_ARR)

const SWEAR_WORDS = {
  vittu: '(^|\\s)(v+i+tt+u)|(v+i+t+u+n)',
  perkele: '(^|\\s)p+e+r+k+e+l+e',
  saatana: '(^|\\s)s(a|u)a+tana',
  paska: '(^|\\s)paska',
  helvetti: '(^|\\s)helvet+i',
  hitto: '(^|\\s)hit+o',
  jumalauta: '(^|\\s)jumalaut',
  perse: '(^|\\s)perse',
}

const groupByKey = <
  K extends string | number | symbol,
  O extends { [x in K]: symbol | number | string },
>(
  items: O[],
  key: K
): Record<O[K], O[]> => {
  const result = {} as Partial<Record<O[K], O[]>>

  for (const item of items) {
    const value = item[key]
    const group = result[value] ?? []
    result[value] = group
    group.push(item)
  }

  return result as Record<O[K], O[]>
}

export const swearWordsByUser = async () => {
  let res: any = {}

  for (const [word, pattern] of Object.entries(SWEAR_WORDS)) {
    res[word] = await sql`
      SELECT
        count(messages.id) AS count,
        users.id AS user_id
      FROM
        messages
      JOIN
        users ON messages.user_id = users.id
      WHERE
        regexp_like(messages.content, ${pattern}, 'i')
      GROUP BY
        users.id
    `
  }

  return res
}

const swearWordsByWeekday = async () => {
  let res: any = {}

  for (const [word, pattern] of Object.entries(SWEAR_WORDS)) {
    res[word] = await sql`
      SELECT
        count(messages.id) AS count,
        extract(dow from messages.sent_at) AS dow
      FROM
        messages
      WHERE
        regexp_like(messages.content, ${pattern}, 'i')
      GROUP BY
        extract(dow from messages.sent_at)
      ORDER BY
        extract(dow from messages.sent_at)
    `
  }

  return res
}

export const getMessageReactions = async (messageId: string) => {
  const reactions = await sql<{
    userId: string
    emojiId: string
    emojiName: string
  }>`
    SELECT
      reactions.user_id as "userId",
      emojis.name as "emojiName",
      emojis.id as "emojiId"
    FROM reactions
    JOIN emojis ON emojis.id = reactions.emoji_id
    WHERE message_id = ${messageId}
  `
  return reactions
}

export const getMessageReactionCounts = async (messageId: string) => {
  const reactions = await sql<{
    count: number
    emoji_id: string
    emoji_name: string
    is_animated: boolean
  }>`
    SELECT
      COUNT(reactions.user_id) as count,
      emojis.name as emoji_name,
      emojis.id as emoji_id,
      emojis.animated as is_animated
    FROM reactions
    JOIN emojis ON emojis.id = reactions.emoji_id
    WHERE message_id = ${messageId}
    GROUP BY emojis.name, emojis.id
  `
  return reactions.map((reaction) => ({
    ...reaction,
    count: +reaction.count,
  }))
}

export const getRepliedMessage = async (messageId: string) => {
  const [message] = await sql<{
    id: string
    user_id: string
    channel_id: string
    sent_at: string
    content: string
  }>`SELECT * FROM messages WHERE id = (SELECT reply_to FROM replies WHERE message_id = ${messageId})`

  return message ?? null
}

export const getMessageById = async (
  messageId: string
): Promise<MessageType> => {
  const cached = messageCache.get(messageId)
  if (cached) return cached

  const [message] = await sql<{
    id: string
    user_id: string
    channel_id: string
    sent_at: string
    content: string
  }>`SELECT * FROM messages WHERE id = ${messageId}`

  const msg: MessageType = {
    ...message!,
    reply_to: await getRepliedMessage(messageId),
    attachments: await getMessageAttachments(messageId),
    reactions: await getMessageReactionCounts(messageId),
  }

  messageCache.set(messageId, msg)

  return msg
}

export const getMessageChannel = async (messageId: string) => {
  const [msg] = await sql<{
    channel_id: string
  }>`select channel_id from messages where id = ${messageId}`
  return msg!.channel_id
}

export type MessageType = {
  id: string
  user_id: string
  channel_id: string
  sent_at: string
  content: string
  reply_to: {
    id: string
    user_id: string
    channel_id: string
    sent_at: string
    content: string
  } | null
  attachments: {
    id: string
    message_id: string
    type: string
    url: string
  }[]
  reactions: {
    count: number
    emoji_id: string
    emoji_name: string
    is_animated: boolean
  }[]
}
const messageCache: Map<string, any> = new Map()

type Attachment = {
  id: string
  message_id: string
  type: string
  url: string
}

const messagesWithAttachments = new Set<string>()
const allAttachments = new Map<string, Attachment[]>()

export const getMessageAttachments = async (messageId: string) => {
  const attachments = await sql<Attachment>`
    SELECT * FROM attachments WHERE message_id = ${messageId}`

  if (attachments.length) {
    allAttachments.set(messageId, attachments)
    messagesWithAttachments.add(messageId)
  }

  return attachments
}

export const messagesByUser = async () => {
  return await sql`
    SELECT
      count(messages.id) AS count,
      users.id AS user_id
    FROM
      messages
    JOIN
      users ON messages.user_id = users.id
    WHERE messages.sent_at > ${CUTOFF_DATE}
    GROUP BY
      users.id
  `
}

const messagesByHour = async () => {
  return await sql`
    SELECT
      count(messages.id) AS count,
      extract(hour from messages.sent_at) AS hour
    FROM
      messages
    WHERE messages.sent_at > ${CUTOFF_DATE}
    GROUP BY
      extract(hour from messages.sent_at)
    ORDER BY
      extract(hour from messages.sent_at)
  `
}

const messagesByHourByChannel = async () => {
  const messages = await sql<{
    count: string
    hour: string
    channel_id: string
  }>`
    SELECT
      count(messages.id) AS count,
      extract(hour from messages.sent_at) AS hour,
      messages.channel_id AS channel_id
    FROM
      messages
    WHERE messages.sent_at > ${CUTOFF_DATE}
    GROUP BY
      messages.channel_id,
      extract(hour from messages.sent_at)
    ORDER BY
      extract(hour from messages.sent_at)
  `

  return groupByKey(messages, 'channel_id')
}

const messagesByHourByUser = async () => {
  const messages = await sql<{ count: string; hour: string; user_id: string }>`
    SELECT
      count(messages.id) AS count,
      extract(hour from messages.sent_at) AS hour,
      messages.user_id AS user_id
    FROM
      messages
    WHERE messages.sent_at > ${CUTOFF_DATE}
    GROUP BY
      messages.user_id,
      extract(hour from messages.sent_at)
    ORDER BY
      extract(hour from messages.sent_at)
  `

  return groupByKey(messages, 'user_id')
}

const messagesByWeekday = async () => {
  return await sql`
    SELECT
      count(messages.id) AS count,
      extract(dow from messages.sent_at) AS dow
    FROM
      messages
    WHERE messages.sent_at > ${CUTOFF_DATE}
    GROUP BY
      extract(dow from messages.sent_at)
    ORDER BY
      extract(dow from messages.sent_at)
  `
}

const messagesByWeekdayByUser = async () => {
  const messages = await sql<{ count: string; dow: string; user_id: string }>`
    SELECT
      count(messages.id) AS count,
      extract(dow from messages.sent_at) AS dow,
      messages.user_id AS user_id
    FROM
      messages
    WHERE messages.sent_at > ${CUTOFF_DATE}
    GROUP BY
      messages.user_id,
      extract(dow from messages.sent_at)
    ORDER BY
      extract(dow from messages.sent_at)
  `

  return groupByKey(messages, 'user_id')
}

const messagesByChannelByUser = async () => {
  const channels = await sql<{ id: string }>`
    SELECT id FROM channels
  `
  const res: Record<string, { user_id: string; count: number }[]> = {}

  for (const { id } of channels) {
    res[id] = await sql<{
      user_id: string
      count: number
    }>`
      SELECT
        count(messages.id) AS count,
        messages.user_id AS user_id
      FROM
        messages
      WHERE channel_id = ${id} AND messages.sent_at > ${CUTOFF_DATE}
      GROUP BY
        messages.user_id
    `
  }
  return res
}

const messagesByUserByChannel = async () => {
  const res: Record<string, { channel_id: string; count: number }[]> = {}

  for (const id of INCLUDED_USERS_ARR) {
    res[id] = await sql<{
      channel_id: string
      count: number
    }>`
      SELECT
        count(messages.id) AS count,
        messages.channel_id AS channel_id
      FROM
        messages
      WHERE user_id = ${id} AND messages.sent_at > ${CUTOFF_DATE}
      GROUP BY
        messages.channel_id
    `
  }
  return res
}

const longestMessages = async () => {
  const messages = await sql<{
    id: string
  }>`
    SELECT
      messages.id
    FROM messages
    ORDER BY LENGTH(messages.content) DESC
    LIMIT 10;
  `

  return Promise.all(messages.map(({ id }) => getMessageById(id)))
}

export const topMessagesByReactionsIncludingVideos = async () => {
  const messages = await sql<{
    id: string
  }>`
    SELECT
      messages.id
    FROM messages
    JOIN attachments ON attachments.message_id = messages.id
    JOIN reactions ON reactions.message_id = messages.id AND
      reactions.emoji_id != ALL (${EXCLUDED_EMOJI})
    WHERE
      attachments.type LIKE 'video/%' AND messages.sent_at > ${CUTOFF_DATE}
    GROUP BY
      messages.id
    ORDER BY COUNT(reactions.*) DESC
    LIMIT 16;
  `

  return Promise.all(messages.map(({ id }) => getMessageById(id)))
}

export const topMessagesByReactionsIncludingImages = async () => {
  const messages = await sql<{
    id: string
  }>`
    SELECT
      messages.id
    FROM messages
    JOIN attachments ON attachments.message_id = messages.id
    JOIN reactions ON reactions.message_id = messages.id AND
      reactions.emoji_id != ALL (${EXCLUDED_EMOJI})
    WHERE
      attachments.type LIKE 'image/%' AND messages.sent_at > ${CUTOFF_DATE}
    GROUP BY
      messages.id
    ORDER BY COUNT(reactions.*) DESC
    LIMIT 16;
  `

  return Promise.all(messages.map(({ id }) => getMessageById(id)))
}

export const topMessagesByReactionsIncludingVideosByChannel = async () => {
  const channels = await sql<{ id: string }>`
    SELECT id FROM channels
  `
  const res: Record<string, MessageType[]> = {}

  for (const { id } of channels) {
    const messages = await sql<{
      id: string
    }>`
      SELECT
        messages.id
      FROM messages
      JOIN attachments ON attachments.message_id = messages.id
      JOIN reactions ON reactions.message_id = messages.id AND
        reactions.emoji_id != ALL (${EXCLUDED_EMOJI})
      WHERE
        attachments.type LIKE 'video/%' AND
        messages.channel_id = ${id} AND messages.sent_at > ${CUTOFF_DATE}
      GROUP BY
        messages.id
      ORDER BY COUNT(reactions.*) DESC
      LIMIT 10;
    `

    res[id] = await Promise.all(messages.map(({ id }) => getMessageById(id)))
  }
  return res
}

export const topMessagesByReactionsIncludingImagesByChannel = async () => {
  const channels = await sql<{ id: string }>`
    SELECT id FROM channels
  `

  const res: Record<string, MessageType[]> = {}

  for (const { id } of channels) {
    const messages = await sql<{
      id: string
    }>`
    SELECT
      messages.id
    FROM messages
    JOIN attachments ON attachments.message_id = messages.id
    JOIN reactions ON reactions.message_id = messages.id AND
      reactions.emoji_id != ALL (${EXCLUDED_EMOJI})
    WHERE
      attachments.type LIKE 'image/%' AND
      messages.channel_id = ${id} AND messages.sent_at > ${CUTOFF_DATE}
    GROUP BY
      messages.id
    ORDER BY COUNT(reactions.*) DESC
    LIMIT 10;
  `

    res[id] = await Promise.all(messages.map(({ id }) => getMessageById(id)))
  }
  return res
}

export const topMessagesByReactionsIncludingVideosByUser = async () => {
  const res: Record<string, MessageType[]> = {}

  for (const id of INCLUDED_USERS_ARR) {
    const messages = await sql<{
      id: string
    }>`
      SELECT
        messages.id
      FROM messages
      JOIN attachments ON attachments.message_id = messages.id
      JOIN reactions ON reactions.message_id = messages.id AND
        reactions.emoji_id != ALL (${EXCLUDED_EMOJI})
      WHERE
        attachments.type LIKE 'video/%' AND
        messages.user_id = ${id} AND messages.sent_at > ${CUTOFF_DATE}
      GROUP BY
        messages.id
      ORDER BY COUNT(reactions.*) DESC
      LIMIT 10;
    `

    res[id] = await Promise.all(messages.map(({ id }) => getMessageById(id)))
  }
  return res
}

export const topMessagesByReactionsIncludingImagesByUser = async () => {
  const res: Record<string, MessageType[]> = {}

  for (const id of INCLUDED_USERS_ARR) {
    const messages = await sql<{
      id: string
    }>`
    SELECT
      messages.id
    FROM messages
    JOIN attachments ON attachments.message_id = messages.id
    JOIN reactions ON reactions.message_id = messages.id AND
      reactions.emoji_id != ALL (${EXCLUDED_EMOJI})
    WHERE
      attachments.type LIKE 'image/%' AND
      messages.user_id = ${id} AND messages.sent_at > ${CUTOFF_DATE}
    GROUP BY
      messages.id
    ORDER BY COUNT(reactions.*) DESC
    LIMIT 10;
  `

    res[id] = await Promise.all(messages.map(({ id }) => getMessageById(id)))
  }
  return res
}

export const topTextMessagesByUser = async () => {
  const res: Record<string, MessageType[]> = {}

  for (const id of INCLUDED_USERS_ARR) {
    const messages = await sql<{
      id: string
    }>`
      SELECT
        messages.id
      FROM messages
      JOIN reactions ON reactions.message_id = messages.id AND
        reactions.emoji_id != ALL (${EXCLUDED_EMOJI})
      FULL OUTER JOIN attachments ON attachments.message_id = messages.id
      WHERE
        messages.user_id = ${id} AND
        attachments.id IS NULL AND messages.sent_at > ${CUTOFF_DATE}
      GROUP BY
        messages.id
      ORDER BY COUNT(reactions.*) DESC
      LIMIT 15;
    `

    res[id] = await Promise.all(messages.map(({ id }) => getMessageById(id)))
  }
  return res
}

export const topTextMessages = async () => {
  const messages = await sql<{
    id: string
  }>`
    SELECT
      messages.id
    FROM messages
    JOIN reactions ON reactions.message_id = messages.id AND
      reactions.emoji_id != ALL (${EXCLUDED_EMOJI})
    FULL OUTER JOIN attachments ON attachments.message_id = messages.id
    WHERE
      attachments.id IS NULL AND messages.sent_at > ${CUTOFF_DATE}
    GROUP BY
      messages.id
    ORDER BY COUNT(reactions.*) DESC
    LIMIT 20;
  `

  return Promise.all(messages.map(({ id }) => getMessageById(id)))
}

export const topReplies = async () => {
  const messages = await sql<{
    id: string
  }>`
    SELECT
      messages.id
    FROM messages
    JOIN reactions ON reactions.message_id = messages.id AND
      reactions.emoji_id != ALL (${EXCLUDED_EMOJI})
    JOIN replies ON replies.message_id = messages.id
    WHERE
      replies.reply_to IS NOT NULL AND messages.sent_at > ${CUTOFF_DATE}
    GROUP BY
      messages.id,
      replies.reply_to
    ORDER BY COUNT(reactions.*) DESC
    LIMIT 20;
  `

  return Promise.all(messages.map(({ id }) => getMessageById(id)))
}

export const topRepliesByUser = async () => {
  const res: Record<string, MessageType[]> = {}

  for (const id of INCLUDED_USERS_ARR) {
    const messages = await sql<{
      id: string
    }>`
      SELECT
        messages.id
      FROM messages
      JOIN reactions ON reactions.message_id = messages.id AND
        reactions.emoji_id != ALL (${EXCLUDED_EMOJI})
      JOIN replies ON replies.message_id = messages.id
      WHERE
        replies.reply_to IS NOT NULL AND
        messages.user_id = ${id} AND messages.sent_at > ${CUTOFF_DATE}
      GROUP BY
        messages.id,
        replies.reply_to
      ORDER BY COUNT(reactions.*) DESC
      LIMIT 10;
    `

    res[id] = await Promise.all(messages.map(({ id }) => getMessageById(id)))
  }
  return res
}

const allUsers = async () => {
  const users = await sql`
    SELECT * FROM users WHERE id = ANY (${INCLUDED_USERS_ARR})
  `
  return users
}

const allChannels = async () => {
  const channels = await sql<{
    id: string
    name: string
  }>`SELECT * FROM channels`
  return Object.fromEntries(channels.map((channel) => [channel.id, channel]))
}

const allEmojis = async () => {
  const emojis = await sql<{
    id: string
    name: string
    url: string
    is_animated: boolean
  }>`SELECT * FROM emojis`
  return Object.fromEntries(emojis.map((emoji) => [emoji.id, emoji]))
}

const overallStatsByUser = async () => {
  const res: Record<string, Record<string, any>> = {}

  for (const id of INCLUDED_USERS_ARR) {
    const [totalMessages] = await sql<{ count: number }>`
      SELECT COUNT(messages.id) AS count
      FROM messages
      WHERE user_id = ${id} AND messages.sent_at > ${CUTOFF_DATE}
    `
    const [totalReactionsGiven] = await sql<{ count: number }>`
      SELECT COUNT(reactions.*) AS count
      FROM reactions
      JOIN messages ON messages.id = reactions.message_id
      WHERE reactions.user_id = ${id}  AND messages.sent_at > ${CUTOFF_DATE}
    `
    const [totalReactionsReceived] = await sql<{ count: number }>`
      SELECT COUNT(reactions.*) AS count
      FROM messages
      JOIN reactions ON reactions.message_id = messages.id
      WHERE messages.user_id = ${id} AND messages.sent_at > ${CUTOFF_DATE}
    `
    const favoriteReactionEmojis = await sql<{
      emoji_id: string
      count: number
    }>`
      SELECT
        COUNT(reactions.*) AS count,
        emojis.id AS emoji_id
      FROM reactions
      JOIN messages ON messages.id = reactions.message_id
      JOIN emojis ON emojis.id = reactions.emoji_id
      WHERE reactions.user_id = ${id} AND messages.sent_at > ${CUTOFF_DATE}
      GROUP BY emojis.id
      ORDER BY COUNT(reactions.*) DESC
      LIMIT 5
    `
    const topReceivedEmojis = await sql<{ emoji_id: string; count: number }>`
      SELECT
        COUNT(reactions.*) AS count,
        reactions.emoji_id AS emoji_id
      FROM reactions
      JOIN messages ON messages.id = reactions.message_id
      WHERE
        messages.user_id = ${id} AND messages.sent_at > ${CUTOFF_DATE}
      GROUP BY emoji_id
      ORDER BY COUNT(reactions.*) DESC
      LIMIT 5
    `

    const [repliesReceived] = await sql<{ count: number }>`
      SELECT COUNT(replies.*)
      FROM messages
      JOIN replies ON replies.reply_to = messages.id
      WHERE user_id = ${id} AND messages.sent_at > ${CUTOFF_DATE}
    `

    const [repliesSent] = await sql<{ count: number }>`
      SELECT COUNT(replies.*)
      FROM messages
      JOIN replies ON replies.message_id = messages.id
      WHERE user_id = ${id} AND messages.sent_at > ${CUTOFF_DATE}
    `

    const [imagesSent] = await sql<{ count: number }>`
      SELECT COUNT(attachments.id) AS count
      FROM messages
      JOIN attachments ON attachments.message_id = messages.id
      WHERE user_id = ${id} AND messages.sent_at > ${CUTOFF_DATE}
        AND attachments.type LIKE 'image/%'
    `

    const [videosSent] = await sql<{ count: number }>`
      SELECT COUNT(attachments.id) AS count
      FROM messages
      JOIN attachments ON attachments.message_id = messages.id
      WHERE user_id = ${id} AND messages.sent_at > ${CUTOFF_DATE}
        AND attachments.type LIKE 'video/%'
    `

    res[id] = {
      totalMessages: totalMessages!.count,
      totalReactionsGiven: totalReactionsGiven!.count,
      totalReactionsReceived: totalReactionsReceived!.count,
      favoriteReactionEmojis: favoriteReactionEmojis,
      topReceivedEmojis: topReceivedEmojis,
      repliesReceived: repliesReceived!.count,
      repliesSent: repliesSent!.count,
      imagesSent: imagesSent!.count,
      videosSent: videosSent!.count,
    }
  }

  return res
}

// Most reactions for video attachment
/*
select
  attachments.url
from messages
join attachments on attachments.messageid = messages.id
join reactions on reactions.messageid = messages.id
where attachments.type like 'video%'
group by
  messages.id,
  attachments.url
order by count(reactions.*) desc;
*/

const main = async () => {
  console.log('init db...')
  await initDb()
  console.log('done.')

  const queries = {
    swearWordsByUser,
    swearWordsByWeekday,
    messagesByUser,
    messagesByHour,
    messagesByWeekday,
    messagesByWeekdayByUser,
    messagesByHourByUser,
    messagesByHourByChannel,
    messagesByChannelByUser,
    // longestMessages,
    topMessagesByReactionsIncludingVideos,
    topMessagesByReactionsIncludingImages,
    topMessagesByReactionsIncludingImagesByChannel,
    topMessagesByReactionsIncludingVideosByChannel,
    topMessagesByReactionsIncludingImagesByUser,
    topMessagesByReactionsIncludingVideosByUser,
    messagesByUserByChannel,
    topTextMessages,
    topTextMessagesByUser,
    allUsers,
    allChannels,
    allEmojis,
    topReplies,
    topRepliesByUser,
    overallStatsByUser,
  } as const

  console.log('exec queries...')
  let i = 0
  const len = Object.keys(queries).length
  const result = Object.fromEntries(
    await Promise.all(
      Object.entries(queries).map(async ([key, fn]) => {
        console.time(key)
        return [
          key,
          await fn().then(
            (res) => (
              console.timeEnd(key), console.log(`${++i} out of ${len}`), res
            )
          ),
        ]
      })
    )
  )

  result.messagesWithAttachments = await Promise.all(
    [...messagesWithAttachments].map(async (id) => {
      return {
        message_id: id,
        channel_id: await getMessageChannel(id),
      }
    })
  )
  result.allAttachments = [...allAttachments.values()].flat()

  console.log('done.')

  console.log('write blob...')
  fs.writeFileSync(
    path.resolve(__dirname, 'data.json'),
    JSON.stringify(result, null, 2)
  )
  fs.writeFileSync(
    path.resolve(__dirname, 'data.ts'),
    Object.entries(result)
      .map(([key, data]) => {
        return `export const ${key} = ${JSON.stringify(data)} as const`
      })
      .join('\n')
  )
  console.log('done.')
  process.exit(0)
}

if (require.main === module) {
  main()
}
