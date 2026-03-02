/**
 * 中继策略工具模块 - Coracle Chat 简化版
 *
 * 获取聊天专用中继
 */

/**
 * 中继类型枚举
 */
export enum RelayType {
  /** 聊天和私信中继 */
  Chat = "Chat",
}

/**
 * 中继集合接口
 */
export interface RelaySet {
  /** 中继 URL 列表 */
  urls: string[]
  /** 中继类型 */
  type: RelayType
  /** 是否只读 */
  readOnly?: boolean
}

/**
 * 获取 Chat 专用中继
 *
 * 返回用于聊天的中继集合
 * 优先使用 localStorage 中配置的中继，如果没有则使用默认中继
 */
export function getChatRelays(): RelaySet {
  // 尝试从 localStorage 获取用户配置的中继
  const storedRelays = localStorage.getItem("chat_relays")
  let urls: string[]

  if (storedRelays) {
    try {
      urls = JSON.parse(storedRelays)
      if (Array.isArray(urls) && urls.length > 0) {
        return {
          urls,
          type: RelayType.Chat,
          readOnly: false,
        }
      }
    } catch (e) {
      // 解析失败，使用默认中继
    }
  }

  // 默认中继
  urls = ["wss://relay.damus.io", "wss://nos.lol"]

  return {
    urls,
    type: RelayType.Chat,
    readOnly: false,
  }
}

/**
 * 保存聊天中继配置
 *
 * @param relayUrls - 中继 URL 列表
 */
export function saveChatRelays(relayUrls: string[]): void {
  localStorage.setItem("chat_relays", JSON.stringify(relayUrls))
}
