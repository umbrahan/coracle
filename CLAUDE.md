# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Coracle 是一个 Nostr 协议的 Web 客户端，专注于中继选择/管理、基于信任网络的审查/内容推荐、隐私保护等功能。使用 Svelte + TypeScript + Vite 构建。

## 常用命令

### 开发
- `pnpm run dev` - 启动开发服务器（带 --host）
- `pnpm run build` - 构建生产版本（需要先运行 `pnpm i sharp --include=optional`）
- `pnpm run watch` - 监视文件变化

### 测试
- `pnpm run test` - 运行所有测试
- `pnpm run test:unit` - 运行单元测试（Vitest）
- `pnpm run test:e2e` - 运行 E2E 测试（Cypress）

### 代码质量
- `pnpm run check` - 运行所有检查（TypeScript + ESLint + Prettier）
- `pnpm run check:es` - ESLint 检查
- `pnpm run check:ts` - TypeScript 类型检查
- `pnpm run check:fmt` - Prettier 格式检查
- `pnpm run format` - 格式化代码

### Android 构建
```bash
pnpm run build:android --keystorepath <path> --keystorepass <password> \
  --keystorealias <alias> --keystorealiaspass <password>
```

## 架构概览

### 核心依赖

项目大量使用 `@welshman/*` 库，这是 Nostr 应用的核心框架：
- `@welshman/app` - 应用核心状态、认证、用户管理
- `@welshman/net` - 网络层、中继连接、WebSocket 池
- `@welshman/store` - 事件存储、派生状态
- `@welshman/feeds` - Feed 定义和生成
- `@welshman/router` - 中继选择路由器
- `@welshman/signer` - 签名器（NIP-01, NIP-46, NIP-07）
- `@welshman/util` - 通用 Nostr 工具函数
- `@welshman/content` - 内容处理
- `@welshman/editor` - 编辑器组件

### 目录结构

```
src/
├── app/           # 应用层
│   ├── views/     # 路由视图组件（60+ 个页面）
│   ├── shared/    # 共享的 Svelte 组件
│   ├── editor/    # 编辑器相关组件
│   ├── state.ts   # 应用状态（loadUserData, boot）
│   └── util/      # 应用工具（路由扩展等）
├── engine/        # 业务逻辑层
│   ├── state.ts   # 全局状态、env、设置、派生状态
│   ├── commands.ts# 发布命令（follow/unfollow/post/上传等）
│   ├── requests.ts# 数据加载（通知/消息/feeds/lists）
│   ├── storage.ts# IndexedDB 存储适配器
│   └── model.ts   # 数据模型定义
├── domain/        # 领域模型
│   ├── feed.ts    # Feed 相关类型
│   ├── list.ts    # List 相关类型
│   ├── collection.ts # Collection 相关
│   └── handler.ts # Handler 相关
├── partials/      # 可重用 UI 组件
├── util/          # 工具函数
└── workers/       # Web Workers
```

### 关键架构模式

#### 1. 路由系统
项目使用自定义路由系统（`src/util/router.ts`），支持：
- 虚拟路由（不修改浏览器历史）
- Modal/Drawer 导航
- 查询参数序列化/反序列化
- 路由扩展（extensions）用于类型安全的 URL 生成

```typescript
// 路由使用示例
router.at("/notes/:id").qp({relays: [...]}).open()
router.at("/people/:pubkey").replace({context: {...}})
```

#### 2. 中继选择策略
使用 `@welshman/router` 的 `Router` 类进行智能中继选择：
- `FromUser()` - 用户的中继列表
- `FromPubkeys(pubkeys)` - 从指定用户的中继
- `ForUser()` - 用户能接收消息的中继
- `Search()` - 搜索中继
- `policy(addMaximalFallbacks)` - 添加回退中继

#### 3. 状态管理
- **全局状态**：`src/engine/state.ts` 包含所有派生状态
- **Svelte stores**：大量使用 `derived` stores 进行响应式计算
- **存储**：IndexedDB 用于持久化（events, relays, handles, zappers, plaintext, tracker, wraps）

#### 4. 事件处理流程
```
事件从中继接收 -> repository 存储触发 update 事件
-> 派生状态自动更新 -> UI 组件响应更新
```

#### 5. Feed 系统
- Feed 是可组合的过滤器（`@welshman/feeds`）
- 支持作者 Feed、标签 Feed、范围 Feed、交集 Feed
- Feed 可以存储为可替换事件（kind:30010）或参数化可替换事件（kind:30000）

## 重要配置

### 环境变量（.env.template）
主要配置项：
- `VITE_DEFAULT_RELAYS` - 默认中继列表
- `VITE_INDEXER_RELAYS` - 索引中继
- `VITE_SEARCH_RELAYS` - 搜索中继
- `VITE_DVM_RELAYS` - DVM 中继
- `VITE_DUFFLEPUD_URL` - Dufflepud 服务 URL
- `VITE_APP_NAME/URL/LOGO` - 应用白标配置

### 代码风格
- 无分号（`semi: false`）
- 100 字符行宽
- Svelte 组件顺序：`options-styles-scripts-markup`
- 箭头函数省略括号（`arrowParens: avoid`）

## 开发注意事项

### 添加新功能时
1. 视图组件放在 `src/app/views/`
2. 可重用组件放在 `src/partials/`
3. 业务逻辑放在 `src/engine/commands.ts` 或新建文件
4. 类型定义放在 `src/domain/`
5. 在 `src/App.svelte` 中注册路由

### Nostr 事件类型
- kind:0 - Profile（用户资料）
- kind:1 - Text note（文本笔记）
- kind:3 - Follows（关注列表）
- kind:4 - DM（私信，已弃用）
- kind:7 - Reaction（反应）
- kind:9735 - Zap（闪电打赏）
- kind:30000/30001 - Relay list/metadata
- kind:30009 - Badges
- kind:30010 - Custom lists
- kind:30023 - Long-form messages
- kind:30078 - App data（应用数据）

### Welshman 框架关键概念
- **repository**：事件存储中心，所有事件从这里查询
- **tracker**：跟踪事件在哪些中继上
- **signer**：签名器抽象（支持多种签名方式）
- **session**：当前用户会话信息
- **Router**：中继选择策略引擎

### 存储限制
- IndexedDB 存储限制：10,000 个事件
- 事件优先级：用户自己的事件 > 关注用户的事件 > 其他

### 多账户支持
- `sessions` store 存储所有账户
- `pubkey` store 是当前活跃账户
- `sessionWithMeta` 派生 store 提供会话元数据
