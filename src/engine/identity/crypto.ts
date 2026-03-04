// crypto.ts - 加密工具模块
// 使用 Web Crypto API 实现所有加密功能

import {bytesToHex, hexToBytes} from "@welshman/lib"
import type {EncryptionResult} from "./types"

// 重新导出 EncryptionResult
export type {EncryptionResult} from "./types"

// 配置常量
const PBKDF2_ITERATIONS = 100000
const KEY_LENGTH_BITS = 256
const SALT_LENGTH = 16
const IV_LENGTH = 12

/**
 * 从密码派生加密密钥
 * 使用 PBKDF2 算法
 */
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)

  // 导入密码作为密钥材料
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    "PBKDF2",
    false,
    ["deriveKey"]
  )

  // 派生 AES-GCM 密钥
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256"
    },
    keyMaterial,
    {
      name: "AES-GCM",
      length: KEY_LENGTH_BITS
    },
    false,
    ["encrypt", "decrypt"]
  )
}

/**
 * 使用 AES-GCM 加密数据
 * @param data - 要加密的文本数据
 * @param key - 加密密钥
 * @returns 包含加密数据和 IV 的对象
 */
export async function encrypt(data: string, key: CryptoKey): Promise<{
  ciphertext: Uint8Array
  iv: Uint8Array
}> {
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  const iv = generateRandomIV()

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    key,
    dataBuffer
  )

  return {
    ciphertext: new Uint8Array(ciphertext),
    iv
  }
}

/**
 * 使用 AES-GCM 解密数据
 * @param ciphertext - 加密的数据
 * @param iv - 初始化向量
 * @param key - 解密密钥
 * @returns 解密后的文本
 */
export async function decrypt(
  ciphertext: Uint8Array,
  iv: Uint8Array,
  key: CryptoKey
): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    key,
    ciphertext
  )

  const decoder = new TextDecoder()
  return decoder.decode(decrypted)
}

/**
 * 生成随机盐值
 */
export function generateRandomSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
}

/**
 * 生成随机初始化向量 (IV)
 */
export function generateRandomIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH))
}

/**
 * 将 Uint8Array 转换为十六进制字符串
 */
export function arrayToHex(array: Uint8Array): string {
  return bytesToHex(array)
}

/**
 * 将十六进制字符串转换为 Uint8Array
 */
export function hexToArray(hex: string): Uint8Array {
  return hexToBytes(hex)
}
