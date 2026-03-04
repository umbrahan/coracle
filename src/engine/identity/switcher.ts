// switcher.ts - 身份切换器模块
// 处理完整身份切换流程，包括清理内存和断开连接

import {get} from "svelte/store"
import {pubkey, sessions, loginWithNip01, publishThunk} from "@welshman/app"
import {repository} from "@welshman/app"
import {Pool} from "@welshman/net"
import {Nip01Signer} from "@welshman/signer"
import {makeEvent, PROFILE} from "@welshman/util"
import {deleteDB} from "idb"
import type {IdentityMeta} from "./types"
import {identityManager} from "./manager"
import * as Storage from "./storage"

// 默认 relay 列表，用于发布 profile 等元数据
const getDefaultRelays = () =>
  (import.meta.env.VITE_DEFAULT_RELAYS || "relay.damus.io,nos.lol")
    .split(",")
    .map((r: string) => r.trim())
    .filter(Boolean)
    .map((r: string) => (r.startsWith("wss://") || r.startsWith("ws://") ? r : `wss://${r}`))

// 重新导出主要类型
export type {IdentityMeta} from "./types"

/**
 * IndexedDB 数据库名称（需要与主应用保持一致）
 */
const DB_NAME = "coracle"

/**
 * IdentitySwitcher 类
 * 处理身份切换的所有操作
 */
export class IdentitySwitcher {
  /**
   * 切换到指定身份
   * 完整的切换流程：验证密码 -> 解密私钥 -> 清理状态 -> 设置新身份
   */
  async switchIdentity(targetPubkey: string, password: string): Promise<boolean> {
    try {
      // 1. 获取身份元数据
      const identity = identityManager.getIdentity(targetPubkey)
      if (!identity) {
        throw new Error("Identity not found")
      }

      // 2. 获取加密的私钥
      const encryptedKey = identityManager.getEncryptedKey(targetPubkey)
      if (!encryptedKey) {
        throw new Error("No encrypted key found for this identity")
      }

      // 3. 解密私钥
      const privateKey = await Storage.decryptPrivateKey(encryptedKey, password)

      // 4. 清理当前状态
      await this.clearMemoryState()
      await this.disconnectRelays()
      await this.clearIndexedDB()

      // 5. 验证私钥并获取公钥
      const tempSigner = Nip01Signer.fromSecret(privateKey)
      const derivedPubkey = await tempSigner.getPubkey()

      if (derivedPubkey !== targetPubkey) {
        throw new Error("Decrypted key does not match expected pubkey")
      }

      // 6. 使用 @welshman/app 的登录功能
      loginWithNip01(privateKey)

      // 7. 更新最后使用时间
      identityManager.updateLastUsed(targetPubkey)

      return true
    } catch (error) {
      console.error("Failed to switch identity:", error)
      throw error
    }
  }

  /**
   * 快速切换（已登录且内存中有私钥的账户间切换）
   * 不需要密码，用于已经在内存中的身份间切换
   */
  async quickSwitch(targetPubkey: string, privateKey: string): Promise<boolean> {
    try {
      // 验证身份存在
      const identity = identityManager.getIdentity(targetPubkey)
      if (!identity) {
        throw new Error("Identity not found")
      }

      // 清理状态
      await this.clearMemoryState()
      await this.disconnectRelays()

      // 创建新的 signer 并验证
      const tempSigner = Nip01Signer.fromSecret(privateKey)
      const derivedPubkey = await tempSigner.getPubkey()

      if (derivedPubkey !== targetPubkey) {
        throw new Error("Private key does not match expected pubkey")
      }

      // 使用 @welshman/app 的登录功能
      loginWithNip01(privateKey)

      // 更新最后使用时间
      identityManager.updateLastUsed(targetPubkey)

      return true
    } catch (error) {
      console.error("Failed to quick switch identity:", error)
      throw error
    }
  }

  /**
   * 登出当前账户
   * 清理所有状态但保留其他身份数据
   */
  async logout(): Promise<void> {
    try {
      // 获取当前公钥
      const $pubkey = get(pubkey)

      // 清理状态
      await this.clearMemoryState()
      await this.disconnectRelays()
      await this.clearIndexedDB()

      // 从 sessions 中移除当前会话
      if ($pubkey) {
        const $sessions = get(sessions)
        delete $sessions[$pubkey]
        sessions.set($sessions)
      }

      // 清空当前身份
      identityManager.currentIdentity.set(null)
      localStorage.removeItem("coracle_current_identity")
    } catch (error) {
      console.error("Failed to logout:", error)
      throw error
    }
  }

