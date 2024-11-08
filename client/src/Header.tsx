import { FC } from 'kaiku'
import styles from './Header.scss'

const Header: FC<{}> = ({ children }) => {
  return <h2 class={styles.header}>{children}</h2>
}

export default Header
