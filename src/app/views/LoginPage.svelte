<script lang="ts">
  import {onMount} from "svelte"
  import {pubkey} from "@welshman/app"
  import {Nip01Signer} from "@welshman/signer"
  import {generateSecretKey} from "nostr-tools/pure"
  import {identityManager} from "src/engine/identity/manager"
  import {identitySwitcher} from "src/engine/identity/switcher"
  import {showInfo, showWarning, showError} from "src/partials/Toast.svelte"
  import Input from "src/partials/Input.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import {router} from "src/app/util/router"

  // 从 identityManager 类中解构 identities store
  const {identities} = identityManager

  let loginMethod: "create" | "import" | "select" = "create"
  let importNsec = ""
  let importName = ""
  let importPassword = ""
  let importPasswordConfirm = ""
  let isProcessing = false

  $: identitiesList = $identities

  // 获取身份数量用于创建默认名称
  $: identitiesCount = identitiesList?.length || 0

  onMount(() => {
    identityManager.loadIdentities()

    // 如果已有身份，重定向到首页
    if ($pubkey) {
      router.at("/").push()
    }
  })

  // 创建新身份
  async function createIdentity() {
    isProcessing = true

    try {
      const secretKeyUint8 = generateSecretKey()
      const secretKey = Array.from(secretKeyUint8)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("")
      const name = `Identity ${identitiesCount + 1}`
      const password = Math.random().toString(36).slice(-10)
      await identitySwitcher.addIdentity(secretKey, password, name)

      showInfo("Identity created!")

      // addIdentity 内部已调用 loginWithNip01，$pubkey 立即更新，直接跳首页
      setTimeout(() => {
        router.at("/").push()
      }, 800)
    } catch (error: unknown) {
      console.error("Failed to create identity:", error)
      const message = error instanceof Error ? error.message : "Unknown error"
      showError("Failed to create identity: " + message)
    } finally {
      isProcessing = false
    }
  }

  // 导入 nsec
  async function importNsecKey() {
    if (!importNsec.trim()) {
      showWarning("Please enter your nsec")
      return
    }

    if (!importName.trim()) {
      showWarning("Please enter a name")
      return
    }

    if (!importPassword) {
      showWarning("Please enter a password")
      return
    }

    if (importPassword !== importPasswordConfirm) {
      showWarning("Passwords do not match")
      return
    }

    isProcessing = true

    try {
      // 解析 nsec
      let secretKey: string

      if (importNsec.startsWith("nsec")) {
        const {decode} = await import("nostr-tools/nip19")
        const decoded = decode(importNsec)
        secretKey = decoded.data as string
      } else if (/^[0-9a-f]{64}$/i.test(importNsec)) {
        secretKey = importNsec.toLowerCase()
      } else {
        showWarning("Invalid nsec format")
        isProcessing = false
        return
      }

      // 验证私钥
      const tempSigner = Nip01Signer.fromSecret(secretKey)
      await tempSigner.getPubkey()

      // 检查是否已存在
      const existingPubkey = await tempSigner.getPubkey()
      const existing = identitiesList.find(i => i.pubkey === existingPubkey)
      if (existing) {
        showWarning("This identity already exists")
        isProcessing = false
        return
      }

      await identitySwitcher.addIdentity(secretKey, importPassword, importName)

      showInfo("Identity imported successfully!")

      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error: unknown) {
      console.error("Failed to import identity:", error)
      const message = error instanceof Error ? error.message : "Unknown error"
      showError("Failed to import: " + message)
    } finally {
      isProcessing = false
    }
  }

  // 选择现有身份（无密码模式）
  async function selectIdentity(identity) {
    if (identityManager.hasEncryptedKey(identity.pubkey)) {
      showWarning("This identity requires a password. Please use the Identity page to switch.")
      return
    }

    isProcessing = true

    try {
      // 对于无密码身份，尝试直接切换
      showWarning("Quick switch is only for non-encrypted identities")
    } catch (error) {
      showError("Failed to select identity")
    } finally {
      isProcessing = false
    }
  }

  // 前往首页
  function goHome() {
    router.at("/").push()
  }