  /**
   * 清空内存状态
   * 清理 repository、tracker 等内存中的数据
   */
  async clearMemoryState(): Promise<void> {
    try {
      // 清空 repository 中的事件
      const $repository = repository

      if ($repository && typeof ($repository as any).clear === "function") {
        ;($repository as any).clear()
      }

      // 清空其他内存缓存
      // 注意：不清理 localStorage 中的持久化数据
    } catch (error) {
      console.error("Failed to clear memory state:", error)
    }
  }

  /**
   * 断开所有 relay 连接
   */
  async disconnectRelays(): Promise<void> {
    try {
      const pool = Pool.get()

      // Pool 可能没有直接的 sockets 属性，尝试其他方法
      if (typeof (pool as any).sockets === "object") {
        const sockets = (pool as any).sockets || []

        for (const socket of sockets) {
          try {
            if (socket && typeof socket.close === "function") {
              socket.close()
            }
          } catch (e) {
            console.warn("Failed to close socket:", e)
          }
        }
      }

      // 尝试清空 socket 池
      if (typeof (pool as any).clear === "function") {
        ;(pool as any).clear()
      }
    } catch (error) {
      console.error("Failed to disconnect relays:", error)
    }
  }

  /**
   * 清空 IndexedDB
   * 删除所有存储的数据库数据
   */
  async clearIndexedDB(): Promise<void> {
    try {
      if (!window.indexedDB) {
        console.warn("IndexedDB not available")
        return
      }

      // 删除整个数据库
      await deleteDB(DB_NAME)

      console.log("IndexedDB cleared successfully")
    } catch (error) {
      console.error("Failed to clear IndexedDB:", error)
      // 不抛出错误，允许继续流程
    }
  }

  /**
   * 添加新身份
   * 从私钥创建新身份并加密存储
   */
  async addIdentity(
    privateKey: string,
    password: string,
    name: string,
    relayUrls?: string[]
  ): Promise<IdentityMeta> {
    try {
      // 创建临时 signer 获取 pubkey
      const tempSigner = Nip01Signer.fromSecret(privateKey)
      const newPubkey = await tempSigner.getPubkey()

      // 检查是否已存在
      const existing = identityManager.getIdentity(newPubkey)
      if (existing) {
        throw new Error("Identity already exists")
      }

      // 加密私钥
      const encryptedKey = await Storage.encryptPrivateKey(privateKey, password)

      // 保存加密密钥
      identityManager.saveEncryptedKey(newPubkey, encryptedKey)

      // 创建身份元数据
      const meta: IdentityMeta = {
        pubkey: newPubkey,
        name,
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
        hasEncryptedKey: true,
        relayUrls
      }

      // 添加身份
      identityManager.addIdentity(meta)

      // 设为当前身份
      identityManager.updateLastUsed(newPubkey)

      // 自动登录：让 @welshman/app 建立 session，这样 $pubkey 就会立即更新
      loginWithNip01(privateKey)

      // 发布 kind 0 profile 事件，使昵称在 profilesByPubkey 中可见
      if (name) {
        const relays = getDefaultRelays()
        const profileEvent = makeEvent(PROFILE, {
          content: JSON.stringify({name, display_name: name}),
        })
        // 稍等确保 signer 已激活，再签名发布
        setTimeout(() => {
          publishThunk({event: profileEvent, relays})
        }, 200)
      }

      return meta
    } catch (error) {
      console.error("Failed to add identity:", error)
      throw error
    }
  }

  /**
   * 验证身份密码
   */
  async verifyIdentityPassword(targetPubkey: string, password: string): Promise<boolean> {
    try {
      const encryptedKey = identityManager.getEncryptedKey(targetPubkey)
      if (!encryptedKey) {
        return false
      }

      await Storage.decryptPrivateKey(encryptedKey, password)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 删除身份
   */
  async removeIdentity(targetPubkey: string): Promise<void> {
    try {
      // 如果是当前身份，先登出
      const $pubkey = get(pubkey)
      if ($pubkey === targetPubkey) {
        await this.logout()
      }

      // 删除身份
      identityManager.removeIdentity(targetPubkey)
    } catch (error) {
      console.error("Failed to remove identity:", error)
      throw error
    }
  }
}

// 创建全局单例实例
export const identitySwitcher = new IdentitySwitcher()
