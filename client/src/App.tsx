import styles from './App.scss'
import Landing from './Landing'
import TopVideoMessages from './sections/TopVideoMessages'
import TopImageMessages from './sections/TopImageMessages'
import ColorSection from './ColorSection'
import Header from './Header'
import SwearWords from './sections/SwearWords'
import TopReplies from './sections/TopReplies'
import MessagesByChannel from './sections/MessagesByChannel'
import TopTextMessages from './sections/TopTextMessages'
import StatsByUser from './sections/StatsByUser'
import ServerStats from './sections/ServerStats'

const App = () => {
  return (
    <>
      <ColorSection hueRotate={0} noPadding>
        <Landing />
      </ColorSection>

      <div class={styles.stats}>
        <ColorSection hueRotate={-60} invert={0}>
          <Header>Yleis&shy;katsaus</Header>
          <ServerStats />
          <MessagesByChannel />
        </ColorSection>

        <ColorSection hueRotate={40} invert={1}>
          <Header>Kirosana leader&shy;boards</Header>
          <SwearWords />
        </ColorSection>

        <ColorSection hueRotate={0} invert={1}>
          <Header>Käyttäjä&shy;kohtaiset statsit</Header>
          <StatsByUser />
        </ColorSection>

        <ColorSection hueRotate={290} invert={1}>
          <Header>Serverin Parhaat replyt</Header>
          <TopReplies />
        </ColorSection>

        <ColorSection hueRotate={210} invert={1}>
          <Header>Serverin Parhaat tekstit</Header>
          <TopTextMessages />
        </ColorSection>

        <ColorSection hueRotate={90}>
          <Header>Serverin Parhaat kuvat</Header>
          <TopImageMessages />
        </ColorSection>

        <ColorSection hueRotate={180}>
          <Header>Serverin Parhaat videot</Header>
          <TopVideoMessages />
        </ColorSection>

        <ColorSection hueRotate={280} invert={1}>
          <Header>Kiitos serveri 2016-2024</Header>
        </ColorSection>
      </div>
    </>
  )
}

export default App
