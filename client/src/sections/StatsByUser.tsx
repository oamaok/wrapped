import { FC, useShallowState } from 'kaiku'
import * as data from '../../../data'
import UserSelect from '../UserSelect'
import Section from '../Section'
import Message from '../Message'
import {
  distribute,
  getChannelById,
  getEmojiById,
  getEmojiUrl,
  getUserById,
  interleaveArrays,
  rotateArray,
  uniqBy,
  UserId,
} from '../util'
import styles from './StatsByUser.scss'
import BarGraph from '../bar-graph/BarGraph'
import MessageColumns from '../MessageColumns'
import { MessageType } from '../../../stats'

const TopMessages: FC<{ userId: UserId }> = ({ userId }) => {
  const topImages = data.topMessagesByReactionsIncludingImagesByUser[
    userId
  ].slice(0, 3) as any as MessageType[]
  const topVideos = data.topMessagesByReactionsIncludingVideosByUser[
    userId
  ].slice(0, 3) as any as MessageType[]
  const topTextMessages = data.topTextMessagesByUser[userId].slice(
    0,
    6
  ) as any as MessageType[]
  const topReplies = data.topRepliesByUser[userId].slice(
    0,
    4
  ) as any as MessageType[]

  const topMessages = uniqBy(
    interleaveArrays([topImages, topVideos, topReplies, topTextMessages]),
    (msg) => msg.id
  )
    .filter(
      (msg) => !msg.content.includes('https://cdn.discordapp.com/attachments')
    )
    .filter((msg) => !msg.reply_to || msg.reply_to.content.length < 1000)
    .reverse()

  return <MessageColumns messages={topMessages} />
}

const OverallStats: FC<{ userId: UserId }> = ({ userId }) => {
  const stats = data.overallStatsByUser[userId]

  return (
    <Section theme="primary">
      <UserInfo userId={userId} />
      <div class={styles.overallStats}>
        <div class={styles.stat}>
          <div class={styles.label}>Viestejä lähetetty</div>
          <div class={styles.value}>{stats.totalMessages}</div>
        </div>
        <div class={styles.stat}>
          <div class={styles.label}>Reaktioita annettu</div>
          <div class={styles.value}>{stats.totalReactionsGiven}</div>
        </div>
        <div class={styles.stat}>
          <div class={styles.label}>Reaktioita saatu</div>
          <div class={styles.value}>{stats.totalReactionsReceived}</div>
        </div>
        <div class={styles.stat}>
          <div class={styles.label}>Replyjä lähetetty</div>
          <div class={styles.value}>{stats.repliesSent}</div>
        </div>
        <div class={styles.stat}>
          <div class={styles.label}>Replyjä saatu</div>
          <div class={styles.value}>{stats.repliesReceived}</div>
        </div>
        <div class={styles.stat}>
          <div class={styles.label}>Kuvia lähetetty</div>
          <div class={styles.value}>{stats.imagesSent}</div>
        </div>
        <div class={styles.stat}>
          <div class={styles.label}>Videoita lähetetty</div>
          <div class={styles.value}>{stats.videosSent}</div>
        </div>
      </div>
    </Section>
  )
}

const GivenReactionEmojis: FC<{ userId: UserId }> = ({ userId }) => {
  const stats = data.overallStatsByUser[userId]

  return (
    <Section theme="primary">
      <UserInfo userId={userId} />
      <div class={styles.emojiRanking}>
        {stats.favoriteReactionEmojis.map((item) => {
          const emoji = getEmojiById(item.emoji_id)

          return (
            <div class={styles.item}>
              <div class={styles.label}>
                <img src={getEmojiUrl(emoji.id, emoji.animated)} />
                {emoji.name}
              </div>
              <div class={styles.value}>{item.count}</div>
            </div>
          )
        })}
      </div>
    </Section>
  )
}

const ReceivedReactionEmojis: FC<{ userId: UserId }> = ({ userId }) => {
  const stats = data.overallStatsByUser[userId]
  return (
    <Section theme="secondary">
      <UserInfo userId={userId} />
      <div class={styles.emojiRanking}>
        {stats.topReceivedEmojis.map((item) => {
          const emoji = getEmojiById(item.emoji_id)

          return (
            <div class={styles.item}>
              <div class={styles.label}>
                <img src={getEmojiUrl(emoji.id, emoji.animated)} />
                {emoji.name}
              </div>
              <div class={styles.value}>{item.count}</div>
            </div>
          )
        })}
      </div>
    </Section>
  )
}

