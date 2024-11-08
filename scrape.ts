import discordjs, {
  ChannelType,
  Collection,
  GatewayIntentBits,
  TextChannel,
} from 'discord.js'
import dotenv from 'dotenv'
import assert from 'assert'
import {
  initDb,
  Message,
  insertChannel,
  insertMessage,
  insertUser,
  messageExists,
  emojiExists,
  insertEmoji,
} from './db'
import { SERVER_ID } from './config'

dotenv.config()

const client = new discordjs.Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildMessageReactions,
  ],
})

client.login(process.env.DISCORD_TOKEN)

Promise.all([
  initDb(),

  new Promise<void>((resolve, reject) =>
    client.once(discordjs.Events.ClientReady, () => {
      resolve()
    })
  ),
])
  .then(async () => {
    main()
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })

const SKIPPED_CHANNELS = ['1044266417232556052']

const main = async () => {
  const allChannels = await client.channels.cache

  const channels: TextChannel[] = []

  for (const [channelId, channel] of allChannels) {
    if (SKIPPED_CHANNELS.includes(channel.id)) continue
    if (
      channel.type === ChannelType.GuildText &&
      channel.guildId === SERVER_ID
    ) {
      channels.push(channel)
    }
  }

  for (const channel of channels) {
    console.log('inserting channel ', channel.id, channel.name)
    await insertChannel(channel.id, channel.name)
  }

  await client.guilds.fetch()
  const guild = client.guilds.cache.get(SERVER_ID)
  assert.ok(guild)

  await guild.members.fetch()
  for (const [userId, user] of guild.members.cache) {
    console.log('inserting user ', userId, user.user.username)
    await insertUser(userId, user.user.username, user.displayAvatarURL())
  }

  const lastDate = new Date(2023, 11, 31, 23, 59, 59)

  for (const channel of channels) {
    let earliestMessage: string | undefined = undefined
    let earliestMessageAt: Date = new Date()

    while (earliestMessageAt > lastDate) {
      console.log('\n', channel.name, earliestMessageAt)
      const messages: Collection<
        string,
        discordjs.Message<true>
      > = await channel.messages.fetch({
        before: earliestMessage,
        limit: 100,
      })

      if (messages.size === 0) {
        console.log('reached the end of channel')
        break
      }

      for (const [messageId, message] of messages) {
        if (message.createdAt < earliestMessageAt) {
          earliestMessage = messageId
          earliestMessageAt = message.createdAt
        }

        if (await messageExists(messageId)) {
          process.stdout.write('s')
          continue
        }

        process.stdout.write('.')
        const msg: Message = {
          id: messageId,
          userId: message.author.id,
          channelId: message.channelId,
          sentAt: message.createdAt,
          content: message.content,
          attachments: [],
          reactions: [],
          replyTo: message.reference?.messageId,
        }

        for (const [attachmentId, attachment] of message.attachments) {
          msg.attachments.push({
            id: attachmentId,
            type: attachment.contentType ?? '',
            url: attachment.url,
          })
        }

        for (const [reactionId, reaction] of message.reactions.cache) {
          const reactionUsers = await reaction.users.fetch()
          for (const [userId] of reactionUsers) {
            const emojiUrl = reaction.emoji.imageURL()
            const emojiId = reaction.emoji.id ?? reaction.emoji.name

            if (!emojiId) {
              console.warn(`could not identify emoji`, reaction.emoji)
              continue
            }

            msg.reactions.push({
              userId,
              emoji: {
                id: emojiId,
                name: reaction.emoji.name ?? '',
                url: emojiUrl ?? '',
                animated: reaction.emoji.animated ?? false,
              },
            })
          }
        }

        await insertMessage(msg)
      }
    }
  }

  process.exit(1)
}
