import * as culori from 'culori'

const oklab = culori.converter('oklab')
const rgb = culori.converter('rgb')

const rootElement = document.querySelector(':root') as HTMLElement

type Palette = culori.Oklab[]

export const defaultPalette: Palette = [
  oklab(culori.parseHex('#01204e')),
  oklab(culori.parseHex('#028391')),
  oklab(culori.parseHex('#f6dcac')),
  oklab(culori.parseHex('#faa968')),
  oklab(culori.parseHex('#f85525')),
  oklab(culori.parseHex('#ffffff')),
]

let currentPalette = defaultPalette

export type ColorShift = {
  hueRotate: number
  invert: number
  contrast: number
  brightness: number
}

const lerp = (a: number, b: number, t: number) => {
  return (1 - t) * a + t * b
}

export const setColorShiftInterp = (
  prev: ColorShift,
  next: ColorShift,
  t: number
) => {
  const prevPalette = defaultPalette
    .map(culori.filterHueRotate(prev.hueRotate))
    .map(culori.filterInvert(prev.invert))
    .map(culori.filterBrightness(prev.brightness))
    .map(culori.filterContrast(prev.contrast))

  const nextPalette = defaultPalette
    .map(culori.filterHueRotate(next.hueRotate))
    .map(culori.filterInvert(next.invert))
    .map(culori.filterBrightness(next.brightness))
    .map(culori.filterContrast(next.contrast))

  currentPalette = prevPalette.map((value, index) =>
    culori.interpolate([value!, nextPalette[index]!], 'oklab')(t)
  )

  setPalette(currentPalette)
}

export const setColorShift = (shift: ColorShift) => {
  currentPalette = defaultPalette
    .map(culori.filterHueRotate(shift.hueRotate))
    .map(culori.filterInvert(shift.invert))
    .map(culori.filterBrightness(shift.brightness))
    .map(culori.filterContrast(shift.contrast))

  setPalette(currentPalette)
}

export const lerpColorShift = (
  a: ColorShift,
  b: ColorShift,
  t: number
): ColorShift => {
  return {
    hueRotate: lerp(a.hueRotate, b.hueRotate, t),
    invert: lerp(a.invert, b.invert, t),
    brightness: lerp(a.brightness, b.brightness, t),
    contrast: lerp(a.contrast, b.contrast, t),
  }
}

export const setPalette = (palette: Palette) => {
  for (let i = 0; i < palette.length; i++) {
    const color = palette[i]!
    rootElement.style.setProperty('--palette-' + i, culori.formatRgb(color))
  }
}

export const getPaletteColor = (index: number): culori.Rgb => {
  return rgb(currentPalette[index]!)
}
