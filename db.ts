import * as fs from 'fs'
import pg, { QueryResultRow } from 'pg'
import sts from 'sql-template-strings'

const db = new pg.Pool({
  connectionString: 'postgres://localhost/wrapped',
})

export const initDb = async () => {
  await new Promise<void>((resolve, reject) =>
    db.connect((err) => {
      if (err) {
        reject(err)
        return
      }

      resolve()
    })
  )
}

export const sql = async <T extends QueryResultRow>(
  ...args: Parameters<typeof sts>
) => {
  try {
    const { rows } = await db.query<T>(sts(...args))
    return rows
  } catch (err) {
    console.error(err)
    throw err
  }
}
let existingUsers: Set<string> | null = null
export const insertUser = async (
  id: string,
  name: string,
  avatarURL: string
) => {
  if (!existingUsers) {
    const users = await sql<{ id: string }>`SELECT id FROM users`
    existingUsers = new Set(users.map(({ id }) => id))
  }

  if (existingUsers.has(id)) {
    return
  }

  await sql`INSERT INTO users (id, name, avatar_url) VALUES (${id}, ${name}, ${avatarURL})`
  existingUsers.add(id)
}

export type Attachment = {
  id: string
  type: string
  url: string
}

export type Emoji = {
  id: string
  name: string
  url: string
  animated: boolean
}

export type Message = {
  id: string
  userId: string
  channelId: string
  content: string
  sentAt: Date

  attachments: Attachment[]

  reactions: {
    userId: string
    emoji: Emoji
  }[]

  replyTo?: string
}

let existingEmojis: Set<string> | null = null
export const emojiExists = async (emojiId: string) => {
  if (!existingEmojis) {
    const emojis = await sql<{ id: string }>`SELECT id FROM emojis`
    existingEmojis = new Set(emojis.map(({ id }) => id))
  }

  return existingEmojis.has(emojiId)
}

export const insertEmoji = async (emoji: Emoji) => {
  if (await emojiExists(emoji.id)) {
    return
  }
  existingEmojis!.add(emoji.id)

  await sql`
    INSERT INTO emojis (id, name, url, animated)
    VALUES (${emoji.id}, ${emoji.name}, ${emoji.url}, ${emoji.animated})
  `
}

let existingChannels: Set<string> | null = null
export const insertChannel = async (id: string, name: string) => {
  if (!existingChannels) {
    const channels = await sql<{ id: string }>`SELECT id FROM channels`
    existingChannels = new Set(channels.map(({ id }) => id))
  }

  if (existingChannels.has(id)) {
    return
  }

  await sql`INSERT INTO channels (id, name) VALUES (${id}, ${name})`
  existingChannels.add(id)
}

let existingReactions: Set<string> | null = null
export const insertReaction = async (
  userId: string,
  messageId: string,
  emojiId: string
) => {
  if (!existingReactions) {
    const reactions = await sql<{
      user_id: string
      message_id: string
      emoji_id: string
    }>`SELECT user_id, message_id, emoji_id FROM reactions`
    existingReactions = new Set(
      reactions.map(
        ({ user_id, message_id, emoji_id }) => user_id + message_id + emoji_id
      )
    )
  }

  if (existingReactions.has(userId + messageId + emojiId)) {
    return
  }
  await sql`
    INSERT INTO reactions (user_id, message_id, emoji_id)
    VALUES (${userId}, ${messageId}, ${emojiId})
  `
  existingReactions.add(userId + messageId + emojiId)
}

let existingMessages: Set<string> | null = null

export const messageExists = async (messageId: string) => {
  if (!existingMessages) {
    const messages = await sql<{ id: string }>`SELECT id FROM messages`
    existingMessages = new Set(messages.map(({ id }) => id))
  }

  return existingMessages.has(messageId)
}

export const insertMessage = async (message: Message) => {
  if (!existingUsers?.has(message.userId)) return

  if (await messageExists(message.id)) return

  existingMessages?.add(message.id)

  await sql`
    INSERT INTO messages (id, user_id, channel_id, sent_at, content)
    VALUES (${message.id}, ${message.userId}, ${message.channelId}, ${message.sentAt}, ${message.content})
  `
  if (message.replyTo) {
    try {
      await sql`
      INSERT INTO replies (message_id, reply_to) VALUES (${message.id}, ${message.replyTo})
    `
    } catch (err) {
      console.error('failed to store reply', err)
    }
  }

  for (const attachment of message.attachments) {
    await sql`
      INSERT INTO attachments (id, message_id, type, url)
      VALUES (${attachment.id}, ${message.id}, ${attachment.type}, ${attachment.url})
    `
  }

  for (const reaction of message.reactions) {
    await insertEmoji(reaction.emoji)
    await insertReaction(reaction.userId, message.id, reaction.emoji.id)
  }
}

export const upserAttachments = async (
  messageId: string,
  attachments: Attachment[]
) => {
  for (const attachment of attachments) {
    await sql`
      INSERT INTO attachments (id, message_id, type, url)
      VALUES (${attachment.id}, ${messageId}, ${attachment.type}, ${attachment.url})
      ON CONFLICT (id) DO UPDATE SET
        type = EXCLUDED.type,
        url = EXCLUDED.url
    `
  }
}

export const getMessagesWithAttachments = async () => {
  const messages = await sql<{ message_id: string; channel_id: string }>`
    SELECT DISTINCT messages.id AS message_id, messages.channel_id AS channel_id
    FROM messages
    JOIN attachments ON attachments.message_id = messages.id
    WHERE attachments.id IS NOT NULL
    ORDER BY
      messages.channel_id,
      messages.id
  `

  return messages
}