const MessagesByChannel: FC<{ userId: UserId }> = ({ userId }) => {
  const stats = [...data.messagesByUserByChannel[userId]]
    .filter(
      ({ channel_id, count }) =>
        channel_id !== '750440693390114976' && +count > 10
    )
    .sort((a, b) => +b.count - +a.count)
  return (
    <Section theme="secondary">
      <UserInfo userId={userId} />
      <div class={styles.messagesByChannelWrapper}>
        <BarGraph
          barWidth={32}
          buckets={stats.map((row) => ({
            label: '#' + getChannelById(row.channel_id).name,
            value: parseInt(row.count),
          }))}
        />
      </div>
    </Section>
  )
}

const UserInfo: FC<{ userId: UserId }> = ({ userId }) => {
  const user = getUserById(userId)
  return (
    <div class={styles.userInfo}>
      <img src={user.avatar_url} />
      <span>{user.name}</span>
    </div>
  )
}

const SwearWords: FC<{ userId: UserId }> = ({ userId }) => {
  const swearWords = []
  for (const [word, users] of Object.entries(data.swearWordsByUser)) {
    const count = users.find((u) => u.user_id === userId)
    if (!count) continue

    swearWords.push({
      word,
      count: +count.count,
    })
  }

  swearWords.sort((a, b) => b.count - a.count)

  return (
    <Section theme="primary">
      <UserInfo userId={userId} />
      <BarGraph
        barWidth={32}
        buckets={swearWords.map(({ count, word }) => ({
          label: word,
          value: +count,
        }))}
      />
    </Section>
  )
}

const WEEKDAYS = [
  'sunnuntai',
  'maanantai',
  'tiistai',
  'keskiviikko',
  'torstai',
  'perjantai',
  'lauantai',
]

const MessageCountByWeekday: FC<{ userId: UserId }> = ({ userId }) => {
  return (
    <Section theme="primary">
      <UserInfo userId={userId} />
      <BarGraph
        barWidth={32}
        buckets={rotateArray(
          data.messagesByWeekdayByUser[userId].map((row) => ({
            label: WEEKDAYS[+row.dow]!,
            value: parseInt(row.count),
          })),
          1
        )}
      />
    </Section>
  )
}

const HOURS = rotateArray(
  Array(24)
    .fill(null)
    .map((_, i) => i.toString()),
  7
)

const formatHoursData = (
  hoursData: (typeof data.messagesByHourByUser)[keyof typeof data.messagesByHourByUser]
) => {
  return HOURS.map((hour) => {
    const row = hoursData.find((r) => r.hour === hour)

    return {
      label: hour.padStart(2, '0') + ':00',
      value: row ? parseInt(row.count) : 0,
    }
  })
}

const MessageCountByHour: FC<{ userId: UserId }> = ({ userId }) => {
  return (
    <Section theme="secondary">
      <UserInfo userId={userId} />
      <BarGraph
        barWidth={16}
        buckets={formatHoursData(data.messagesByHourByUser[userId])}
      />
    </Section>
  )
}
const userIds = data.allUsers.map((user) => user.id)
const StatsByUser = () => {
  const state = useShallowState({
    userId: userIds[
      Math.floor(Math.random() * userIds.length)
    ] as UserId | null,
  })

  const user = state.userId === null ? null : getUserById(state.userId)

  return (
    <>
      <div class={styles.userSelect}>
        <h2>Valitse käyttäjä</h2>
        <Section theme="secondary">
          <UserSelect
            selectedUsers={state.userId ? [state.userId] : []}
            onToggle={(userId) => {
              if (state.userId === userId) state.userId = null
              else state.userId = userId as UserId
            }}
          />
        </Section>

        {state.userId ? (
          <Section theme="primary">
            <UserInfo userId={state.userId} />
          </Section>
        ) : null}
      </div>
      {state.userId ? (
        <div class={styles.statsSections}>
          <div class={styles.statsSection}>
            <h2>Yleisiä statseja</h2>
            <OverallStats userId={state.userId} />
          </div>

          <div class={styles.statsSection}>
            <h2>Viestit aihekanaville</h2>
            <MessagesByChannel userId={state.userId} key={state.userId} />
          </div>

          <div class={styles.statsSection}>
            <h2>Annetuimmat reaktiot</h2>
            <GivenReactionEmojis userId={state.userId} />
          </div>

          <div class={styles.statsSection}>
            <h2>Saaduimmat reaktiot</h2>
            <ReceivedReactionEmojis userId={state.userId} />
          </div>

          <div class={styles.statsSection}>
            <h2>Viestit viikonpäivittäin</h2>
            <MessageCountByWeekday userId={state.userId} key={state.userId} />
          </div>

          <div class={styles.statsSection}>
            <h2>Viestit tunneittain</h2>
            <MessageCountByHour userId={state.userId} key={state.userId} />
          </div>

          <div class={styles.statsSection}>
            <h2>Kirosanat</h2>
            <SwearWords userId={state.userId} key={state.userId} />
          </div>
          <h2>Parhaat viestit</h2>
          <TopMessages userId={state.userId} />
        </div>
      ) : null}
    </>
  )
}

export default StatsByUser
