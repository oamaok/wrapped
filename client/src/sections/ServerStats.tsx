import { FC } from 'kaiku'
import * as data from '../../../data'
import styles from './ServerStats.scss'
import { getUserById, rotateArray } from '../util'
import Section from '../Section'
import BarGraph from '../bar-graph/BarGraph'
const stats = Object.entries(data.overallStatsByUser)

function sortBy<T>(arr: T[], fn: (item: T) => number) {
  return arr.toSorted((a, b) => fn(a) - fn(b))
}

const medals = ['🥇', '🥈', '🥉']

const getTop3ByStat = (
  stat: Exclude<
    keyof (typeof stats)[number][1],
    'topReceivedEmojis' | 'favoriteReactionEmojis'
  >
) => {
  return sortBy(stats, (item) => +item[1][stat])
    .toReversed()
    .slice(0, 3)
    .map(([id, userStats]) => ({
      id,
      count: userStats[stat],
    }))
}

const Leaderboard: FC<{
  users: { id: string; count: number | string }[]
  unit: string
}> = ({ users, unit }) => {
  return (
    <div class={styles.list}>
      {users.slice(0, 3).map(({ count, id }, index) => {
        const user = getUserById(id)

        return (
          <div class={styles.item}>
            <div class={styles.position}>{medals[index]}</div>
            <div class={styles.user}>
              <img src={user.avatar_url} /> {user.name}
            </div>
            <div class={styles.count}>
              {count} {unit}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const TopMessageCounts = () => {
  return <Leaderboard users={getTop3ByStat('totalMessages')} unit="viestiä" />
}

const TopRepliers = () => {
  return <Leaderboard users={getTop3ByStat('repliesSent')} unit="replyä" />
}

const TopReplyRecievers = () => {
  return <Leaderboard users={getTop3ByStat('repliesReceived')} unit="replyä" />
}

const TopReactionGivers = () => {
  return (
    <Leaderboard
      users={getTop3ByStat('totalReactionsGiven')}
      unit="reaktiota"
    />
  )
}

const TopReactionReceivers = () => {
  return (
    <Leaderboard
      users={getTop3ByStat('totalReactionsReceived')}
      unit="reaktiota"
    />
  )
}

const TopReactionReceiversPerMessage = () => {
  const users = sortBy(
    stats,
    (item) => +item[1].totalReactionsReceived / +item[1].totalMessages
  )
    .toReversed()
    .slice(0, 3)
    .map(([id, userStats]) => ({
      id,
      count: (
        +userStats.totalReactionsReceived / +userStats.totalMessages
      ).toFixed(2),
    }))

  return <Leaderboard users={users} unit="per viesti" />
}

const MostImagesPostedBy = () => {
  return <Leaderboard users={getTop3ByStat('imagesSent')} unit="kuvaa" />
}

const MostVideosPostedBy = () => {
  return <Leaderboard users={getTop3ByStat('videosSent')} unit="videota" />
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

const ServerStats = () => {
  return (
    <div class={styles.statsSections}>
      <div class={styles.statsSection}>
        <h2>Viestejä lähetetty</h2>
        <Section theme="secondary">
          <TopMessageCounts />
        </Section>
      </div>

      <div class={styles.statsSection}>
        <h2>Replyjä lähetetty</h2>
        <Section theme="primary">
          <TopRepliers />
        </Section>
      </div>

      <div class={styles.statsSection}>
        <h2>Replyjä saatu</h2>
        <Section theme="secondary">
          <TopReplyRecievers />
        </Section>
      </div>

      <div class={styles.statsSection}>
        <h2>Reaktioita annettu</h2>
        <Section theme="primary">
          <TopReactionGivers />
        </Section>
      </div>

      <div class={styles.statsSection}>
        <h2>Reaktioita saatu</h2>
        <Section theme="secondary">
          <TopReactionReceivers />
        </Section>
      </div>

      <div class={styles.statsSection}>
        <h2>Reaktioita saatu per viesti</h2>
        <Section theme="primary">
          <TopReactionReceiversPerMessage />
        </Section>
      </div>
      <div class={styles.statsSection}>
        <h2>Kuvia lähetetty</h2>
        <Section theme="secondary">
          <MostImagesPostedBy />
        </Section>
      </div>
      <div class={styles.statsSection}>
        <h2>Videoita lähetetty</h2>
        <Section theme="primary">
          <MostVideosPostedBy />
        </Section>
      </div>
      <div class={styles.statsSection}>
        <h2>Viestit viikonpäivittäin</h2>

        <Section theme="secondary">
          <BarGraph
            barWidth={32}
            buckets={rotateArray(
              data.messagesByWeekday.map((row) => ({
                label: WEEKDAYS[+row.dow]!,
                value: parseInt(row.count),
              })),
              1
            )}
          />
        </Section>
      </div>
      <div class={styles.statsSection}>
        <h2>Viestit kellonajoittain</h2>

        <Section theme="primary">
          <BarGraph
            barWidth={16}
            buckets={rotateArray(
              data.messagesByHour.map((row) => ({
                label: row.hour.padStart(2, '0') + ':00',
                value: parseInt(row.count),
              })),
              7
            )}
          />
        </Section>
      </div>
    </div>
  )
}

export default ServerStats
