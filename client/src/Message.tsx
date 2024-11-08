import styles from './Message.scss'
import * as data from '../../data'
import {
  formatDate,
  getAttachmentUrl,
  getChannelById,
  getEmojiUrl,
  getUserById,
} from './util'
import { MessageType } from '../../stats'
import * as marked from 'marked'

const EMOJI_REGEX = /<(a?):([^:]+):(\d+)>/g
const MENTION_REGEX = /<@(\d+)>/g
const GROUP_MENTION_REGEX = /<@&(\d+)>/g
const CHANNEL_REGEX = /<#(\d+)>/g
const URL_REGEX = /https:\/\/([^\s]+)/g

const GROUPS: Record<string, string> = {
  '1058293521511088139': 'pk-seutu',
}

type MessageContentProps = {
  content: string
}

const renderEmojis = () => {}

const MessageContent = ({ content }: MessageContentProps) => {
  let html = content

  html = html.replace(
    EMOJI_REGEX,
    (_, animated, name, id) =>
      `<img
        title="${name}"
        alt="${`:${name}:`}"
        src="${getEmojiUrl(id, animated === 'a')}"
      />`
  )
  html = html.replace(MENTION_REGEX, (_, userId) => {
    const user = getUserById(userId)
    return `<a>@${user?.name}</a>`
  })
  html = html.replace(GROUP_MENTION_REGEX, (_, groupId) => {
    const group = GROUPS[groupId]
    return `<a>@${group}</a>`
  })
  html = html.replace(CHANNEL_REGEX, (_, channelId) => {
    const channel = getChannelById(channelId)
    if (!channel) return ''
    return `<a>#${channel.name}</a>`
  })
  html = marked.parse(html, { async: false })

  return <div class={styles.content} html={html} />
}

const Attachment = (att: MessageType['attachments'][number]) => {
  return (
    <div class={styles.attachment}>
      {() => {
        switch (att.type.split('/')[0]) {
          case 'image':
            return <img src={getAttachmentUrl(att)} />
          case 'audio':
            return <audio src={getAttachmentUrl(att)} controls />
          case 'video':
            return (
              <video controls>
                <source src={getAttachmentUrl(att)} />
              </video>
            )
        }
      }}
    </div>
  )
}

type Props = {
  message: MessageType
}

const RepliedMessage = ({
  message,
}: {
  message: Exclude<MessageType['reply_to'], null>
}) => {
  return (
    <div class={styles.repliedMessage}>
      <div class={styles.cord}></div>
      <img src={getUserById(message.user_id).avatar_url} />
      <MessageContent content={message.content} />
    </div>
  )
}

const Message = ({ message }: Props) => {
  const {
    id: messageId,
    user_id: authorId,
    sent_at: sentAt,
    reply_to: replyTo,
    channel_id: channelId,
    content,
    attachments,
    reactions,
  } = message

  const author = data.allUsers.find((user) => user.id === authorId)!

  if (!author) {
    console.error(`user ${authorId} was not found`)
    return null
  }

  const date = new Date(sentAt)

  const messageLink = `https://discord.com/channels/238991465064169473/${channelId}/${messageId}`

  return (
    <article class={styles.messageWrapper}>
      {replyTo ? <RepliedMessage message={replyTo} /> : null}
      <div class={styles.message}>
        <div class={styles.avatar}>
          <img src={author.avatar_url} />
        </div>
        <div class={styles.body}>
          <div class={styles.info}>
            <div class={styles.author}>{author.name}</div>
            <a
              class={styles.time}
              href={messageLink}
              target="_blank"
              rel="nofollow"
            >
              {formatDate(date)}
            </a>
          </div>
          <MessageContent content={content} />
          {attachments?.map((attachment) => <Attachment {...attachment} />)}
          <div class={styles.reactions}>
            {reactions.map((reaction) => (
              <div class={styles.reaction} title={reaction.emoji_name}>
                {reaction.emoji_id !== reaction.emoji_name ? (
                  <img
                    alt={`:${reaction.emoji_name}:`}
                    src={getEmojiUrl(reaction.emoji_id, reaction.is_animated)}
                  />
                ) : (
                  reaction.emoji_name
                )}
                <span>{reaction.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}

export default Message
