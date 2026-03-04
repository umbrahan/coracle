<script lang="ts">
  import {createEventDispatcher} from "svelte"
  import {pubkey, get} from "@welshman/app"
  import {displayPubkey} from "@welshman/util"
  import * as nip19 from "nostr-tools/nip19"
  import cx from "classnames"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Button from "src/partials/Button.svelte"
  import Input from "src/partials/Input.svelte"
  import {showInfo, showWarning} from "src/partials/Toast.svelte"
  import {identityManager} from "src/engine/identity/manager"
  import {identitySwitcher} from "src/engine/identity/switcher"

  export let size: "sm" | "md" | "lg" = "md"
  export let showLabel = false

  const dispatch = createEventDispatcher()
  let showMenu = false
  let showPasswordModal = false
  let selectedPubkey = null
  let password = ""
  let isSwitching = false

  // 尺寸映射
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  }

  // 当前公钥
  $: currentPubkey = get(pubkey)

  // 所有已登录的身份
  $: identities = $identityManager.identities

  // 按最后使用时间排序（最近使用的在前）
  $: sortedIdentities = [...identities].sort(
    (a, b) => (b.lastUsedAt || 0) - (a.lastUsedAt || 0)
  )

  // 当前身份元数据
  $: currentIdentity = currentPubkey
    ? identities.find(i => i.pubkey === currentPubkey)
    : null

  // 打开菜单
  const openMenu = () => {
    showMenu = true
  }

  // 关闭菜单
  const closeMenu = () => {
    showMenu = false
  }

  // 打开添加账户
  const openAddAccount = () => {
    closeMenu()
    dispatch("addAccount")
  }

  // 打开账户设置
  const openSettings = () => {
    closeMenu()
    dispatch("settings")
  }

  // 选择身份进行切换
  const selectIdentity = (targetPubkey: string) => {
    // 如果是当前账户，不做任何操作
    if (targetPubkey === currentPubkey) {
      closeMenu()
      return
    }

    selectedPubkey = targetPubkey
    showPasswordModal = true
    closeMenu()
  }

  // 确认切换身份
  const confirmSwitch = async () => {
    if (!selectedPubkey || !password) {
      showWarning("请输入密码")
      return
    }

    isSwitching = true

    try {
      // 验证密码
      const isValid = await identitySwitcher.verifyIdentityPassword(selectedPubkey, password)

      if (!isValid) {
        showWarning("密码错误，请重试")
        isSwitching = false
        return
      }

      // 执行切换
      await identitySwitcher.switchIdentity(selectedPubkey, password)

      showInfo("身份切换成功")

      // 关闭模态框
      showPasswordModal = false
      selectedPubkey = null
      password = ""

      // 通知父组件
      dispatch("switched", {pubkey: selectedPubkey})

      // 刷新页面以应用新身份
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error) {
      console.error("切换身份失败:", error)
      showWarning("切换失败: " + error.message)
    } finally {
      isSwitching = false
    }
  }

  // 取消切换
  const cancelSwitch = () => {
    showPasswordModal = false
    selectedPubkey = null
    password = ""
  }

  // 获取 npub 显示格式
  const getNpubDisplay = (pubkey: string) => {
    return displayPubkey(pubkey)
  }

  // 获取头像尺寸类名
  const avatarSizeClass = $: sizeClasses[size] || sizeClasses.md
</script>

