import styles from './UserSelect.scss'
import * as data from '../../data'

type Props = {
  selectedUsers: string[]
  onToggle: (userId: string) => void
}

const UserSelect = ({ selectedUsers, onToggle }: Props) => {
  return (
    <div class={styles.userSelect}>
      {data.allUsers.map((user) => (
        <button
          class={[
            styles.user,
            { [styles.selected!]: selectedUsers.includes(user.id) },
          ]}
          onClick={() => onToggle(user.id)}
        >
          <img src={user.avatar_url} />
          <div class={styles.tooltip}>{user.name}</div>
        </button>
      ))}
    </div>
  )
}

export default UserSelect
