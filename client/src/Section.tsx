import { FC } from 'kaiku'
import styles from './Section.scss'

export type SectionTheme = 'primary' | 'secondary'

type Props = {
  theme: SectionTheme
  class?: string
}

const Section: FC<Props> = ({ children, class: className, theme }) => {
  return (
    <section class={[className, styles[theme], styles.section]}>
      {children}
    </section>
  )
}

export default Section
