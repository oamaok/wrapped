import { FC, useEffect, useRef } from 'kaiku'
import {
  ColorShift,
  lerpColorShift,
  setColorShift,
  setColorShiftInterp,
} from './colors'
import styles from './ColorSection.scss'

type ColorShiftPoint = {
  element: HTMLElement
} & ColorShift

const colorShiftPoints: ColorShiftPoint[] = []

let prevT = 0
const handleColorShift = () => {
  const pointsWithPositions = colorShiftPoints.map((point) => {
    const { top } = point.element.getBoundingClientRect()
    return [top, point] as [number, ColorShiftPoint]
  })
  pointsWithPositions.sort((a, b) => a[0] - b[0])

  const currentPointIndex = pointsWithPositions.findLastIndex(
    ([pos]) => pos < window.innerHeight * (3 / 4)
  )

  if (currentPointIndex >= 1) {
    const [pos, current] = pointsWithPositions[currentPointIndex]!
    const [, prev] = pointsWithPositions[currentPointIndex - 1]!

    const t = Math.min(
      1,
      (window.innerHeight * (3 / 4) - pos) / (window.innerHeight * 0.75)
    )

    if (prevT !== t) {
      prevT = t
      setColorShiftInterp(prev, current, t)
    }
  } else {
    setColorShift(pointsWithPositions[0]![1])
  }
}

let animationFrame = -1
document.addEventListener('scroll', () => {
  cancelAnimationFrame(animationFrame)
  animationFrame = requestAnimationFrame(handleColorShift)
})

const ColorSection: FC<Partial<ColorShift> & { noPadding?: boolean }> = ({
  children,
  hueRotate = 0,
  invert = 0,
  brightness = 1,
  contrast = 1,
  noPadding = false,
}) => {
  const ref = useRef<HTMLElement>()

  useEffect(() => {
    if (ref.current) {
      colorShiftPoints.push({
        element: ref.current,
        hueRotate,
        invert,
        brightness,
        contrast,
      })
    }
  })

  return (
    <div ref={ref} class={noPadding ? '' : styles.colorSection}>
      {children}
    </div>
  )
}

export default ColorSection
