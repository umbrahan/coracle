// manager.ts - 身份管理器模块
// 管理多个身份的元数据和加密密钥

import {writable, derived, get} from "svelte/store"
import type {EncryptionResult, IdentityMeta} from "./types"
import * as Storage from "./storage"

// 重新导出主要类型
export type {IdentityMeta} from "./types"
export type {EncryptionResult} from "./types"

/**
 * 加密密钥存储结构
 */
interface EncryptedKeyData {
  pubkey: string
  encryptedKey: EncryptionResult
  createdAt: number
}

/**
 * 本地存储键名常量
 */
const STORAGE_KEYS = {
  IDENTITIES: "coracle_identities",
  ENCRYPTED_KEYS: "coracle_encrypted_keys",
  CURRENT_IDENTITY: "coracle_current_identity"
}

/**
 * IdentityManager 类
 * 管理所有身份的元数据和加密密钥
 */
export class IdentityManager {
  // Svelte store 用于存储身份列表
  identities = writable<IdentityMeta[]>([])

  // 当前选中的身份
  currentIdentity = writable<string | null>(null)

  // 派生 store：当前身份的元数据
  currentIdentityMeta = derived(
    [this.identities, this.currentIdentity],
    ([$identities, $currentIdentity]) =>
      $identities.find(i => i.pubkey === $currentIdentity) || null
  )

  constructor() {
    // 初始化时从 localStorage 加载数据
    this.loadIdentities()
    this.loadCurrentIdentity()
  }

  /**
   * 从 localStorage 加载身份列表
   */
  loadIdentities(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.IDENTITIES)
      if (stored) {
        const parsed = JSON.parse(stored) as IdentityMeta[]
        this.identities.set(parsed)
      }
    } catch (error) {
      console.error("Failed to load identities:", error)
      this.identities.set([])
    }
  }

  /**
   * 保存身份列表到 localStorage
   */
  saveIdentities(): void {
    try {
      const $identities = get(this.identities)
      localStorage.setItem(STORAGE_KEYS.IDENTITIES, JSON.stringify($identities))
    } catch (error) {
      console.error("Failed to save identities:", error)
    }
  }

  /**
   * 从 localStorage 加载当前身份
   */
  loadCurrentIdentity(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_IDENTITY)
      if (stored) {
        this.currentIdentity.set(stored)
      }
    } catch (error) {
      console.error("Failed to load current identity:", error)
    }
  }

  /**
   * 保存当前身份到 localStorage
   */
  saveCurrentIdentity(pubkey: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_IDENTITY, pubkey)
      this.currentIdentity.set(pubkey)
    } catch (error) {
      console.error("Failed to save current identity:", error)
    }
  }

  /**
   * 添加新身份
   */
  addIdentity(meta: IdentityMeta): void {
    this.identities.update($identities => {
      // 检查是否已存在
      const existingIndex = $identities.findIndex(i => i.pubkey === meta.pubkey)

      if (existingIndex >= 0) {
        // 更新现有身份
        $identities[existingIndex] = {...$identities[existingIndex], ...meta}
      } else {
        // 添加新身份
        $identities.push(meta)
      }

      return [...$identities]
    })

    this.saveIdentities()
  }

  /**
   * 删除身份
   */
  removeIdentity(pubkey: string): void {
    this.identities.update($identities =>
      $identities.filter(i => i.pubkey !== pubkey)
    )

    // 同时删除加密的私钥
    this.deleteEncryptedKey(pubkey)

    // 如果删除的是当前身份，清空当前身份
    const $current = get(this.currentIdentity)
    if ($current === pubkey) {
      this.currentIdentity.set(null)
      localStorage.removeItem(STORAGE_KEYS.CURRENT_IDENTITY)
    }

    this.saveIdentities()
  }

  /**
   * 更新身份的最后使用时间
   */
  updateLastUsed(pubkey: string): void {
    this.identities.update($identities => {
      const index = $identities.findIndex(i => i.pubkey === pubkey)
      if (index >= 0) {
        $identities[index].lastUsedAt = Date.now()
      }
      return [...$identities]
    })

    this.saveIdentities()
    this.saveCurrentIdentity(pubkey)
  }

  /**
   * 获取身份元数据
   */
  getIdentity(pubkey: string): IdentityMeta | undefined {
    const $identities = get(this.identities)
    return $identities.find(i => i.pubkey === pubkey)
  }

  /**
   * 保存加密的私钥
   */
  saveEncryptedKey(pubkey: string, encryptedKey: EncryptionResult): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ENCRYPTED_KEYS)
      const keys: EncryptedKeyData[] = stored ? JSON.parse(stored) : []

      // 查找现有记录或创建新记录
      const existingIndex = keys.findIndex(k => k.pubkey === pubkey)
      const keyData: EncryptedKeyData = {
        pubkey,
        encryptedKey,
        createdAt: Date.now()
      }

      if (existingIndex >= 0) {
        keys[existingIndex] = keyData
      } else {
        keys.push(keyData)
      }

      localStorage.setItem(STORAGE_KEYS.ENCRYPTED_KEYS, JSON.stringify(keys))

      // 更新身份元数据中的标记
      const identity = this.getIdentity(pubkey)
      if (identity) {
        this.addIdentity({...identity, hasEncryptedKey: true})
      }
    } catch (error) {
      console.error("Failed to save encrypted key:", error)
      throw new Error("Failed to save encrypted key")
    }
  }

  /**
   * 获取加密的私钥
   */
  getEncryptedKey(pubkey: string): EncryptionResult | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ENCRYPTED_KEYS)
      if (!stored) return null

      const keys: EncryptedKeyData[] = JSON.parse(stored)
      const keyData = keys.find(k => k.pubkey === pubkey)

      return keyData ? keyData.encryptedKey : null
    } catch (error) {
      console.error("Failed to get encrypted key:", error)
      return null
    }
  }

  /**
   * 删除加密的私钥
   */
  deleteEncryptedKey(pubkey: string): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ENCRYPTED_KEYS)
      if (!stored) return

      const keys: EncryptedKeyData[] = JSON.parse(stored)
      const filtered = keys.filter(k => k.pubkey !== pubkey)

      localStorage.setItem(STORAGE_KEYS.ENCRYPTED_KEYS, JSON.stringify(filtered))
    } catch (error) {
      console.error("Failed to delete encrypted key:", error)
    }
  }

  /**
   * 检查是否有存储的加密密钥
   */
  hasEncryptedKey(pubkey: string): boolean {
    return this.getEncryptedKey(pubkey) !== null
  }

  /**
   * 获取所有身份的数量
   */
  getIdentityCount(): number {
    return get(this.identities).length
  }

  /**
   * 清空所有身份数据（危险操作）
   */
  clearAllIdentities(): void {
    this.identities.set([])
    this.currentIdentity.set(null)
    localStorage.removeItem(STORAGE_KEYS.IDENTITIES)
    localStorage.removeItem(STORAGE_KEYS.ENCRYPTED_KEYS)
    localStorage.removeItem(STORAGE_KEYS.CURRENT_IDENTITY)
  }
}

// 创建全局单例实例
export const identityManager = new IdentityManager()
