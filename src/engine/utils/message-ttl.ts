import type {TrustedEvent} from "@welshman/util"
import {getTagValue} from "@welshman/util"
import {writable, get} from "svelte/store"

/**
 * MessageTTLManager - NIP-40 消息过期管理器
 *
 * 负责管理带 TTL (Time To Live) 的消息列表。
 * 每秒检查一次消息过期状态，自动移除过期消息并触发 UI 更新。
 *
 * NIP-40 规范：
 * - 使用 "expiration" tag 标记过期时间戳
 * - 过期时间戳是 Unix 时间戳（秒）
 * - 消息在过期时间后应该被隐藏或删除
 */
export class MessageTTLManager {
  // 存储消息及其过期时间: {eventId: {event, expiresAt}}
  private messages = new Map<string, {event: TrustedEvent; expiresAt: number | null}>()

  // 定时器引用
  private interval: ReturnType<typeof setInterval> | null = null

  // 过期回调函数列表
  private expiredCallbacks: Array<(event: TrustedEvent) => void> = []

  // Svelte store 用于触发 UI 更新
  private store = writable<{
    events: TrustedEvent[]
    expired: string[]
  }>({
    events: [],
    expired: [],
  })

  // 检查间隔（毫秒），默认每秒检查一次
  private checkInterval: number

  constructor(checkInterval: number = 1000) {
    this.checkInterval = checkInterval
  }

  /**
   * 从事件中提取过期时间
   * @param event Nostr 事件
   * @returns 过期时间戳（Unix 时间戳，秒），如果没有过期时间则返回 null
   */
  private extractExpiration(event: TrustedEvent): number | null {
    const expirationTag = getTagValue("expiration", event.tags)

    if (expirationTag) {
      const timestamp = parseInt(expirationTag, 10)
      return isNaN(timestamp) ? null : timestamp
    }

    return null
  }

  /**
   * 检查消息是否已过期
   * @param expiresAt 过期时间戳（Unix 时间戳，秒）
   * @returns 如果已过期返回 true
   */
  private isExpired(expiresAt: number | null): boolean {
    if (expiresAt === null) return false
    return Math.floor(Date.now() / 1000) > expiresAt
  }

  /**
   * 添加消息到管理器
   * @param event 要添加的消息事件
   * @param ttl 可选的 TTL 秒数，如果提供则覆盖事件中的 expiration tag
   */
  add(event: TrustedEvent, ttl?: number) {
    // 使用提供的 ttl 或从事件中提取过期时间
    let expiresAt: number | null

    if (ttl !== undefined) {
      expiresAt = Math.floor(Date.now() / 1000) + ttl
    } else {
      expiresAt = this.extractExpiration(event)
    }

    this.messages.set(event.id, {event, expiresAt})

    // 更新 store
    this.updateStore()
  }

  /**
   * 批量添加消息
   * @param events 要添加的消息事件数组
   */
  addAll(events: TrustedEvent[]) {
    for (const event of events) {
      this.add(event)
    }
  }

  /**
   * 移除指定消息
   * @param eventId 要移除的消息 ID
   */
  remove(eventId: string) {
    this.messages.delete(eventId)
    this.updateStore()
  }

  /**
   * 清空所有消息
   */
  clear() {
    this.messages.clear()
    this.updateStore()
  }

  /**
   * 检查并移除过期消息
   * @returns 被移除的过期消息数组
   */
  private checkExpired(): TrustedEvent[] {
    const expired: TrustedEvent[] = []
    const now = Math.floor(Date.now() / 1000)

    const entries = Array.from(this.messages.entries())

    for (const [id, {event, expiresAt}] of entries) {
      if (expiresAt !== null && now > expiresAt) {
        expired.push(event)
        this.messages.delete(id)
      }
    }

    return expired
  }

  /**
   * 更新 Svelte store
   */
  private updateStore() {
    this.store.set({
      events: this.getValidMessages(),
      expired: [], // 在检查时填充
    })
  }

  /**
   * 执行一次过期检查
   */
  tick() {
    const expired = this.checkExpired()

    if (expired.length > 0) {
      // 触发过期回调
      for (const callback of this.expiredCallbacks) {
        for (const event of expired) {
          callback(event)
        }
      }

      // 更新 store
      this.store.set({
        events: this.getValidMessages(),
        expired: expired.map(e => e.id),
      })
    }
  }

  /**
   * 启动定时器，开始定期检查过期消息
   */
  start() {
    if (this.interval !== null) {
      return // 已经启动
    }

    this.interval = setInterval(() => {
      this.tick()
    }, this.checkInterval)
  }

  /**
   * 停止定时器
   */
  stop() {
    if (this.interval !== null) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  /**
   * 获取当前所有有效的（未过期的）消息
   * @returns 有效的消息数组，按创建时间倒序排列
   */
  getValidMessages(): TrustedEvent[] {
    return Array.from(this.messages.values())
      .filter(({expiresAt}) => !this.isExpired(expiresAt))
      .map(({event}) => event)
      .sort((a, b) => b.created_at - a.created_at)
  }

  /**
   * 获取指定消息的剩余时间（秒）
   * @param eventId 消息 ID
   * @returns 剩余秒数，如果消息不存在或无过期时间则返回 null
   */
  getRemainingTime(eventId: string): number | null {
    const entry = this.messages.get(eventId)

    if (!entry || entry.expiresAt === null) {
      return null
    }

    const now = Math.floor(Date.now() / 1000)
    const remaining = entry.expiresAt - now

    return remaining > 0 ? remaining : 0
  }

  /**
   * 检查指定消息是否已过期
   * @param eventId 消息 ID
   * @returns 如果消息已过期返回 true
   */
  isMessageExpired(eventId: string): boolean {
    const entry = this.messages.get(eventId)

    if (!entry) return true // 不存在的消息视为已过期
    if (entry.expiresAt === null) return false

    return this.isExpired(entry.expiresAt)
  }

  /**
   * 订阅过期事件
   * @param callback 当消息过期时调用的回调函数
   * @returns 取消订阅的函数
   */
  onExpired(callback: (event: TrustedEvent) => void): () => void {
    this.expiredCallbacks.push(callback)

    // 返回取消订阅函数
    return () => {
      const index = this.expiredCallbacks.indexOf(callback)
      if (index !== -1) {
        this.expiredCallbacks.splice(index, 1)
      }
    }
  }

  /**
   * 订阅状态变化（用于 Svelte 组件）
   * @param run 订阅回调函数
   * @returns 取消订阅函数
   */
  subscribe(run: (value: {events: TrustedEvent[]; expired: string[]}) => void) {
    return this.store.subscribe(run)
  }

  /**
   * 获取当前状态
   * @returns 当前管理器状态
   */
  getState() {
    return get(this.store)
  }

  /**
   * 获取当前消息总数（包括过期的）
   */
  get size(): number {
    return this.messages.size
  }

  /**
   * 检查定时器是否正在运行
   */
  get isRunning(): boolean {
    return this.interval !== null
  }
}

/**
 * 创建一个默认配置的 MessageTTLManager 实例
 * @param checkInterval 检查间隔（毫秒），默认 1000ms
 * @returns MessageTTLManager 实例
 */
export const createMessageTTLManager = (checkInterval: number = 1000) => {
  return new MessageTTLManager(checkInterval)
}
