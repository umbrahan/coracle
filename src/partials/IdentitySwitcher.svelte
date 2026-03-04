<script lang="ts">
  import {createEventDispatcher} from "svelte"
  import {onMount} from "svelte"
  import {pubkey, get} from "@welshman/app"
  import {displayPubkey} from "@welshman/util"
  import * as nip19 from "nostr-tools/nip19"
  import cx from "classnames"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import Menu from "src/partials/Menu.svelte"
  import MenuItem from "src/partials/MenuItem.svelte"
  import Popover from "src/partials/Popover.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Button from "src/partials/Button.svelte"
  import Input from "src/partials/Input.svelte"
  import {showInfo, showWarning} from "src/partials/Toast.svelte"
  import {identityManager} from "src/engine/identity/manager"
  import {identitySwitcher} from "src/engine/identity/switcher"

  export let size: "sm" | "md" | "lg" = "md"
  export let showLabel = false

  const dispatch = createEventDispatcher()
  let popoverInstance = null
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

  // 打开添加账户
  const openAddAccount = () => {
    popoverInstance?.hide()
    dispatch("addAccount")
  }

  // 打开账户设置
  const openSettings = () => {
    popoverInstance?.hide()
    dispatch("settings")
  }

  // 选择身份进行切换
  const selectIdentity = (targetPubkey: string) => {
    // 如果是当前账户，不做任何操作
    if (targetPubkey === currentPubkey) {
      popoverInstance?.hide()
      return
    }

    selectedPubkey = targetPubkey
    showPasswordModal = true
    popoverInstance?.hide()
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

  // 获取完整 npub
  const getNpub = (pubkey: string) => {
    return nip19.npubEncode(pubkey)
  }

  // 获取头像尺寸类名
  const avatarSizeClass = $: sizeClasses[size] || sizeClasses.md
</script>

<!-- Popover 菜单 -->
<Popover bind:this={popoverInstance} placement="bottom-end" arrow={true}>
  <div slot="trigger" class="cursor-pointer">
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

  <div slot="tooltip" let:instance>
    <Menu class="min-w-[280px] max-w-[320px]">
      <div class="p-3 border-b border-neutral-600">
        <div class="text-xs font-medium text-neutral-400 mb-2">当前账户</div>
        {#if currentIdentity}
          <div class="flex items-center gap-3">
            <PersonCircle pubkey={currentPubkey || ""} class="w-10 h-10" />
            <div class="flex-1 min-w-0">
              <div class="font-medium truncate">{currentIdentity.name}</div>
              <div class="text-xs text-neutral-400 truncate">{getNpubDisplay(currentPubkey)}</div>
            </div>
            <i class="fa fa-check-circle text-accent" />
          </div>
        {:else}
          <div class="text-sm text-neutral-400">未登录</div>
        {/if}
      </div>

      {#if sortedIdentities.length > 1}
        <div class="max-h-[300px] overflow-y-auto">
          <div class="text-xs font-medium text-neutral-400 p-3 pb-0">切换账户</div>
          {#each sortedIdentities as identity}
            {#if identity.pubkey !== currentPubkey}
              <MenuItem
                on:click={() => selectIdentity(identity.pubkey)}
                class="flex items-center gap-3 px-3 py-2">
                <PersonCircle pubkey={identity.pubkey} class="w-8 h-8" />
                <div class="flex-1 min-w-0">
                  <div class="text-sm truncate">{identity.name}</div>
                  <div class="text-xs text-neutral-400 truncate">{getNpubDisplay(identity.pubkey)}</div>
                </div>
              </MenuItem>
            {/if}
          {/each}
        </div>
      {/if}

      <div class="border-t border-neutral-600">
        <MenuItem
          on:click={openAddAccount}
          class="flex items-center gap-3 px-3 py-2 text-accent">
          <i class="fa fa-plus-circle" />
          <span>添加账户</span>
        </MenuItem>
        <MenuItem
          on:click={openSettings}
          class="flex items-center gap-3 px-3 py-2">
          <i class="fa fa-cog" />
          <span>账户设置</span>
        </MenuItem>
      </div>
    </Menu>
  </div>
</Popover>

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
