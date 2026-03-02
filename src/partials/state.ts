import Bowser from "bowser"
import {derived, writable, get} from "svelte/store"
import {fromPairs} from "@welshman/lib"
import {synced, localStorageProvider} from "@welshman/store"
import {parseHex} from "src/util/html"
import {THEMES, isDarkTheme, type ThemeName} from "src/partials/themes"

// Browser

export const browser = Bowser.parse(window.navigator.userAgent)

// Settings

export const appName = import.meta.env.VITE_APP_NAME

// Install prompt

export const installPrompt = writable(null)

export const installAsPWA = () => {
  get(installPrompt).prompt()

  get(installPrompt).userChoice.then(result => {
    installPrompt.set(null)
  })
}

// Themes

export const theme = synced<ThemeName>({
  key: "ui/theme",
  defaultValue: "ios-dark",
  storage: localStorageProvider,
})

theme.subscribe(value => {
  if (isDarkTheme(value)) {
    document.documentElement.classList.add("dark")
  } else {
    document.documentElement.classList.remove("dark")
  }
  document.documentElement.setAttribute("data-theme", value)
})

export const toggleTheme = () =>
  theme.update(t => (isDarkTheme(t) ? "ios-light" : "ios-dark"))

export const setTheme = (name: ThemeName) => theme.set(name)

export const themeColors = derived(theme, $theme => {
  const colors = THEMES[$theme] ?? THEMES["ios-dark"]
  return fromPairs(
    Object.entries(colors).flatMap(([k, v]) => {
      // 不对特殊 surface 变量做亮度调整
      if (k.startsWith("bubble-") || k.startsWith("surface")) {
        return [[k, v]]
      }
      return [
        [k, v],
        [`${k}-l`, adjustBrightness(v, 10)],
        [`${k}-d`, adjustBrightness(v, -10)],
      ]
    }),
  )
})

export const themeVariables = derived(themeColors, $colors =>
  Object.entries($colors)
    .map(([k, v]) => `--${k}: ${v};`)
    .join("\n"),
)

export const themeBackgroundGradient = derived(themeColors, $colors => {
  const color = parseHex($colors["neutral-800"])

  return {
    rgba: `rgba(${color.join(", ")}, 0.5)`,
    rgb: `rgba(${color.join(", ")})`,
  }
})

function adjustBrightness(hexColor, brightnessPercent) {
  // Remove '#' if present
  hexColor = hexColor.replace("#", "")

  // Convert hex to RGB
  const r = parseInt(hexColor.substring(0, 2), 16)
  const g = parseInt(hexColor.substring(2, 4), 16)
  const b = parseInt(hexColor.substring(4, 6), 16)

  // Adjust brightness
  const adjust = brightnessPercent / 100 // Adjustment factor
  const adjustedR = Math.round(r + r * adjust)
  const adjustedG = Math.round(g + g * adjust)
  const adjustedB = Math.round(b + b * adjust)

  // Ensure RGB values are within [0, 255] range
  const clamp = value => Math.max(0, Math.min(255, value))

  // Convert RGB back to hex
  const adjustedHex =
    "#" +
    clamp(adjustedR).toString(16).padStart(2, "0") +
    clamp(adjustedG).toString(16).padStart(2, "0") +
    clamp(adjustedB).toString(16).padStart(2, "0")

  return adjustedHex
}
