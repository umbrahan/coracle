/**
 * 中继策略工具模块
 *
 * 为内存订阅流提供不同类型的中继选择策略
 * Posts - 用于帖子和内容
 * Chat - 用于私信和聊天
 * Search - 用于搜索
 * Indexer - 用于索引查询
 */

import {env} from "src/engine/state"

/**
 * 中继类型枚举
 */
export enum RelayType {
  /** 帖子和内容中继 */
  Posts = "Posts",
  /** 聊天和私信中继 */
  Chat = "Chat",
  /** 搜索中继 */
  Search = "Search",
  /** 索引中继 */
  Indexer = "Indexer",
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
 * 获取 Posts 专用中继
 *
 * 返回用于发布和读取帖子的中继集合
 * 优先使用默认中继，如果需要可以添加索引中继作为后备
 */
export function getPostRelays(): RelaySet {
  return {
    urls: [...env.DEFAULT_RELAYS],
    type: RelayType.Posts,
    readOnly: false,
  }
}

/**
 * 获取 Chat 专用中继
 *
 * 返回用于聊天的中继集合
 * 这些中继应该支持低延迟的消息传递
 */
export function getChatRelays(): RelaySet {
  return {
    urls: [...env.DEFAULT_RELAYS],
    type: RelayType.Chat,
    readOnly: false,
  }
}

/**
 * 获取 Search 专用中继
 *
 * 返回支持 NIP-50 搜索的中继集合
 */
export function getSearchRelays(): RelaySet {
  return {
    urls: [...env.SEARCH_RELAYS],
    type: RelayType.Search,
    readOnly: true,
  }
}

/**
 * 获取 Indexer 专用中继
 *
 * 返回索引中继集合，用于查询历史数据和用户元数据
 */
export function getIndexerRelays(): RelaySet {
  return {
    urls: [...env.INDEXER_RELAYS],
    type: RelayType.Indexer,
    readOnly: true,
  }
}

/**
 * 统一获取接口
 *
 * 根据中继类型返回对应的中继集合
 *
 * @param type - 中继类型
 * @returns 中继集合
 */
export function getRelaysForType(type: RelayType): RelaySet {
  switch (type) {
    case RelayType.Posts:
      return getPostRelays()
    case RelayType.Chat:
      return getChatRelays()
    case RelayType.Search:
      return getSearchRelays()
    case RelayType.Indexer:
      return getIndexerRelays()
    default:
      return {
        urls: [],
        type: RelayType.Posts,
      }
  }
}

/**
 * 合并多个中继集合
 *
 * @param sets - 中继集合数组
 * @returns 合并后的中继集合
 */
export function mergeRelaySets(...sets: RelaySet[]): RelaySet {
  const urls = new Set<string>()
  let primaryType = RelayType.Posts
  let readOnly = true

  for (const set of sets) {
    set.urls.forEach(url => urls.add(url))
    primaryType = set.type
    if (!set.readOnly) {
      readOnly = false
    }
  }

  return {
    urls: Array.from(urls),
    type: primaryType,
    readOnly,
  }
}

/**
 * 从中继集合中过滤可用的中继
 *
 * @param set - 中继集合
 * @param pool - 连接池
 * @returns 可用的中继 URL 列表
 */
export function getActiveRelays(set: RelaySet, pool: any): string[] {
  return set.urls.filter(url => {
    const relay = pool.relays.get(url)
    return relay && relay.socket?.readyState === 1 // OPEN
  })
}