<!-- 触发按钮 -->
<div class="cursor-pointer" on:click={openMenu}>
  <div class={cx("flex items-center gap-2", showLabel && "flex-row")}>
    <PersonCircle
      pubkey={currentPubkey || ""}
      class={cx(avatarSizeClass, "rounded-full border-2 border-accent")}
    />
    {#if showLabel && currentIdentity}
      <span class="text-sm font-medium">{currentIdentity.name}</span>
    {/if}
    <i class="fa fa-chevron-down text-xs opacity-50" />
  </div>
</div>

<!-- 菜单模态框 -->
{#if showMenu}
  <Modal drawer={true} canClose={true} on:escape={closeMenu}>
    <div class="bg-neutral-800 h-full flex flex-col">
      <!-- 头部 -->
      <div class="p-4 border-b border-neutral-600 flex items-center justify-between">
        <h2 class="text-lg font-bold">账户</h2>
        <button
          class="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-700"
          on:click={closeMenu}>
          <i class="fa fa-times" />
        </button>
      </div>

      <!-- 内容 -->
      <div class="flex-1 overflow-y-auto">
        <!-- 当前账户 -->
        <div class="p-4 border-b border-neutral-600">
          <div class="text-xs font-medium text-neutral-400 mb-3">当前账户</div>
          {#if currentIdentity}
            <div class="flex items-center gap-3 p-3 bg-neutral-700 rounded-lg">
              <PersonCircle pubkey={currentPubkey || ""} class="w-12 h-12" />
              <div class="flex-1 min-w-0">
                <div class="font-medium truncate">{currentIdentity.name}</div>
                <div class="text-sm text-neutral-400 truncate">{getNpubDisplay(currentPubkey)}</div>
              </div>
              <i class="fa fa-check-circle text-accent text-xl" />
            </div>
          {:else}
            <div class="text-sm text-neutral-400">未登录</div>
          {/if}
        </div>

        <!-- 切换账户列表 -->
        {#if sortedIdentities.length > 1}
          <div class="p-4 border-b border-neutral-600">
            <div class="text-xs font-medium text-neutral-400 mb-3">切换账户</div>
            <div class="space-y-2">
              {#each sortedIdentities as identity}
                {#if identity.pubkey !== currentPubkey}
                  <button
                    on:click={() => selectIdentity(identity.pubkey)}
                    class="w-full flex items-center gap-3 p-3 bg-neutral-700 rounded-lg hover:bg-neutral-600 transition-colors">
                    <PersonCircle pubkey={identity.pubkey} class="w-10 h-10" />
                    <div class="flex-1 min-w-0 text-left">
                      <div class="text-sm truncate">{identity.name}</div>
                      <div class="text-xs text-neutral-400 truncate">{getNpubDisplay(identity.pubkey)}</div>
                    </div>
                    <i class="fa fa-chevron-right text-neutral-500" />
                  </button>
                {/if}
              {/each}
            </div>
          </div>
        {/if}

        <!-- 操作按钮 -->
        <div class="p-4 space-y-2">
          <button
            on:click={openAddAccount}
            class="w-full flex items-center gap-3 p-3 bg-accent rounded-lg hover:bg-opacity-80 transition-colors">
            <i class="fa fa-plus-circle" />
            <span class="font-medium">添加账户</span>
          </button>
          <button
            on:click={openSettings}
            class="w-full flex items-center gap-3 p-3 bg-neutral-700 rounded-lg hover:bg-neutral-600 transition-colors">
            <i class="fa fa-cog" />
            <span>账户设置</span>
          </button>
        </div>
      </div>
    </div>
  </Modal>
{/if}

<!-- 密码确认模态框 -->
{#if showPasswordModal}
  <Modal canClose={true} on:escape={cancelSwitch}>
    <div class="bg-neutral-800 rounded-lg p-6 max-w-md mx-auto">
      <div class="mb-4">
        <h2 class="text-xl font-bold mb-2">确认身份切换</h2>
        <p class="text-neutral-400 text-sm">
          切换身份需要验证密码。切换后，您将使用新身份进行所有操作。
        </p>
      </div>

      <div class="mb-4">
        <label class="block text-sm font-medium mb-2">目标账户</label>
        {#if selectedPubkey}
          <div class="flex items-center gap-3 p-3 bg-neutral-700 rounded-lg">
            <PersonCircle pubkey={selectedPubkey} class="w-10 h-10" />
            <div class="flex-1 min-w-0">
              {#each sortedIdentities as identity}
                {#if identity.pubkey === selectedPubkey}
                  <div class="font-medium">{identity.name}</div>
                  <div class="text-xs text-neutral-400">{getNpubDisplay(identity.pubkey)}</div>
                {/if}
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <div class="mb-6">
        <label class="block text-sm font-medium mb-2">密码</label>
        <Input
          type="password"
          bind:value={password}
          placeholder="请输入密码"
          on:keydown={(e) => {
            if (e.key === "Enter" && password) {
              confirmSwitch()
            }
          }}
          autofocus={true} />
      </div>

      <div class="flex gap-3 justify-end">
        <Button
          class="px-4 py-2 border border-neutral-600 rounded-lg"
          on:click={cancelSwitch}>
          取消
        </Button>
        <Button
          class="px-4 py-2 bg-accent rounded-lg"
          disabled={!password || isSwitching}
          on:click={confirmSwitch}>
          {#if isSwitching}
            <i class="fa fa-circle-notch fa-spin mr-2" />
          {/if}
          确认切换
        </Button>
      </div>

      <div class="mt-4 p-3 bg-neutral-700 rounded-lg text-xs text-neutral-400">
        <i class="fa fa-info-circle mr-1" />
        切换身份将清理当前会话数据并重新连接到中继服务器。
      </div>
    </div>
  </Modal>
{/if}
