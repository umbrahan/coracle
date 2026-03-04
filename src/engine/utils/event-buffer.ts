import {writable, get} from "svelte/store"
import type {TrustedEvent} from "@welshman/util"
import {uniqBy, sortBy} from "@welshman/lib"

/**
 * EventBuffer - 纯内存的事件缓冲类
 *
 * 用于内存订阅流场景，提供事件存储和去重功能
 * 所有事件仅保存在内存中，不持久化到 IndexedDB
 */
export class EventBuffer {
  private store = writable<{
    events: TrustedEvent[]
    hasMore: boolean
    loading: boolean
  }>({
    events: [],
    hasMore: true,
    loading: false,
  })

  /**
   * 订阅缓冲区状态变化
   * @param run 订阅回调函数
   * @returns 取消订阅函数
   */
  subscribe(run: (value: {events: TrustedEvent[]; hasMore: boolean; loading: boolean}) => void) {
    return this.store.subscribe(run)
  }

  /**
   * 添加事件到缓冲区
   * 自动去重并按时间倒序排序
   * @param events 要添加的事件数组
   */
  add(events: TrustedEvent[]) {
    this.store.update($state => {
      // 去重：合并新事件和已有事件，通过 id 去重
      const merged = uniqBy(e => e.id, [...events, ...$state.events])

      // 按创建时间倒序排序（最新的在前面）
      return {
        ...$state,
        events: sortBy((e: TrustedEvent) => -e.created_at, merged),
      }
    })
  }

  /**
   * 重置缓冲区
   * 清空所有事件并重置状态
   */
  reset() {
    this.store.set({
      events: [],
      hasMore: true,
      loading: false,
    })
  }

  /**
   * 设置加载状态
   * @param loading 是否正在加载
   */
  setLoading(loading: boolean) {
    this.store.update($state => ({
      ...$state,
      loading,
    }))
  }

  /**
   * 设置是否有更多数据
   * @param hasMore 是否有更多数据可加载
   */
  setHasMore(hasMore: boolean) {
    this.store.update($state => ({
      ...$state,
      hasMore,
    }))
  }

  /**
   * 获取当前状态
   * @returns 当前缓冲区状态
   */
  getState() {
    return get(this.store)
  }

  /**
   * 获取当前事件列表
   * @returns 当前事件数组
   */
  getEvents(): TrustedEvent[] {
    return get(this.store).events
  }
}
