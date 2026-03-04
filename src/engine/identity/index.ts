// index.ts - 统一导出所有身份管理模块

// 类型定义
export * from "./types"

// 加密工具
export * from "./crypto"

// 加密存储
export * from "./storage"

// 身份管理器
export * from "./manager"

// 身份切换器
export * from "./switcher"

// 便捷导出
export {identityManager} from "./manager"
export {identitySwitcher} from "./switcher"
