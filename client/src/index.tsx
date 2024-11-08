import { render } from 'kaiku'
import App from './App'
import globalState from './state'
import { defaultPalette, setPalette } from './colors'
import './background'

setPalette(defaultPalette)

render(<App />, document.querySelector('main')!)

let prevScrollPos = document.documentElement.scrollTop
document.addEventListener('scroll', () => {
  const ratio =
    document.documentElement.scrollTop /
    (document.documentElement.scrollHeight - window.innerHeight)

  const scrollDelta = prevScrollPos - document.documentElement.scrollTop
  prevScrollPos = document.documentElement.scrollTop

  globalState.amountScrolled += Math.abs(scrollDelta)
  // TODO: Re-enable
  // document.documentElement.style.filter = `hue-rotate(${ratio * 180}deg)`
})
