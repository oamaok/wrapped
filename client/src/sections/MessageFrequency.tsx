import { Fragment, useState } from 'kaiku'
import { getUserById, rotateArray, toggleInArray } from '../util'
import styles from './MessageFrequency.scss'
import Section from '../Section'
import UserSelect from '../UserSelect'
import BarGraph from '../bar-graph/BarGraph'
import * as data from '../../../data'

const WEEKDAYS = [
  'Sunnuntai',
  'Maanantai',
  'Tiistai',
  'Keskiviikko',
  'Torstai',
  'Perjantai',
  'Lauantai',
]

export const MessagesByWeekday = () => {
  const state = useState({
    selectedUsers: [] as string[],
  })

  const onToggleUser = (userId: string) => {
    state.selectedUsers = toggleInArray(state.selectedUsers, userId)
  }

  return (
    <Section theme="secondary" class={styles.messagesByWeekday}>
      <h2>Viikonpäivittäin</h2>
      <UserSelect selectedUsers={state.selectedUsers} onToggle={onToggleUser} />

      {state.selectedUsers.length ? (
        state.selectedUsers.map(getUserById).map((user) => (
          <Fragment key={user.id}>
            <div class={styles.userCohort}>
              <div class={styles.userInfo}>
                <img src={user.avatar_url} />
                <span>{user.name}</span>
              </div>
              <BarGraph
                barWidth={32}
                buckets={rotateArray(
                  data.messagesByWeekdayByUser[
                    user.id as keyof typeof data.messagesByWeekdayByUser
                  ].map((row) => ({
                    label: WEEKDAYS[+row.dow]!,
                    value: parseInt(row.count),
                  })),
                  1
                )}
              />
            </div>
          </Fragment>
        ))
      ) : (
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
      )}
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

export const MessagesByHour = () => {
  const state = useState({
    selectedUsers: [] as string[],
  })

  const onToggleUser = (userId: string) => {
    state.selectedUsers = toggleInArray(state.selectedUsers, userId)
  }

  const barWidth = 24

  return (
    <Section theme="secondary" class={styles.messagesByHour}>
      <h2>Kellonajoittain</h2>
      <UserSelect selectedUsers={state.selectedUsers} onToggle={onToggleUser} />

      {state.selectedUsers.length ? (
        state.selectedUsers.map(getUserById).map((user) => (
          <>
            <div class={styles.userCohort}>
              <div class={styles.userInfo}>
                <img src={user.avatar_url} />
                <span>{user.name}</span>
              </div>
              <BarGraph
                barWidth={barWidth}
                buckets={formatHoursData(
                  data.messagesByHourByUser[
                    user.id as keyof typeof data.messagesByHourByUser
                  ]
                )}
              />
            </div>
          </>
        ))
      ) : (
        <BarGraph
          barWidth={barWidth}
          buckets={rotateArray(
            data.messagesByHour.map((row) => ({
              label: row.hour.padStart(2, '0') + ':00',
              value: parseInt(row.count),
            })),
            7
          )}
        />
      )}
    </Section>
  )
}
