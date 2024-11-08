import { FC } from 'kaiku'
import Message from './Message'
import styles from './MessageColumns.scss'
import Section from './Section'
import { MessageType } from '../../stats'
import { distribute } from './util'

const MessageColumns: FC<{ messages: MessageType[] }> = ({ messages }) => {
  const messageColumns = distribute(messages, 3)

  const columns = [
    { size: 0, messages: [] as MessageType[] },
    { size: 0, messages: [] as MessageType[] },
    { size: 0, messages: [] as MessageType[] },
  ]

  for (const message of messages) {
    const size = 1 + message.attachments.length * 1.5
    const smallestColumn = columns.reduce((smallest, col) =>
      smallest.size < col.size ? smallest : col
    )

    smallestColumn.size += size
    smallestColumn.messages.push(message)
  }

  return (
    <div class={styles.columns}>
      {columns.map(({ messages }) => {
        return (
          <div class={styles.messageColumn}>
            {messages.map((msg, idx) => (
              <Section theme="secondary">
                <Message message={msg} />
              </Section>
            ))}
          </div>
        )
      })}
    </div>
  )
}

export default MessageColumns
