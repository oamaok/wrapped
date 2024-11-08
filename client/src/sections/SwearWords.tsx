import Section from '../Section'
import * as data from '../../../data'
import BarGraph from '../bar-graph/BarGraph'
import { getUserById } from '../util'
import styles from './SwearWords.scss'

const SwearWords = () => {
  const swearWordData = Object.entries(data.swearWordsByUser).map(
    ([word, values]) => ({
      word,
      users: values.sort((a, b) => +b.count - +a.count),
    })
  )

  return (
    <div class={styles.container}>
      {swearWordData.map(({ word, users }) => (
        <Section theme="primary" class={styles.wordSection}>
          <h2>{word}</h2>
          <BarGraph
            barWidth={32}
            buckets={users.map(({ count, user_id }) => ({
              label: getUserById(user_id)?.name,
              value: +count,
            }))}
          />
        </Section>
      ))}
    </div>
  )
}

export default SwearWords
