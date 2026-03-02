// types.ts - 身份管理系统的类型定义

/**
 * 身份元数据接口
 * 存储在 localStorage 中的身份信息
 */
export interface IdentityMeta {
  /** 公钥（用作唯一标识） */
  pubkey: string
  /** 显示名称 */
  name: string
  /** 创建时间戳（毫秒） */
  createdAt: number
  /** 最后使用时间戳（毫秒） */
  lastUsedAt: number
  /** 是否存储了加密私钥 */
  hasEncryptedKey: boolean
  /** 关联的中继服务器列表 */
  relayUrls?: string[]
  /** bech32 编码的公钥（可选，用于显示） */
  npub?: string
}

/**
 * 加密结果接口
 * 加密数据的完整表示，包含所有必要信息用于解密
 * 注意：此接口也在 crypto.ts 中定义，需要保持一致
 */
export interface EncryptionResult {
  /** 十六进制编码的加密数据 */
  data: string
  /** 十六进制编码的初始化向量 (IV) */
  iv: string
  /** 十六进制编码的盐值 */
  salt: string
}

/**
 * 加密密钥存储结构
 * localStorage 中存储的加密密钥数据
 */
export interface EncryptedKeyData {
  /** 公钥标识 */
  pubkey: string
  /** 加密的私钥数据 */
  encryptedKey: EncryptionResult
  /** 创建时间戳（毫秒） */
  createdAt: number
}

/**
 * 身份切换选项
 * 用于快速切换时传递参数
 */
export interface SwitchIdentityOptions {
  /** 是否清空 IndexedDB（默认 true） */
  clearIndexedDB?: boolean
  /** 是否断开所有 relay 连接（默认 true） */
  disconnectRelays?: boolean
  /** 是否清空内存状态（默认 true） */
  clearMemory?: boolean
}

/**
 * 身份验证结果
 */
export interface VerifyPasswordResult {
  /** 密码是否正确 */
  valid: boolean
  /** 错误信息（如果验证失败） */
  error?: string
}

/**
 * 身份统计信息
 */
export interface IdentityStats {
  /** 身份总数 */
  total: number
  /** 有加密密钥的身份数 */
  withEncryptedKey: number
  /** 最后使用的身份 */
  lastUsed?: IdentityMeta
  /** 最近创建的身份 */
  recent: IdentityMeta[]
}

/**
 * 本地存储键名常量
 */
export const STORAGE_KEYS = {
  IDENTITIES: "coracle_identities",
  ENCRYPTED_KEYS: "coracle_encrypted_keys",
  CURRENT_IDENTITY: "coracle_current_identity"
} as const

/**
 * 加密配置常量
 */
export const CRYPTO_CONFIG = {
  /** PBKDF2 迭代次数 */
  PBKDF2_ITERATIONS: 100000,
  /** 密钥长度（位） */
  KEY_LENGTH_BITS: 256,
  /** 盐值长度（字节） */
  SALT_LENGTH: 16,
  /** IV 长度（字节） */
  IV_LENGTH: 12
} as const

/**
 * 身份管理器状态
 */
export type IdentityManagerState = {
  /** 身份列表 */
  identities: IdentityMeta[]
  /** 当前选中的身份公钥 */
  currentIdentity: string | null
}

/**
 * 身份切换结果
 */
export type SwitchResult =
  | { success: true; pubkey: string }
  | { success: false; error: string }

/**
 * 身份添加结果
 */
export type AddIdentityResult =
  | { success: true; identity: IdentityMeta }
  | { success: false; error: string }

/**
 * 错误类型
 */
export class IdentityError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message)
    this.name = "IdentityError"
  }
}

/**
 * 错误代码常量
 */
export const ERROR_CODES = {
  IDENTITY_NOT_FOUND: "IDENTITY_NOT_FOUND",
  NO_ENCRYPTED_KEY: "NO_ENCRYPTED_KEY",
  INVALID_PASSWORD: "INVALID_PASSWORD",
  IDENTITY_EXISTS: "IDENTITY_EXISTS",
  ENCRYPTION_FAILED: "ENCRYPTION_FAILED",
  DECRYPTION_FAILED: "DECRYPTION_FAILED",
  STORAGE_FAILED: "STORAGE_FAILED",
  INVALID_PRIVATE_KEY: "INVALID_PRIVATE_KEY"
} as const
