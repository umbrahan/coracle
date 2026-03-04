// storage.ts - 加密存储模块
// 提供使用密码加密和解密数据的高层接口

import type {EncryptionResult} from "./types"
import * as Crypto from "./crypto"

// 重新导出 EncryptionResult 类型
export type {EncryptionResult} from "./types"

/**
 * 使用密码加密数据
 * 完整的加密流程：派生密钥 -> 加密数据 -> 返回结果
 */
export async function encryptWithPassword(
  data: string,
  password: string
): Promise<EncryptionResult> {
  // 生成随机盐值
  const salt = Crypto.generateRandomSalt()

  // 从密码派生密钥
  const key = await Crypto.deriveKey(password, salt)

  // 加密数据
  const {ciphertext, iv} = await Crypto.encrypt(data, key)

  // 将所有二进制数据转换为十六进制字符串以便存储
  return {
    data: Crypto.arrayToHex(ciphertext),
    iv: Crypto.arrayToHex(iv),
    salt: Crypto.arrayToHex(salt)
  }
}

/**
 * 使用密码解密数据
 * 完整的解密流程：从盐值派生密钥 -> 解密数据 -> 返回结果
 */
export async function decryptWithPassword(
  encryptedData: EncryptionResult,
  password: string
): Promise<string> {
  // 将十六进制字符串转换回二进制
  const salt = Crypto.hexToArray(encryptedData.salt)
  const iv = Crypto.hexToArray(encryptedData.iv)
  const ciphertext = Crypto.hexToArray(encryptedData.data)

  // 从密码和盐值派生密钥
  const key = await Crypto.deriveKey(password, salt)

  // 解密数据
  return Crypto.decrypt(ciphertext, iv, key)
}

/**
 * 验证密码是否正确
 * 尝试解密数据，如果失败则返回 false
 */
export async function verifyPassword(
  encryptedData: EncryptionResult,
  password: string
): Promise<boolean> {
  try {
    await decryptWithPassword(encryptedData, password)
    return true
  } catch (e) {
    return false
  }
}

/**
 * 加密私钥
 */
export async function encryptPrivateKey(
  privateKey: string,
  password: string
): Promise<EncryptionResult> {
  return encryptWithPassword(privateKey, password)
}

/**
 * 解密私钥
 */
export async function decryptPrivateKey(
  encryptedKey: EncryptionResult,
  password: string
): Promise<string> {
  return decryptWithPassword(encryptedKey, password)
}