</script>

<div class="login-page">
  <div class="login-header">
    <button class="btn-back" on:click={goHome}>
      <i class="fa fa-arrow-left"></i>
    </button>
    <h1 class="page-title">Welcome to Coracle Chat</h1>
  </div>

  <div class="login-content">
    {#if $pubkey}
      <div class="already-logged-in">
        <PersonCircle pubkey={$pubkey} class="w-24 h-24" />
        <p>You are already logged in</p>
        <button class="btn btn-accent" on:click={goHome}>
          Go to Home
        </button>
      </div>
    {:else}
      <!-- 登录方式选择 -->
      <div class="method-selector">
        <button
          class="method-card"
          class:active={loginMethod === "create"}
          on:click={() => loginMethod = "create"}>
          <i class="fa fa-user-plus"></i>
          <span>Create New</span>
        </button>
        <button
          class="method-card"
          class:active={loginMethod === "import"}
          on:click={() => loginMethod = "import"}>
          <i class="fa fa-download"></i>
          <span>Import nsec</span>
        </button>
        <button
          class="method-card"
          class:active={loginMethod === "select"}
          on:click={() => loginMethod = "select"}>
          <i class="fa fa-users"></i>
          <span>Select Identity</span>
        </button>
      </div>

      <!-- 创建新身份 -->
      {#if loginMethod === "create"}
        <div class="login-form">
          <h2>Create New Identity</h2>
          <p class="form-hint">
            A new Nostr identity will be generated for you. Your password will be used to encrypt your private key.
          </p>

          <button
            class="btn btn-accent btn-lg"
            disabled={isProcessing}
            on:click={createIdentity}>
            {#if isProcessing}
              <i class="fa fa-circle-notch fa-spin"></i> Creating...
            {:else}
              <i class="fa fa-magic"></i> Generate New Identity
            {/if}
          </button>

          <p class="security-note">
            <i class="fa fa-shield"></i>
            Your private key is encrypted locally and never leaves your device.
          </p>
        </div>
      {/if}

      <!-- 导入 nsec -->
      {#if loginMethod === "import"}
        <div class="login-form">
          <h2>Import Existing Identity</h2>
          <p class="form-hint">
            Enter your nsec (private key) to import an existing identity.
          </p>

          <div class="form-group">
            <label>nsec or hex private key</label>
            <Input
              type="password"
              bind:value={importNsec}
              placeholder="nsec1..." />
          </div>

          <div class="form-group">
            <label>Identity Name</label>
            <Input
              bind:value={importName}
              placeholder="My Identity" />
          </div>

          <div class="form-group">
            <label>Password</label>
            <Input
              type="password"
              bind:value={importPassword}
              placeholder="Enter password" />
          </div>

          <div class="form-group">
            <label>Confirm Password</label>
            <Input
              type="password"
              bind:value={importPasswordConfirm}
              placeholder="Confirm password" />
          </div>

          <button
            class="btn btn-accent btn-lg"
            disabled={!importNsec || !importName || !importPassword || isProcessing}
            on:click={importNsecKey}>
            {#if isProcessing}
              <i class="fa fa-circle-notch fa-spin"></i> Importing...
            {:else}
              <i class="fa fa-download"></i> Import Identity
            {/if}
          </button>
        </div>
      {/if}

      <!-- 选择现有身份 -->
      {#if loginMethod === "select"}
        <div class="select-identity">
          <h2>Select an Identity</h2>
          <p class="form-hint">
            Choose from your existing identities. Note: Password-protected identities must be switched from the Identity page.
          </p>

          {#if identitiesList.length === 0}
            <div class="empty-state">
              <i class="fa fa-user-circle fa-2x"></i>
              <p>No identities found</p>
              <p class="hint">Create a new identity or import an existing one.</p>
            </div>
          {:else}
            <div class="identities-list">
              {#each identitiesList as identity (identity.pubkey)}
                <div class="identity-item">
                  <PersonCircle pubkey={identity.pubkey} class="w-12 h-12" />
                  <div class="identity-info">
                    <div class="identity-name">{identity.name}</div>
                    <div class="identity-npub">{identity.pubkey.slice(0, 12)}...</div>
                    {#if identityManager.hasEncryptedKey(identity.pubkey)}
                      <span class="badge-locked">
                        <i class="fa fa-lock"></i> Requires Password
                      </span>
                    {/if}
                  </div>
                  <button
                    class="btn btn-sm btn-secondary"
                    disabled={identityManager.hasEncryptedKey(identity.pubkey)}
                    on:click={() => selectIdentity(identity)}>
                    Select
                  </button>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .login-page {
    min-height: 100vh;
    background: var(--neutral-900);
  }

  .login-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: var(--neutral-800);
    border-bottom: 1px solid var(--neutral-700);
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
    flex: 1;
  }

  .login-content {
    padding: 24px 16px;
    max-width: 500px;
    margin: 0 auto;
  }

  .already-logged-in {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 48px 24px;
    text-align: center;
  }

  .already-logged-in p {
    margin: 16px 0 24px;
    color: var(--neutral-400);
  }

  .method-selector {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 24px;
  }

  .method-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 20px 12px;
    background: var(--neutral-800);
    border: 2px solid transparent;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .method-card:hover {
    background: var(--neutral-700);
  }

  .method-card.active {
    border-color: var(--accent);
    background: var(--neutral-700);
  }

  .method-card i {
    font-size: 28px;
    color: var(--neutral-300);
  }

  .method-card.active i {
    color: var(--accent);
  }

  .method-card span {
    font-size: 13px;
    color: var(--neutral-300);
  }

  .login-form {
    background: var(--neutral-800);
    border-radius: 12px;
    padding: 24px;
  }

  .login-form h2 {
    font-size: 20px;
    font-weight: 600;
    color: var(--neutral-100);
    margin: 0 0 8px 0;
  }

  .form-hint {
    color: var(--neutral-500);
    font-size: 14px;
    margin: 0 0 24px 0;
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

  .btn-lg {
    width: 100%;
    padding: 14px;
    font-size: 16px;
    margin-top: 16px;
  }

  .security-note {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: var(--neutral-700);
    border-radius: 8px;
    margin-top: 16px;
    font-size: 14px;
    color: var(--neutral-400);
  }

  .select-identity {
    background: var(--neutral-800);
    border-radius: 12px;
    padding: 24px;
  }

  .select-identity h2 {
    font-size: 20px;
    font-weight: 600;
    color: var(--neutral-100);
    margin: 0 0 8px 0;
  }

  .identities-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 16px;
  }

  .identity-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: var(--neutral-700);
    border-radius: 8px;
  }

  .identity-info {
    flex: 1;
    min-width: 0;
  }

  .identity-name {
    font-weight: 600;
    color: var(--neutral-100);
    font-size: 16px;
  }

  .identity-npub {
    font-size: 12px;
    color: var(--neutral-500);
    font-family: monospace;
    margin-top: 4px;
  }

  .badge-locked {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--neutral-500);
    margin-top: 4px;
  }

  .btn-sm {
    padding: 8px 16px;
    font-size: 14px;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 48px 24px;
    text-align: center;
    color: var(--neutral-600);
  }

  .empty-state i {
    margin-bottom: 16px;
    opacity: 0.5;
  }

  .empty-state .hint {
    font-size: 14px;
    color: var(--neutral-500);
  }

  @media (max-width: 480px) {
    .method-selector {
      grid-template-columns: 1fr;
    }
  }
</style>
