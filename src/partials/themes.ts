/**
 * themes.ts — 多主题定义
 *
 * 四套主题：
 *   ios-light   iOS/macOS 亮色（默认）
 *   ios-dark    iOS/macOS 暗色
 *   tg-light    Telegram 风格亮色
 *   coracle-dark 原 Coracle 暗色（保留兼容）
 */

export type ThemeName = "ios-light" | "ios-dark" | "tg-light" | "coracle-dark"

export interface ThemeColors {
  accent: string
  "neutral-50": string
  "neutral-100": string
  "neutral-200": string
  "neutral-300": string
  "neutral-400": string
  "neutral-500": string
  "neutral-600": string
  "neutral-700": string
  "neutral-800": string
  "neutral-900": string
  "neutral-950": string
  "tinted-100": string
  "tinted-200": string
  "tinted-400": string
  "tinted-500": string
  "tinted-600": string
  "tinted-700": string
  "tinted-800": string
  success: string
  warning: string
  danger: string
  // Chat 气泡专用变量
  "bubble-self-bg": string
  "bubble-self-text": string
  "bubble-other-bg": string
  "bubble-other-text": string
  // 毛玻璃 / 面板背景
  "surface": string
  "surface-elevated": string
  "surface-overlay": string
}

export const THEMES: Record<ThemeName, ThemeColors> = {
  // ─── iOS / macOS 亮色 ─────────────────────────────────────────────────────
  "ios-light": {
    accent: "#007aff",
    "neutral-50": "#000000",
    "neutral-100": "#1c1c1e",
    "neutral-200": "#2c2c2e",
    "neutral-300": "#3a3a3c",
    "neutral-400": "#48484a",
    "neutral-500": "#8e8e93",
    "neutral-600": "#aeaeb2",
    "neutral-700": "#d1d1d6",
    "neutral-800": "#f2f2f7",
    "neutral-900": "#f9f9fb",
    "neutral-950": "#ffffff",
    "tinted-100": "#f2f2f7",
    "tinted-200": "#e5e5ea",
    "tinted-400": "#c7c7cc",
    "tinted-500": "#aeaeb2",
    "tinted-600": "#8e8e93",
    "tinted-700": "#636366",
    "tinted-800": "#48484a",
    success: "#34c759",
    warning: "#ff9500",
    danger: "#ff3b30",
    "bubble-self-bg": "#007aff",
    "bubble-self-text": "#ffffff",
    "bubble-other-bg": "#e9e9eb",
    "bubble-other-text": "#1c1c1e",
    "surface": "#ffffff",
    "surface-elevated": "#f2f2f7",
    "surface-overlay": "rgba(242,242,247,0.85)",
  },

  // ─── iOS / macOS 暗色 ─────────────────────────────────────────────────────
  "ios-dark": {
    accent: "#0a84ff",
    "neutral-50": "#ffffff",
    "neutral-100": "#f2f2f7",
    "neutral-200": "#aeaeb2",
    "neutral-300": "#8e8e93",
    "neutral-400": "#636366",
    "neutral-500": "#48484a",
    "neutral-600": "#3a3a3c",
    "neutral-700": "#2c2c2e",
    "neutral-800": "#1c1c1e",
    "neutral-900": "#000000",
    "neutral-950": "#000000",
    "tinted-100": "#1c1c1e",
    "tinted-200": "#2c2c2e",
    "tinted-400": "#3a3a3c",
    "tinted-500": "#48484a",
    "tinted-600": "#636366",
    "tinted-700": "#8e8e93",
    "tinted-800": "#aeaeb2",
    success: "#30d158",
    warning: "#ff9f0a",
    danger: "#ff453a",
    "bubble-self-bg": "#0a84ff",
    "bubble-self-text": "#ffffff",
    "bubble-other-bg": "#2c2c2e",
    "bubble-other-text": "#f2f2f7",
    "surface": "#1c1c1e",
    "surface-elevated": "#2c2c2e",
    "surface-overlay": "rgba(28,28,30,0.85)",
  },

  // ─── Telegram 亮色 ────────────────────────────────────────────────────────
  "tg-light": {
    accent: "#2aabee",
    "neutral-50": "#000000",
    "neutral-100": "#1a1a1a",
    "neutral-200": "#333333",
    "neutral-300": "#555555",
    "neutral-400": "#777777",
    "neutral-500": "#999999",
    "neutral-600": "#bbbbbb",
    "neutral-700": "#e0e0e0",
    "neutral-800": "#f0f2f5",
    "neutral-900": "#f8f9fa",
    "neutral-950": "#ffffff",
    "tinted-100": "#f0f2f5",
    "tinted-200": "#e3e5e8",
    "tinted-400": "#c9cdd1",
    "tinted-500": "#a9adb2",
    "tinted-600": "#898d93",
    "tinted-700": "#636770",
    "tinted-800": "#444950",
    success: "#4dcd5e",
    warning: "#f5a623",
    danger: "#e53935",
    "bubble-self-bg": "#effdde",
    "bubble-self-text": "#1a1a1a",
    "bubble-other-bg": "#ffffff",
    "bubble-other-text": "#1a1a1a",
    "surface": "#ffffff",
    "surface-elevated": "#f0f2f5",
    "surface-overlay": "rgba(240,242,245,0.9)",
  },

  // ─── 原 Coracle 暗色（保留） ──────────────────────────────────────────────
  "coracle-dark": {
    accent: "#FC560E",
    "neutral-50": "#FAFAFA",
    "neutral-100": "#F5F5F5",
    "neutral-200": "#E5E5E5",
    "neutral-300": "#D4D4D4",
    "neutral-400": "#A3A3A3",
    "neutral-500": "#737373",
    "neutral-600": "#525252",
    "neutral-700": "#404040",
    "neutral-800": "#262626",
    "neutral-900": "#171717",
    "neutral-950": "#0A0A0A",
    "tinted-100": "#F1EAE7",
    "tinted-200": "#DED3CF",
    "tinted-400": "#B9A69E",
    "tinted-500": "#756A65",
    "tinted-600": "#5A524F",
    "tinted-700": "#3E3A38",
    "tinted-800": "#332f2d",
    success: "#12D2B0",
    warning: "#FCAB0E",
    danger: "#dc0c0c",
    "bubble-self-bg": "#FC560E",
    "bubble-self-text": "#ffffff",
    "bubble-other-bg": "#262626",
    "bubble-other-text": "#F5F5F5",
    "surface": "#262626",
    "surface-elevated": "#404040",
    "surface-overlay": "rgba(23,23,23,0.85)",
  },
}

export const THEME_LABELS: Record<ThemeName, string> = {
  "ios-light": "亮色（iOS）",
  "ios-dark": "暗色（iOS）",
  "tg-light": "Telegram 绿",
  "coracle-dark": "Coracle 暗色",
}

/** 判断某主题是否属于暗色（用于 Tailwind dark 类） */
export const isDarkTheme = (name: ThemeName) =>
  name === "ios-dark" || name === "coracle-dark"
