# IdentitySwitcher 组件

身份切换 UI 组件，用于在多个 Nostr 身份之间切换。

## 组件列表

### 1. IdentitySwitcher.svelte
桌面版组件，使用 Popover 弹出菜单。

### 2. IdentitySwitcherMobile.svelte
移动版组件，使用抽屉式菜单。

### 3. IdentitySwitcherAuto.svelte
自动选择版本，根据设备类型显示桌面版或移动版。

## 使用方法

### 基本用法

```svelte
<script>
  import IdentitySwitcherAuto from "src/partials/IdentitySwitcherAuto.svelte"

  const handleAddAccount = () => {
    // 处理添加账户
  }

  const handleSettings = () => {
    // 处理账户设置
  }

  const handleSwitched = (e) => {
    console.log("切换到:", e.detail.pubkey)
  }
</script>

<IdentitySwitcherAuto
  size="md"
  showLabel={true}
  on:addAccount={handleAddAccount}
  on:settings={handleSettings}
  on:switched={handleSwitched} />
```

## Props

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| size | "sm" \| "md" \| "lg" | "md" | 头像尺寸 |
| showLabel | boolean | false | 是否显示当前身份名称 |

## Events

| 事件 | 参数 | 说明 |
|------|------|------|
| addAccount | - | 点击"添加账户"按钮时触发 |
| settings | - | 点击"账户设置"按钮时触发 |
| switched | { pubkey: string } | 身份切换成功时触发 |

## 依赖

- `IdentityManager` - 身份管理器
- `IdentitySwitcher` - 身份切换器
- `PersonCircle` - 用户头像组件
- `Popover` / `Modal` - 弹出层组件
- `Toast` - 消息提示组件

## 功能特性

1. **显示当前账户** - 显示当前登录账户的头像和名称
2. **账户列表** - 显示所有已登录账户，按最近使用时间排序
3. **快速切换** - 点击账户即可切换身份
4. **密码验证** - 切换前需要输入密码验证
5. **添加账户** - 提供添加新账户的入口
6. **账户设置** - 提供账户管理的入口

## 注意事项

1. 切换身份会清理当前会话数据
2. 切换身份后会重新连接到中继服务器
3. 切换成功后会自动刷新页面以应用新身份
4. 需要确保已正确初始化 `IdentityManager` 和 `IdentitySwitcher`
