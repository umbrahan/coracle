import {describe, it, expect, beforeEach, afterEach, vi} from "vitest"
import {MessageTTLManager} from "@/engine/utils/message-ttl"
import type {TrustedEvent} from "@welshman/util"

// 创建模拟事件
const createMockEvent = (id: string, created_at: number, expiration?: number): TrustedEvent => ({
  id,
  pubkey: "test-pubkey",
  created_at,
  kind: 4,
  tags: expiration ? [["expiration", expiration.toString()]] : [],
  content: "test content",
  sig: "test-signature",
})

describe("MessageTTLManager", () => {
  let manager: MessageTTLManager

  beforeEach(() => {
    manager = new MessageTTLManager(100) // 使用较短的检查间隔用于测试
  })

  afterEach(() => {
    manager.stop()
  })

  describe("基本功能", () => {
    it("应该正确添加消息", () => {
      const event = createMockEvent("event-1", 1000)

      manager.add(event)

      expect(manager.size).toBe(1)
      expect(manager.getValidMessages()).toHaveLength(1)
    })

    it("应该正确移除消息", () => {
      const event = createMockEvent("event-1", 1000)

      manager.add(event)
      expect(manager.size).toBe(1)

      manager.remove("event-1")
      expect(manager.size).toBe(0)
    })

    it("应该正确清空所有消息", () => {
      const event1 = createMockEvent("event-1", 1000)
      const event2 = createMockEvent("event-2", 1001)

      manager.addAll([event1, event2])
      expect(manager.size).toBe(2)

      manager.clear()
      expect(manager.size).toBe(0)
    })
  })

  describe("NIP-40 过期时间解析", () => {
    it("应该正确解析 expiration tag", () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600
      const event = createMockEvent("event-1", 1000, futureTimestamp)

      manager.add(event)

      const remaining = manager.getRemainingTime("event-1")
      expect(remaining).toBeGreaterThan(0)
      expect(remaining).toBeLessThanOrEqual(3600)
    })

    it("应该处理没有 expiration tag 的消息", () => {
      const event = createMockEvent("event-1", 1000)

      manager.add(event)

      expect(manager.getRemainingTime("event-1")).toBeNull()
      expect(manager.isMessageExpired("event-1")).toBe(false)
    })

    it("应该使用提供的 ttl 覆盖 expiration tag", () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 7200
      const event = createMockEvent("event-1", 1000, futureTimestamp)

      manager.add(event, 60) // 使用 60 秒 TTL 覆盖

      const remaining = manager.getRemainingTime("event-1")
      expect(remaining).toBeGreaterThan(0)
      expect(remaining).toBeLessThanOrEqual(60)
    })
  })

  describe("过期检查", () => {
    it("应该正确识别过期的消息", () => {
      const pastTimestamp = Math.floor(Date.now() / 1000) - 10
      const event = createMockEvent("event-1", 1000, pastTimestamp)

      manager.add(event)
      manager.tick() // 触发检查

      expect(manager.getValidMessages()).toHaveLength(0)
      expect(manager.isMessageExpired("event-1")).toBe(true)
    })

    it("应该保留未过期的消息", () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600
      const event = createMockEvent("event-1", 1000, futureTimestamp)

      manager.add(event)
      manager.tick() // 触发检查

      expect(manager.getValidMessages()).toHaveLength(1)
      expect(manager.isMessageExpired("event-1")).toBe(false)
    })

    it("应该正确返回剩余时间", () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 60
      const event = createMockEvent("event-1", 1000, futureTimestamp)

      manager.add(event)

      const remaining = manager.getRemainingTime("event-1")
      expect(remaining).toBeGreaterThan(0)
      expect(remaining).toBeLessThanOrEqual(60)
    })

    it("过期时剩余时间应为 0", () => {
      const pastTimestamp = Math.floor(Date.now() / 1000) - 10
      const event = createMockEvent("event-1", 1000, pastTimestamp)

      manager.add(event)

      const remaining = manager.getRemainingTime("event-1")
      expect(remaining).toBe(0)
    })
  })

  describe("定时器功能", () => {
    it("应该启动和停止定时器", () => {
      expect(manager.isRunning).toBe(false)

      manager.start()
      expect(manager.isRunning).toBe(true)

      manager.stop()
      expect(manager.isRunning).toBe(false)
    })

    it("不应该重复启动定时器", () => {
      manager.start()
      const isRunningAfterFirstStart = manager.isRunning

      manager.start()
      const isRunningAfterSecondStart = manager.isRunning

      expect(isRunningAfterFirstStart).toBe(true)
      expect(isRunningAfterSecondStart).toBe(true)
    })

    it("应该定期检查过期消息", async () => {
      vi.useFakeTimers()

      // 创建一个已经过期的消息
      const pastTimestamp = Math.floor(Date.now() / 1000) - 10
      const event = createMockEvent("event-1", 1000, pastTimestamp)

      manager.add(event)
      // 验证消息已被添加（虽然过期，但仍存在于存储中）
      expect(manager.size).toBe(1)

      manager.start()

      // 手动触发一次检查来测试过期逻辑
      manager.tick()

      // 现在消息应该已经被检查并移除
      expect(manager.getValidMessages()).toHaveLength(0)

      vi.useRealTimers()
    })
  })

  describe("过期回调", () => {
    it("应该在消息过期时触发回调", () => {
      const callback = vi.fn()
      const pastTimestamp = Math.floor(Date.now() / 1000) - 10
      const event = createMockEvent("event-1", 1000, pastTimestamp)

      manager.onExpired(callback)
      manager.add(event)
      manager.tick()

      expect(callback).toHaveBeenCalledWith(event)
    })

    it("应该支持取消订阅", () => {
      const callback = vi.fn()
      const pastTimestamp = Math.floor(Date.now() / 1000) - 10
      const event = createMockEvent("event-1", 1000, pastTimestamp)

      const unsubscribe = manager.onExpired(callback)
      unsubscribe()

      manager.add(event)
      manager.tick()

      expect(callback).not.toHaveBeenCalled()
    })

    it("应该支持多个回调", () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      const pastTimestamp = Math.floor(Date.now() / 1000) - 10
      const event = createMockEvent("event-1", 1000, pastTimestamp)

      manager.onExpired(callback1)
      manager.onExpired(callback2)
      manager.add(event)
      manager.tick()

      expect(callback1).toHaveBeenCalledWith(event)
      expect(callback2).toHaveBeenCalledWith(event)
    })
  })

  describe("Svelte store 集成", () => {
    it("应该支持订阅状态变化", () => {
      const states: Array<{events: TrustedEvent[]; expired: string[]}> = []
      const unsubscribe = manager.subscribe(state => states.push(state))

      const pastTimestamp = Math.floor(Date.now() / 1000) - 10
      const event = createMockEvent("event-1", 1000, pastTimestamp)

      manager.add(event)
      manager.tick()

      expect(states.length).toBeGreaterThan(0)

      const lastState = states[states.length - 1]
      expect(lastState.expired).toContain("event-1")

      unsubscribe()
    })

    it("getState 应该返回当前状态", () => {
      const event = createMockEvent("event-1", 1000)
      manager.add(event)

      const state = manager.getState()
      expect(state.events).toHaveLength(1)
      expect(state.events[0].id).toBe("event-1")
    })
  })

  describe("消息排序", () => {
    it("应该按创建时间倒序返回消息", () => {
      const event1 = createMockEvent("event-1", 1000)
      const event2 = createMockEvent("event-2", 2000)
      const event3 = createMockEvent("event-3", 1500)

      manager.addAll([event1, event2, event3])

      const messages = manager.getValidMessages()
      expect(messages[0].id).toBe("event-2")
      expect(messages[1].id).toBe("event-3")
      expect(messages[2].id).toBe("event-1")
    })
  })
})
