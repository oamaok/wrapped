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
  getMessagesWithAttachments,
  Attachment,
  upserAttachments,
} from './db'
import { groupBy } from './client/src/util'
import {
  topMessagesByReactionsIncludingImages,
  topMessagesByReactionsIncludingVideos,
} from './stats'
import * as data from './data.json'
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

const main = async () => {
  const allChannels = await client.channels.cache

  await client.guilds.fetch()
  const guild = client.guilds.cache.get(SERVER_ID)
  assert.ok(guild)

  const messagesByChannel = groupBy(
    data.messagesWithAttachments,
    (message) => message.channel_id
  )

  for (const [channelId, messages] of Object.entries(messagesByChannel)) {
    const channel = (await guild.channels.resolve(channelId)) as TextChannel

    console.log(channel.name)

    for (const { message_id: messageId } of messages) {
      const message = await channel.messages.fetch(messageId)

      console.log({ messageId })
      const attachments: Attachment[] = []
      for (const [attachmentId, attachment] of message.attachments) {
        console.log(attachment.url)
        attachments.push({
          id: attachmentId,
          type: attachment.contentType ?? '',
          url: attachment.url,
        })
      }

      await upserAttachments(messageId, attachments)
    }
  }

  process.exit(1)
}
