// crypto.test.ts - 加密功能测试示例
// 注意：这只是一个示例，实际测试应该使用测试框架

import * as Crypto from "./crypto"

async function testCrypto() {
  console.log("Testing crypto functions...")

  // 测试密钥派生
  const password = "test-password-123"
  const salt = Crypto.generateRandomSalt()

  const key = await Crypto.deriveKey(password, salt)
  console.log("✓ Key derivation successful")

  // 测试加密解密
  const testData = "This is a secret private key: nsec1..."
  const encrypted = await Crypto.encrypt(testData, key)
  console.log("✓ Encryption successful")

  const decrypted = await Crypto.decrypt(encrypted.ciphertext, encrypted.iv, key)
  console.log("✓ Decryption successful")

  if (decrypted === testData) {
    console.log("✓ Encryption/decryption roundtrip successful")
  } else {
    console.error("✗ Roundtrip failed")
  }

  // 测试十六进制转换
  const hex = Crypto.arrayToHex(salt)
  const back = Crypto.hexToArray(hex)

  if (
    salt.length === back.length &&
    salt.every((byte, i) => byte === back[i])
  ) {
    console.log("✓ Hex conversion successful")
  } else {
    console.error("✗ Hex conversion failed")
  }
}

// 导出测试函数
export {testCrypto}
