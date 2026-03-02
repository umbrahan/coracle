/**
 * widget/index.ts — 可嵌入聊天组件入口
 *
 * 提供两种使用方式：
 *
 * 1. Svelte 组件（推荐，轻量）
 *    import {ChatWidget} from 'coracle-chat/widget'
 *    <ChatWidget myPubkey="..." peerPubkey="..." theme="ios-dark" />
 *
 * 2. Web Component（任意框架）
 *    import 'coracle-chat/widget'
 *    <coracle-chat my-pubkey="..." peer-pubkey="..." theme="ios-dark"></coracle-chat>
 *
 * 构建：
 *    pnpm build:widget
 *    → dist/widget/coracle-chat.js（ESM）
 *    → dist/widget/coracle-chat.iife.js（可直接 <script> 引入）
 */

// Re-export Svelte component for Svelte/Vite consumers
export {default as ChatWidget} from "./ChatWidget.svelte"

// Re-export theme types for TypeScript consumers
export type {ThemeName} from "src/partials/themes"
export {THEMES, THEME_LABELS, isDarkTheme} from "src/partials/themes"

/**
 * Web Component 注册
 *
 * 注意：Svelte 的 customElement 编译模式（<svelte:options customElement="...">）
 * 会自动把组件封装进 Shadow DOM。当使用 vite lib 构建时会自动注册。
 * 使用方直接 import 本文件即可获得 <coracle-chat> 自定义元素。
 */

// Ensure the custom element is defined (Svelte registers it automatically
// when compiled with `customElement` option and the module is imported)
import "./ChatWidget.svelte"
