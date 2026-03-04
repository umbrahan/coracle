import {vi} from "vitest"
import {dotenv} from "dotenv/config"

// 模拟环境变量
process.env.VITE_CLIENT_ID = "test-client"
process.env.VITE_CLIENT_NAME = "Coracle Test"
process.env.VITE_DEFAULT_FOLLOWS = ""
process.env.VITE_DEFAULT_RELAYS = "wss://relay.damus.io,wss://relay.nostr.bg"
process.env.VITE_INDEXER_RELAYS = "wss://relay.damus.io"
process.env.VITE_DUFFLEPUD_URL = ""
process.env.VITE_DVM_RELAYS = ""
process.env.VITE_ENABLE_MARKET = "false"
process.env.VITE_ENABLE_ZAPS = "true"
process.env.VITE_BLUR_CONTENT = "true"
process.env.VITE_BLOSSOM_URLS = ""
process.env.VITE_ONBOARDING_LISTS = ""
process.env.VITE_PLATFORM_PUBKEY = ""
process.env.VITE_PLATFORM_ZAP_SPLIT = "0"
process.env.VITE_SEARCH_RELAYS = ""
process.env.VITE_SIGNER_RELAYS = ""
process.env.VITE_APP_URL = "http://localhost:5173"
process.env.VITE_APP_NAME = "Coracle"
process.env.VITE_APP_LOGO = "/public/logo.png"

// 模拟浏览器环境
global.localStorage = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(() => {}),
  removeItem: vi.fn(() => {}),
  clear: vi.fn(() => {}),
  length: 0,
  key: vi.fn(() => null),
}

global.sessionStorage = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(() => {}),
  removeItem: vi.fn(() => {}),
  clear: vi.fn(() => {}),
  length: 0,
  key: vi.fn(() => null),
}

global.window = global.window || {}
global.document = {
  createElement: vi.fn(),
  getElementById: vi.fn(),
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(() => []),
} as any

global.navigator = {
  userAgent: 'test-agent',
}

// 模拟 IndexedDB
global.indexedDB = {
  open: vi.fn(() => ({
    onsuccess: null,
    onerror: null,
    result: {
      close: vi.fn(),
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          get: vi.fn(),
          getAll: vi.fn(),
          put: vi.fn(),
          delete: vi.fn(),
          index: vi.fn(),
        })),
      })),
    },
  })),
  deleteDatabase: vi.fn(),
}

// 模拟 requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16))
global.cancelAnimationFrame = vi.fn()

// 模拟 setTimeout/setInterval (使用原生实现，避免递归)
global.setTimeout = setTimeout as any
global.clearTimeout = clearTimeout as any
global.setInterval = setInterval as any
global.clearInterval = clearInterval as any
