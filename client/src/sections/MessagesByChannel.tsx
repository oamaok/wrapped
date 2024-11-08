import * as data from '../../../data'
import Section from '../Section'
import { distribute, getChannelById, getUserById } from '../util'
import styles from './MessagesByChannel.scss'

const channelGroups = distribute(
  [
    '750440693390114976',
    '1091319458867449876',
    '680032400943874099',
    '979717109598810152',
    '1282402037765640324',
    '992357001839509604',
    '924636302387863673',
  ],
  3
)

const medals = ['🥇', '🥈', '🥉']

const MessagesByChannel = () => {
  return (
    <div class={styles.columns}>
      {channelGroups.map((channels) => (
        <div class={styles.column}>
          {channels.map((channelId, index) => {
            const channel = getChannelById(channelId)
            const messageCounts = [
              ...data.messagesByChannelByUser[
                channel.id as keyof typeof data.messagesByChannelByUser
              ],
            ]

            messageCounts.sort((a, b) => +b.count - +a.count)

            return (
              <Section theme={index % 2 === 0 ? 'secondary' : 'primary'}>
                <h2>#{channel.name}</h2>
                <div class={styles.list}>
                  {messageCounts
                    .slice(0, 3)
                    .map(({ count, user_id }, index) => {
                      const user = getUserById(user_id)

                      return (
                        <div class={styles.item}>
                          <div class={styles.position}>{medals[index]}</div>
                          <div class={styles.user}>
                            <img src={user.avatar_url} /> {user.name}
                          </div>
                          <div class={styles.count}>{count} viestiä</div>
                        </div>
                      )
                    })}
                </div>
              </Section>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export default MessagesByChannel
