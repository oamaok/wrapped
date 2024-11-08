import { useEffect, useState } from 'kaiku'
import styles from './BarGraph.scss'
import useIntersectionObserver from '../hooks/useIntersectionObserver'

type BarProps = {
  value: number
  maxValue: number
  height: number
  visible: boolean
  barWidth: number
}

const easeInOutCubic = (x: number): number =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2

const BAR_ANIMATION_TIME_MS = 1500
const BAR_ANIMATION_DELAY_MS = 200

const Bar = ({ value, maxValue, height, barWidth, visible }: BarProps) => {
  const state = useState({
    animationStarted: false,
    startTime: 0,
    animationPos: 0,
  })

  const interpValue = (value * state.animationPos).toFixed(0)
  const barHeight = (value / maxValue) * (height - 20) * state.animationPos

  if (!state.animationStarted && visible) {
    state.animationStarted = true
    state.startTime = Date.now() + BAR_ANIMATION_DELAY_MS
  }

  useEffect(() => {
    if (state.animationStarted) {
      const animate = () => {
        const animationPos =
          (Date.now() - state.startTime) / BAR_ANIMATION_TIME_MS
        state.animationPos = animationPos < 0 ? 0 : easeInOutCubic(animationPos)

        if (state.animationPos < 1) {
          requestAnimationFrame(animate)
        } else {
          state.animationPos = 1
        }
      }

      requestAnimationFrame(animate)
    }
  })

  return (
    <div
      class={styles.barWrapper}
      style={{ height: height + 'px', width: barWidth + 'px' }}
    >
      <div class={styles.value}>{interpValue}</div>
      <div class={styles.bar} style={{ height: barHeight + 'px' }}></div>
    </div>
  )
}

type BarGraphBucket = {
  label: string
  value: number
}

type Props = {
  buckets: BarGraphBucket[]
  barWidth: number
  height?: number
}

const BarGraph = ({ buckets, barWidth, height = 160 }: Props) => {
  const state = useState({ hasBeenVisible: false })

  const ref = useIntersectionObserver(
    (entries) => {
      if (!state.hasBeenVisible) {
        state.hasBeenVisible = entries.some((entry) => entry.isIntersecting)
      }
    },
    { threshold: 1.0 }
  )
  const maxValue = Math.max(...buckets.map((b) => b.value))

  return (
    <div
      class={styles.barGraph}
      ref={ref}
      style={{ width: buckets.length * (barWidth + 12) + 12 + 'px' }}
    >
      <div class={styles.bars}>
        {buckets.map((bucket) => (
          <Bar
            {...bucket}
            maxValue={maxValue}
            height={height}
            barWidth={barWidth}
            visible={state.hasBeenVisible}
          />
        ))}
      </div>
      <div class={styles.horizontalAxis} />
      <div class={styles.labels}>
        {buckets.map((bucket) => (
          <div class={styles.label} style={{ width: barWidth + 'px' }}>
            {bucket.label}
          </div>
        ))}
      </div>
    </div>
  )
}

export default BarGraph
