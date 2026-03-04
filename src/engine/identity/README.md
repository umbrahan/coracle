# 身份管理系统 (Identity Management)

## 概述

这是一个完整的 Nostr 多身份管理系统，支持：
- 多个身份的加密存储
- 身份间快速切换
- 私钥的安全加密存储
- 完全的内存状态清理

## 模块结构

```
src/engine/identity/
├── crypto.ts      # 加密工具（Web Crypto API）
├── storage.ts     # 加密存储接口
├── manager.ts     # 身份管理器
├── switcher.ts    # 身份切换器
├── index.ts       # 统一导出
└── README.md      # 本文档
```

## 核心功能

### 1. 加密功能 (crypto.ts)

使用浏览器原生 Web Crypto API 实现：

- `deriveKey(password, salt)` - PBKDF2 密钥派生
- `encrypt(data, key)` - AES-GCM 加密
- `decrypt(ciphertext, iv, key)` - AES-GCM 解密
- `generateRandomSalt()` - 生成随机盐值
- `generateRandomIV()` - 生成随机初始化向量

### 2. 加密存储 (storage.ts)

提供高层加密接口：

- `encryptWithPassword(data, password)` - 使用密码加密数据
- `decryptWithPassword(encryptedData, password)` - 使用密码解密数据
- `verifyPassword(encryptedData, password)` - 验证密码
- `encryptPrivateKey(privateKey, password)` - 加密私钥
- `decryptPrivateKey(encryptedKey, password)` - 解密私钥

### 3. 身份管理器 (manager.ts)

管理身份元数据和加密密钥：

```typescript
import {identityManager} from "src/engine"

// 获取所有身份
const identities = get(identityManager.identities)

// 添加新身份
identityManager.addIdentity({
  pubkey: "npub1...",
  name: "My Account",
  createdAt: Date.now(),
  lastUsedAt: Date.now(),
  hasEncryptedKey: true,
  relayUrls: ["wss://relay.example.com"]
})

// 保存加密的私钥
const encryptedKey = await encryptPrivateKey("nsec1...", "password")
identityManager.saveEncryptedKey("npub1...", encryptedKey)

// 删除身份
identityManager.removeIdentity("npub1...")

// 更新最后使用时间
identityManager.updateLastUsed("npub1...")
```

### 4. 身份切换器 (switcher.ts)

处理完整的身份切换流程：

```typescript
import {identitySwitcher} from "src/engine"

// 切换身份（需要密码）
await identitySwitcher.switchIdentity("npub1...", "password")

// 快速切换（已登录账户间）
await identitySwitcher.quickSwitch("npub1...", privateKey)

// 登出
await identitySwitcher.logout()

// 添加新身份
await identitySwitcher.addIdentity(
  "nsec1...",  // 私钥
  "password",  // 加密密码
  "My Account", // 显示名称
  ["wss://relay.example.com"] // 中继列表（可选）
)

// 验证密码
const isValid = await identitySwitcher.verifyIdentityPassword("npub1...", "password")

// 删除身份
await identitySwitcher.removeIdentity("npub1...")
```

## 数据存储

### localStorage 结构

```json
{
  "coracle_identities": [
    {
      "pubkey": "npub1...",
      "name": "My Account",
      "createdAt": 1234567890,
      "lastUsedAt": 1234567890,
      "hasEncryptedKey": true,
      "relayUrls": ["wss://relay.example.com"]
    }
  ],
  "coracle_encrypted_keys": [
    {
      "pubkey": "npub1...",
      "encryptedKey": {
        "data": "hex-encoded-ciphertext",
        "iv": "hex-encoded-iv",
        "salt": "hex-encoded-salt"
      },
      "createdAt": 1234567890
    }
  ],
  "coracle_current_identity": "npub1..."
}
```

## 安全考虑

1. **密钥派生**：使用 PBKDF2 算法，100,000 次迭代
2. **加密算法**：AES-GCM 256 位
3. **盐值和 IV**：每次加密都随机生成
4. **私钥保护**：私钥始终以加密形式存储
5. **内存清理**：切换身份时完全清空内存状态

## 使用示例

### 在 Svelte 组件中使用

```svelte
<script>
  import {identityManager, identitySwitcher} from "src/engine"
  import {get} from "svelte/store"

  // 订阅身份列表
  $identities = get(identityManager.identities)

  // 添加新身份
  async function addAccount() {
    await identitySwitcher.addIdentity(
      $privateKey,
      $password,
      $accountName
    )
  }

  // 切换身份
  async function switchAccount(pubkey) {
    await identitySwitcher.switchIdentity(pubkey, $password)
  }
</script>
```

### 与 @welshman/app 集成

```typescript
import {pubkey, session, signer, sessions} from "@welshman/app"
import {identitySwitcher} from "src/engine/identity"

// 切换身份会自动更新 welshman 的 stores
await identitySwitcher.switchIdentity("npub1...", "password")

// 之后可以正常使用
console.log(get(pubkey)) // "npub1..."
console.log(get(signer)) // Nip01Signer 实例
```

## API 参考

### IdentityMeta

```typescript
interface IdentityMeta {
  pubkey: string           // 公钥（唯一标识）
  name: string             // 显示名称
  createdAt: number        // 创建时间戳
  lastUsedAt: number       // 最后使用时间戳
  hasEncryptedKey: boolean // 是否存储了加密私钥
  relayUrls?: string[]     // 关联的中继服务器
  npub?: string           // bech32 编码的公钥
}
```

### EncryptionResult

```typescript
interface EncryptionResult {
  data: string  // 十六进制编码的加密数据
  iv: string    // 十六进制编码的 IV
  salt: string  // 十六进制编码的盐值
}
```

## 错误处理

所有异步函数都会在失败时抛出错误：

```typescript
try {
  await identitySwitcher.switchIdentity(pubkey, password)
} catch (error) {
  if (error.message.includes("Identity not found")) {
    // 处理身份不存在
  } else if (error.message.includes("No encrypted key")) {
    // 处理没有存储密钥
  } else {
    // 处理密码错误等
  }
}
```

## 兼容性

- 使用 Web Crypto API（所有现代浏览器）
- 与 @welshman/app 完全兼容
- 支持 Svelte 4 stores

## 后续开发计划

1. **Phase 2**: 内存订阅流实现
2. **Phase 3**: 身份切换 UI 组件
3. **Phase 4**: 全局集成与测试
