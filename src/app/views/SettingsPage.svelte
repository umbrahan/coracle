<script lang="ts">
  import {onMount} from "svelte"
  import {pubkey} from "@welshman/app"
  import {identityManager} from "src/engine/identity/manager"
  import {showInfo, showWarning} from "src/partials/Toast.svelte"
  import Input from "src/partials/Input.svelte"
  import Button from "src/partials/Button.svelte"
  import {router} from "src/app/util/router"

  let customRelayUrl = ""
  let chatRelays: string[] = []
  let defaultTtl = 7 // 天
  let isAddingRelay = false

  // P0 Fix: destructure the store from the class instance
  const {identities} = identityManager

  $: currentIdentity = $identities.find(i => i.pubkey === $pubkey)

  onMount(() => {
    // 从 localStorage 加载设置
    const storedRelays = localStorage.getItem("chat_relays")
    if (storedRelays) {
      chatRelays = JSON.parse(storedRelays)
    } else {
      // 默认中继
      chatRelays = ["wss://relay.damus.io", "wss://nos.lol"]
    }

    const storedTtl = localStorage.getItem("chat_message_ttl")
    if (storedTtl) {
      defaultTtl = parseInt(storedTtl)
    }
  })

  // 添加中继
  async function addRelay() {
    if (!customRelayUrl.trim()) {
      showWarning("Please enter a relay URL")
      return
    }

    let url = customRelayUrl.trim()
    if (!url.startsWith("wss://") && !url.startsWith("ws://")) {
      url = "wss://" + url
    }

    if (chatRelays.includes(url)) {
      showWarning("Relay already added")
      return
    }

    // 测试中继连接
    isAddingRelay = true
    try {
      const connected = await testRelay(url)
      if (!connected) {
        showWarning("Failed to connect to relay")
        return
      }

      chatRelays = [...chatRelays, url]
      localStorage.setItem("chat_relays", JSON.stringify(chatRelays))
      showInfo("Relay added successfully")
      customRelayUrl = ""
    } catch (error) {
      console.error("Failed to add relay:", error)
      showWarning("Failed to add relay")
    } finally {
      isAddingRelay = false
    }
  }

  // 测试中继连接
  async function testRelay(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const ws = new WebSocket(url)
        const timeout = setTimeout(() => {
          ws.close()
          resolve(false)
        }, 5000)

        ws.onopen = () => {
          clearTimeout(timeout)
          ws.close()
          resolve(true)
        }

        ws.onerror = () => {
          clearTimeout(timeout)
          resolve(false)
        }
      } catch (error) {
        resolve(false)
      }
    })
  }

  // 删除中继
  function removeRelay(url: string) {
    chatRelays = chatRelays.filter(r => r !== url)
    localStorage.setItem("chat_relays", JSON.stringify(chatRelays))
    showInfo("Relay removed")
  }

  // 保存 TTL 设置
  function saveTtl() {
    if (defaultTtl < 1 || defaultTtl > 365) {
      showWarning("TTL must be between 1 and 365 days")
      return
    }
    localStorage.setItem("chat_message_ttl", String(defaultTtl))
    showInfo("TTL setting saved")
  }

  // 清除聊天记录
  async function clearChatHistory() {
    if (!confirm("Are you sure you want to clear all chat history? This cannot be undone.")) {
      return
    }

    try {
      // 清除 IndexedDB
      if (window.indexedDB) {
        const request = indexedDB.deleteDatabase("coracle")
        await new Promise((resolve, reject) => {
          request.onsuccess = resolve
          request.onerror = reject
        })
      }

      // 清除 localStorage 中的聊天相关数据
      localStorage.removeItem("chat_messages")

      showInfo("Chat history cleared")
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error("Failed to clear chat history:", error)
      showWarning("Failed to clear chat history")
    }
  }

  // 导出数据
  async function exportData() {
    if (!$pubkey) {
      showWarning("No active identity")
      return
    }

    try {
      const data = {
        pubkey: $pubkey,
        npub: import("nostr-tools/nip19").then(m => m.npubEncode($pubkey)),
        identity: currentIdentity,
        relays: chatRelays,
        settings: {
          ttl: defaultTtl,
        },
        exportedAt: new Date().toISOString(),
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json"})
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `coracle-backup-${$pubkey.slice(0, 8)}.json`
      a.click()
      URL.revokeObjectURL(url)

      showInfo("Data exported successfully")
    } catch (error) {
      console.error("Failed to export data:", error)
      showWarning("Failed to export data")
    }
  }

  // 返回首页
  function goHome() {
    router.at("/").push()
  }
</script>

<div class="settings-page">
  <div class="settings-header">
    <button class="btn-back" on:click={goHome}>
      <i class="fa fa-arrow-left"></i>
    </button>
    <h1 class="page-title">Settings</h1>
  </div>

  <div class="settings-content">
    <!-- Relay Settings -->
    <section class="settings-section">
      <h2>Chat Relays</h2>
      <p class="section-hint">
        Messages will be sent to and received from these relays.
      </p>

      <div class="relay-list">
        {#each chatRelays as relayUrl (relayUrl)}
          <div class="relay-item">
            <span class="relay-url">{relayUrl}</span>
            <button class="btn-icon btn-delete" on:click={() => removeRelay(relayUrl)}>
              <i class="fa fa-trash"></i>
            </button>
          </div>
        {/each}
      </div>

      <div class="add-relay-form">
        <Input
          bind:value={customRelayUrl}
          placeholder="wss://relay.example.com"
          on:keydown={(e) => {
            if (e.key === "Enter") {
              addRelay()
            }
          }} />
        <Button
          class="btn-add"
          disabled={!customRelayUrl.trim() || isAddingRelay}
          on:click={addRelay}>
          {#if isAddingRelay}
            <i class="fa fa-circle-notch fa-spin"></i>
          {:else}
            <i class="fa fa-plus"></i>
          {/if}
        </Button>
      </div>
    </section>

    <!-- Message Settings -->
    <section class="settings-section">
      <h2>Messages</h2>

      <div class="form-group">
        <label>Message TTL (days)</label>
        <div class="ttl-input-group">
          <Input
            type="number"
            bind:value={defaultTtl}
            min="1"
            max="365"
            class="ttl-input" />
          <Button class="btn-save" on:click={saveTtl}>
            Save
          </Button>
        </div>
        <p class="form-hint">
          Messages will expire and be automatically deleted after this many days.
        </p>
      </div>
    </section>

    <!-- Data Management -->
    <section class="settings-section">
      <h2>Data Management</h2>

      <div class="data-actions">
        <button class="btn btn-secondary" on:click={exportData}>
          <i class="fa fa-download"></i> Export Data
        </button>
        <button class="btn btn-danger" on:click={clearChatHistory}>
          <i class="fa fa-trash"></i> Clear Chat History
        </button>
      </div>
    </section>

    <!-- Account -->
    <section class="settings-section">
      <h2>Account</h2>
      {#if currentIdentity}
        <div class="account-info">
          <div class="account-label">Current Identity</div>
          <div class="account-name">{currentIdentity.name}</div>
          <div class="account-pubkey">{currentIdentity.pubkey.slice(0, 16)}...</div>
        </div>
        <button class="btn btn-secondary" on:click={() => router.at("/identity").push()}>
          <i class="fa fa-user"></i> Manage Identities
        </button>
      {:else}
        <p class="no-account">No active identity</p>
        <button class="btn btn-accent" on:click={() => router.at("/login").push()}>
          <i class="fa fa-sign-in"></i> Create or Select Identity
        </button>
      {/if}
    </section>

    <!-- App Info -->
    <section class="settings-section">
      <h2>About</h2>
      <div class="app-info">
        <div class="info-item">
          <span class="info-label">App</span>
          <span class="info-value">Coracle Chat</span>
        </div>
        <div class="info-item">
          <span class="info-label">Version</span>
          <span class="info-value">0.1.0</span>
        </div>
        <div class="info-item">
          <span class="info-label">Protocol</span>
          <span class="info-value">Nostr</span>
        </div>
      </div>
    </section>
  </div>
</div>

<style>
  .settings-page {
    min-height: 100vh;
    background: var(--neutral-900);
    padding-bottom: 80px;
  }

  .settings-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: var(--neutral-800);
    border-bottom: 1px solid var(--neutral-700);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .btn-back {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--neutral-700);
    border: none;
    color: var(--neutral-200);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .page-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--neutral-100);
    margin: 0;
  }

  .settings-content {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .settings-section {
    background: var(--neutral-800);
    border-radius: 12px;
    padding: 16px;
  }

  .settings-section h2 {
    font-size: 16px;
    font-weight: 600;
    color: var(--neutral-200);
    margin: 0 0 8px 0;
  }

  .section-hint {
    font-size: 14px;
    color: var(--neutral-500);
    margin: 0 0 16px 0;
  }

  .relay-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }

  .relay-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: var(--neutral-700);
    border-radius: 8px;
  }

  .relay-url {
    font-family: monospace;
    font-size: 14px;
    color: var(--neutral-300);
  }

  .btn-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: none;
    background: var(--neutral-600);
    color: var(--neutral-300);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .btn-icon:hover {
    background: var(--neutral-500);
  }

  .btn-delete:hover {
    background: #dc0c0c;
    color: white;
  }

  .add-relay-form {
    display: flex;
    gap: 8px;
  }

  .add-relay-form Input {
    flex: 1;
  }

  .btn-add {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-group label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: var(--neutral-300);
    margin-bottom: 8px;
  }

  .ttl-input-group {
    display: flex;
    gap: 8px;
  }

  .ttl-input {
    flex: 1;
    max-width: 150px;
  }

  .form-hint {
    font-size: 13px;
    color: var(--neutral-500);
    margin-top: 8px;
  }

  .data-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .btn {
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-secondary {
    background: var(--neutral-700);
    color: var(--neutral-200);
    border: none;
  }

  .btn-secondary:hover {
    background: var(--neutral-600);
  }

  .btn-danger {
    background: transparent;
    color: #dc0c0c;
    border: 1px solid #dc0c0c;
  }

  .btn-danger:hover {
    background: #dc0c0c;
    color: white;
  }

  .btn-save {
    padding: 12px 24px;
  }

  .account-info {
    padding: 16px;
    background: var(--neutral-700);
    border-radius: 8px;
    margin-bottom: 12px;
  }

  .account-label {
    font-size: 12px;
    color: var(--neutral-500);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .account-name {
    font-size: 18px;
    font-weight: 600;
    color: var(--neutral-100);
    margin: 4px 0;
  }

  .account-pubkey {
    font-family: monospace;
    font-size: 12px;
    color: var(--neutral-500);
  }

  .no-account {
    color: var(--neutral-500);
    margin-bottom: 12px;
  }

  .app-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid var(--neutral-700);
  }

  .info-item:last-child {
    border-bottom: none;
  }

  .info-label {
    color: var(--neutral-500);
    font-size: 14px;
  }

  .info-value {
    color: var(--neutral-200);
    font-size: 14px;
  }

  @media (min-width: 768px) {
    .settings-page {
      max-width: 600px;
      margin: 0 auto;
    }
  }
</style>
