<script lang="ts">
  import IdentitySwitcher from "src/partials/IdentitySwitcher.svelte"
  import IdentitySwitcherMobile from "src/partials/IdentitySwitcherMobile.svelte"
  import IdentitySwitcherAuto from "src/partials/IdentitySwitcherAuto.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Card from "src/partials/Card.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Button from "src/partials/Button.svelte"
  import {router} from "src/app/util/router"

  // 演示事件处理
  let showAddAccount = false
  let showSettings = false

  const handleAddAccount = () => {
    showAddAccount = true
  }

  const handleSettings = () => {
    showSettings = true
  }

  const handleSwitched = (e) => {
    console.log("身份已切换到:", e.detail.pubkey)
  }
</script>

<div class="p-6 max-w-4xl mx-auto">
  <Heading>IdentitySwitcher 组件演示</Heading>

  <div class="space-y-8">
    <!-- 桌面版 -->
    <Card class="p-6">
      <h3 class="text-lg font-bold mb-4">桌面版 (Popover)</h3>
      <div class="flex items-center gap-4">
        <div class="text-sm text-neutral-400">小尺寸:</div>
        <IdentitySwitcher
          size="sm"
          on:addAccount={handleAddAccount}
          on:settings={handleSettings}
          on:switched={handleSwitched} />
      </div>
      <div class="flex items-center gap-4 mt-4">
        <div class="text-sm text-neutral-400">中等尺寸 (默认):</div>
        <IdentitySwitcher
          size="md"
          on:addAccount={handleAddAccount}
          on:settings={handleSettings}
          on:switched={handleSwitched} />
      </div>
      <div class="flex items-center gap-4 mt-4">
        <div class="text-sm text-neutral-400">大尺寸:</div>
        <IdentitySwitcher
          size="lg"
          showLabel={true}
          on:addAccount={handleAddAccount}
          on:settings={handleSettings}
          on:switched={handleSwitched} />
      </div>
    </Card>

    <!-- 移动版 -->
    <Card class="p-6">
      <h3 class="text-lg font-bold mb-4">移动版 (抽屉菜单)</h3>
      <div class="flex items-center gap-4">
        <div class="text-sm text-neutral-400">中等尺寸:</div>
        <IdentitySwitcherMobile
          size="md"
          on:addAccount={handleAddAccount}
          on:settings={handleSettings}
          on:switched={handleSwitched} />
      </div>
    </Card>

    <!-- 自动版 -->
    <Card class="p-6">
      <h3 class="text-lg font-bold mb-4">自动版 (根据设备选择)</h3>
      <div class="flex items-center gap-4">
        <div class="text-sm text-neutral-400">推荐使用:</div>
        <IdentitySwitcherAuto
          size="md"
          showLabel={true}
          on:addAccount={handleAddAccount}
          on:settings={handleSettings}
          on:switched={handleSwitched} />
      </div>
    </Card>

    <!-- 使用说明 -->
    <Card class="p-6">
      <h3 class="text-lg font-bold mb-4">使用说明</h3>
      <div class="space-y-3 text-sm">
        <div>
          <strong>基本用法:</strong>
          <pre class="bg-neutral-700 p-3 rounded mt-2 overflow-x-auto">{`<IdentitySwitcherAuto
  size="md"
  showLabel={true}
  on:addAccount={handleAddAccount}
  on:settings={handleSettings}
  on:switched={handleSwitched} />`}</pre>
        </div>
        <div>
          <strong>Props:</strong>
          <ul class="list-disc list-inside ml-4 mt-2 space-y-1">
            <li>size: "sm" | "md" | "lg" - 头像尺寸</li>
            <li>showLabel: boolean - 是否显示当前身份名称</li>
          </ul>
        </div>
        <div>
          <strong>Events:</strong>
          <ul class="list-disc list-inside ml-4 mt-2 space-y-1">
            <li>addAccount - 点击"添加账户"时触发</li>
            <li>settings - 点击"账户设置"时触发</li>
            <li>switched - 身份切换成功时触发</li>
          </ul>
        </div>
      </div>
    </Card>
  </div>
</div>

<!-- 添加账户演示模态框 -->
{#if showAddAccount}
  <Modal canClose={true} on:escape={() => showAddAccount = false}>
    <div class="bg-neutral-800 rounded-lg p-6 max-w-md mx-auto">
      <h2 class="text-xl font-bold mb-4">添加账户</h2>
      <p class="text-neutral-400 mb-4">
        这里应该显示添加账户的表单。你可以实现登录表单或导入私钥的功能。
      </p>
      <div class="flex justify-end">
        <Button class="px-4 py-2" on:click={() => showAddAccount = false}>关闭</Button>
      </div>
    </div>
  </Modal>
{/if}

<!-- 账户设置演示模态框 -->
{#if showSettings}
  <Modal canClose={true} on:escape={() => showSettings = false}>
    <div class="bg-neutral-800 rounded-lg p-6 max-w-md mx-auto">
      <h2 class="text-xl font-bold mb-4">账户设置</h2>
      <p class="text-neutral-400 mb-4">
        这里应该显示账户设置选项，比如修改密码、删除账户等。
      </p>
      <div class="flex justify-end">
        <Button class="px-4 py-2" on:click={() => showSettings = false}>关闭</Button>
      </div>
    </div>
  </Modal>
{/if}
