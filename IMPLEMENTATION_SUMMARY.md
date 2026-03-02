# Coracle Chat 实现总结

## 已完成的工作

### 阶段一：Worktree 设置与精简 ✅

1. **Worktree 确认**
   - 位置：`../coracle-chat`
   - 分支：`feat/chat-app`
   - 状态：已存在并可用

2. **路由系统精简** (`src/app/App.svelte`)
   - 移除了 60+ 个不需要的路由
   - 仅保留核心路由：
     - `/` - 首页（通讯录）
     - `/chat/:pubkey` - 聊天页面
     - `/contacts` - 通讯录
     - `/identity` - 身份管理
     - `/settings` - 设置
     - `/login` - 登录/创建身份
     - `/qrcode/:code` - QR 码显示

3. **环境变量简化** (`.env.template`)
   - 移除了复杂配置（市场、Zap 分割、Dufflepud 等）
   - 保留核心配置：中继、主题、应用信息

### 阶段二：身份管理模块 ✅

**文件**: `src/app/views/IdentityPage.svelte`

实现功能：
- ✅ 创建身份（生成密钥对）
- ✅ 展示身份码（npub + QR 码）
- ✅ 销毁身份（确认对话框）
- ✅ 选择身份（使用现有 IdentitySwitcher 组件）
- ✅ 密码保护（加密存储私钥）

### 阶段三：联系人管理 ✅

**文件**: `src/app/views/ContactsPage.svelte`

实现功能：
- ✅ 通讯录列表（从 kind:3 关注列表获取）
- ✅ 添加好友 - 支持 npub/nprofile 格式
- ✅ 分享我的身份（生成 QR 码）
- ✅ 搜索联系人
- ✅ 删除联系人

### 阶段四：聊天功能 ✅

**文件**: `src/app/views/ChatPage.svelte`

实现功能：
- ✅ 聊天界面（消息列表、输入框）
- ✅ 消息加密/解密（NIP-04）
- ✅ 消息 TTL 管理（使用 MessageTTLManager）
- ✅ 自建 Relay 配置（从 localStorage 读取）
- ✅ 消息时间戳显示

**工具文件**:
- `src/engine/utils/message-ttl.ts` - MessageTTLManager 类
- `src/engine/utils/relay-policy.ts` - getChatRelays() 函数

### 阶段五：Telegram 风格首页 ✅

**文件**: `src/app/views/HomePage.svelte`

实现功能：
- ✅ 简洁联系人列表布局
- ✅ 搜索框置顶
- ✅ 点击联系人进入聊天
- ✅ 底部导航栏（移动端）
- ✅ 响应式设计

### 阶段六：设置页面 ✅

**文件**: `src/app/views/SettingsPage.svelte`

实现功能：
- ✅ Relay 设置（添加/删除/测试连接）
- ✅ 消息 TTL 配置（1-365 天）
- ✅ 数据导出
- ✅ 清除聊天记录
- ✅ 账户信息展示

### 附加页面

**文件**: `src/app/views/LoginPage.svelte`

实现功能：
- ✅ 创建新身份（快速生成）
- ✅ 导入 nsec 私钥
- ✅ 选择现有身份
- ✅ 登录方式选择界面

## 文件清单

### 新建文件

| 文件路径 | 说明 |
|---------|------|
| `src/app/views/HomePage.svelte` | Telegram 风格首页 |
| `src/app/views/ChatPage.svelte` | 聊天对话页面 |
| `src/app/views/ContactsPage.svelte` | 联系人管理页面 |
| `src/app/views/IdentityPage.svelte` | 身份管理页面 |
| `src/app/views/LoginPage.svelte` | 登录/创建身份页面 |
| `src/app/views/SettingsPage.svelte` | 设置页面 |
| `src/engine/utils/relay-policy.ts` | 中继策略工具 |
| `src/engine/utils/message-ttl.ts` | 消息 TTL 管理器 |

### 修改文件

| 文件路径 | 说明 |
|---------|------|
| `src/app/App.svelte` | 精简路由系统 |
| `.env.template` | 简化环境变量 |
| `src/engine/utils/index.ts` | 导出工具模块 |

## 架构说明

### 核心依赖保留

保留的 `@welshman/*` 库：
- `@welshman/app` - 应用核心状态
- `@welshman/net` - 网络连接
- `@welshman/signer` - 签名器
- `@welshman/util` - 工具函数
- `@welshman/lib` - 基础库
- `@welshman/router` - 路由选择器

移除的功能（未使用）：
- Feed 系统（kinds: 30000, 30010）
- Channels/Groups
- 市场/交易功能
- 标签系统
- 文件上传/媒体库
- 通知系统

### 消息流程

```
用户发送消息
    ↓
NIP-04 加密 (使用 recipient pubkey)
    ↓
添加 expiration tag (TTL)
    ↓
发布到 chat relays
    ↓
保存到本地 repository
    ↓
MessageTTLManager 跟踪
    ↓
过期自动删除
```

### 身份管理流程

```
创建身份
    ↓
生成密钥对 (Nip01Signer.generateSecret())
    ↓
加密私钥 (PBKDF2 + AES-GCM)
    ↓
保存到 localStorage
    ↓
设置为当前身份
```

## 测试检查清单

### 功能测试
- [ ] 创建新身份
- [ ] 展示/复制 npub
- [ ] 扫描二维码添加好友
- [ ] 发送/接收消息
- [ ] 消息加密/解密
- [ ] 消息 TTL 生效
- [ ] 切换到自建 relay
- [ ] 身份切换

### 构建测试
```bash
cd ../coracle-chat
pnpm i
pnpm run dev
pnpm run build
```

## 下一步工作

1. **测试和调试**
   - 开发环境测试
   - 功能验证
   - Bug 修复

2. **可选增强**
   - 扫码功能集成（qr-scanner）
   - 消息已读状态
   - 在线状态指示
   - 推送通知

3. **UI/UX 优化**
   - 动画效果
   - 加载状态
   - 错误提示优化

## 注意事项

1. **保留核心架构**
   - ✅ 未修改 `@welshman/*` 核心库的使用方式
   - ✅ 保持现有的身份加密存储机制
   - ✅ 复用现有的 UI 组件（Button, Input, Modal 等）

2. **简化策略**
   - ✅ 优先删除不用的路由和组件
   - ✅ 保留工具函数和通用组件
   - ✅ 逐步精简，避免一次性删除过多代码

3. **配置说明**
   - 聊天中继配置存储在 `localStorage` 的 `chat_relays` 键
   - 消息 TTL 配置存储在 `localStorage` 的 `chat_message_ttl` 键
   - 默认中继：`wss://relay.damus.io`, `wss://nos.lol`
   - 默认 TTL：7 天

## 版本信息

- **项目名称**: Coracle Chat
- **版本**: 0.1.0
- **协议**: Nostr
- **构建时间**: 2026-02-28
