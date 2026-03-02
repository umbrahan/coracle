<script lang="ts">
  import {pubkey} from "@welshman/app"
  import {generateSecretKey} from "nostr-tools/pure"
  import * as nip19 from "nostr-tools/nip19"
  import QRCode from "qrcode"
  import {identityManager} from "src/engine/identity/manager"
  import {identitySwitcher} from "src/engine/identity/switcher"
  import {showInfo, showWarning, showError} from "src/partials/Toast.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import Input from "src/partials/Input.svelte"
  import Modal from "src/partials/Modal.svelte"

  // ─── P0 Fix: destructure the store from the class instance ───────────────
  // identityManager is a class, NOT a store.
  // identityManager.identities IS a writable store — destructure it first,
  // then use the $ prefix reactive subscription in the template.
  const {identities} = identityManager

  $: currentPubkey = $pubkey
  $: currentIdentity = $identities.find(i => i.pubkey === currentPubkey)

  // ─── Create / import identity state ──────────────────────────────────────
  let showCreateModal = false
  let createMode: "generate" | "import" = "generate"
  let createName = ""
  let createPassword = ""
  let createPasswordConfirm = ""
  let createNsec = ""     // P3: nsec import field
  let isCreating = false

  // ─── Password modal state ─────────────────────────────────────────────────
  // P0 Fix: replace the fragile dynamic function reassignment with a clean
  // pendingAction discriminant.  The single confirmPassword() handler branches
  // on this value instead of mutating a closure variable.
  type PendingAction = "switch" | "showQR" | null
  let pendingAction: PendingAction = null
  let showPasswordModal = false
  let passwordInput = ""
  let selectedIdentity: any = null

  // ─── QR modal state ───────────────────────────────────────────────────────
  let showNpubModal = false
  let npubImageData = ""

  // ─── Helpers ─────────────────────────────────────────────────────────────
  function getNpub(pk: string): string {
    return nip19.npubEncode(pk)
  }

  function getShortNpub(pk: string): string {
    const npub = getNpub(pk)
    return `${npub.slice(0, 12)}...${npub.slice(-8)}`
  }

  async function generateNpubQR(pk: string) {
    const npub = getNpub(pk)
    npubImageData = await QRCode.toDataURL(npub, {width: 256, margin: 2})
  }

  async function copyNpub(pk: string) {
    await navigator.clipboard.writeText(getNpub(pk))
    showInfo("npub copied!")
  }

  // P3: Download QR as image
  function downloadQR() {
    const a = document.createElement("a")
    a.href = npubImageData
    a.download = `${selectedIdentity?.name ?? "identity"}-npub.png`
    a.click()
  }

  // ─── Create / import identity ─────────────────────────────────────────────
  function openCreateModal(mode: "generate" | "import" = "generate") {
    createMode = mode
    createName = ""
    createPassword = ""
    createPasswordConfirm = ""
    createNsec = ""
    showCreateModal = true
  }

  async function createIdentity() {
    if (!createName.trim()) {
      showWarning("Please enter a name")
      return
    }
    if (createPassword.length < 6) {
      showWarning("Password must be at least 6 characters")
      return
    }
    if (createPassword !== createPasswordConfirm) {
      showWarning("Passwords do not match")
      return
    }

    let secretKey: string

    if (createMode === "import") {
      // P3: parse nsec
      if (!createNsec.trim().startsWith("nsec1")) {
        showWarning("Please enter a valid nsec key (starts with nsec1)")
        return
      }
      try {
        const decoded = nip19.decode(createNsec.trim())
        if (decoded.type !== "nsec") {
          showWarning("Invalid nsec key")
          return
        }
        // decoded.data is Uint8Array — convert to hex string
        secretKey = Array.from(decoded.data as Uint8Array)
          .map(b => b.toString(16).padStart(2, "0"))
          .join("")
      } catch {
        showWarning("Failed to parse nsec — please check the key")
        return
      }
    } else {
      const secretKeyUint8 = generateSecretKey()
      secretKey = Array.from(secretKeyUint8)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("")
    }

    isCreating = true
    try {
      await identitySwitcher.addIdentity(secretKey, createPassword, createName)
      showInfo(createMode === "import" ? "Identity imported!" : "Identity created!")
      showCreateModal = false
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error"
      showError("Failed: " + message)
    } finally {
      isCreating = false
    }
  }

  // ─── Switch identity ──────────────────────────────────────────────────────
  function switchToIdentity(identity: any) {
    if (identity.pubkey === $pubkey) {
      showInfo("Already using this identity")
      return
    }
    selectedIdentity = identity
    passwordInput = ""
    pendingAction = "switch"
    showPasswordModal = true
  }

  // ─── Show QR code ─────────────────────────────────────────────────────────
  async function showIdentityQR(identity: any) {
    selectedIdentity = identity
    if (identityManager.hasEncryptedKey(identity.pubkey)) {
      // Require password to confirm ownership before revealing QR/npub
      passwordInput = ""
      pendingAction = "showQR"
      showPasswordModal = true
    } else {
      // No encrypted key stored — show directly (read-only / test identity)
      await generateNpubQR(identity.pubkey)
      showNpubModal = true
    }
  }

  // ─── P0 Fix: single password-confirm handler ──────────────────────────────
  async function confirmPassword() {
    if (!passwordInput) {
      showWarning("Please enter password")
      return
    }

    if (pendingAction === "switch") {
      try {
        const ok = await identitySwitcher.verifyIdentityPassword(
          selectedIdentity.pubkey,
          passwordInput,
        )
        if (!ok) {
          showWarning("Invalid password")
          return
        }
        await identitySwitcher.switchIdentity(selectedIdentity.pubkey, passwordInput)
        showInfo("Switched to " + selectedIdentity.name)
        showPasswordModal = false
        setTimeout(() => window.location.reload(), 500)
      } catch (err: any) {
        showError("Switch failed: " + err.message)
      }
    } else if (pendingAction === "showQR") {
      try {
        const ok = await identitySwitcher.verifyIdentityPassword(
          selectedIdentity.pubkey,
          passwordInput,
        )
        if (!ok) {
          showWarning("Invalid password")
          return
        }
        await generateNpubQR(selectedIdentity.pubkey)
        showPasswordModal = false
        showNpubModal = true
      } catch (err: any) {
        showError("Failed: " + err.message)
      }
    }
  }

  function closePasswordModal() {
    showPasswordModal = false
    pendingAction = null
    passwordInput = ""
  }

  // ─── Delete identity ──────────────────────────────────────────────────────
  async function deleteIdentity(identity: any) {
    if (!confirm(`Delete "${identity.name}"? This cannot be undone.`)) return
    try {
      await identitySwitcher.removeIdentity(identity.pubkey)
      showInfo("Identity deleted")
      if (identity.pubkey === currentPubkey) {
        setTimeout(() => window.location.reload(), 800)
      }
    } catch (err: any) {
      showError("Delete failed: " + err.message)
    }
  }
</script>

<div class="page">
  <!-- Header -->
  <div class="page-header">
    <h1 class="page-title">Identities</h1>
    <div class="header-actions">
      <button class="btn-text" on:click={() => openCreateModal("import")}>
        Import
      </button>
      <button class="btn-accent-pill" on:click={() => openCreateModal("generate")}>
        + New
      </button>
    </div>
  </div>

  <!-- Current identity card -->
  {#if currentIdentity}
    <div class="card current-card">
      <div class="card-label">Active Identity</div>
      <div class="identity-hero">
        <PersonCircle pubkey={currentIdentity.pubkey} class="w-16 h-16" />
        <div class="identity-hero-info">
          <div class="identity-hero-name">{currentIdentity.name}</div>
          <div class="identity-hero-npub">{getShortNpub(currentIdentity.pubkey)}</div>
        </div>
        <button class="btn-icon" on:click={() => showIdentityQR(currentIdentity)} title="Show QR">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/>
            <rect x="19" y="14" width="2" height="2"/><rect x="17" y="19" width="4" height="2"/>
            <rect x="14" y="17" width="2" height="2"/>
          </svg>
        </button>
      </div>
    </div>
  {/if}

  <!-- All identities -->
  <div class="card">
    <div class="card-label">All Identities</div>

    {#if $identities.length === 0}
      <div class="empty-state">
        <div class="empty-icon">👤</div>
        <p>No identities yet</p>
        <button class="btn-accent-pill" on:click={() => openCreateModal("generate")}>
          Create Your First Identity
        </button>
      </div>
    {:else}
      <div class="identity-list">
        {#each $identities as identity (identity.pubkey)}
          <div class="identity-row" class:active={identity.pubkey === currentPubkey}>
            <PersonCircle pubkey={identity.pubkey} class="w-10 h-10 flex-shrink-0" />
            <div class="identity-row-info">
              <div class="identity-row-name">
                {identity.name}
                {#if identity.pubkey === currentPubkey}
                  <span class="badge-active">Active</span>
                {/if}
              </div>
              <div class="identity-row-npub">{getShortNpub(identity.pubkey)}</div>
            </div>
            <div class="identity-row-actions">
              {#if identity.pubkey !== currentPubkey}
                <button
                  class="btn-icon btn-switch"
                  on:click={() => switchToIdentity(identity)}
                  title="Switch to this identity">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 3l4 4-4 4"/><path d="M20 7H4"/>
                    <path d="M8 21l-4-4 4-4"/><path d="M4 17h16"/>
                  </svg>
                </button>
              {/if}
              <button
                class="btn-icon"
                on:click={() => showIdentityQR(identity)}
                title="Show QR Code">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/>
                </svg>
              </button>
              <button
                class="btn-icon"
                on:click={() => copyNpub(identity.pubkey)}
                title="Copy npub">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
              </button>
              {#if identity.pubkey !== currentPubkey}
                <button
                  class="btn-icon btn-danger"
                  on:click={() => deleteIdentity(identity)}
                  title="Delete identity">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- ═══ Create / Import Modal ═══════════════════════════════════════════════ -->
{#if showCreateModal}
  <Modal canClose={true} on:escape={() => (showCreateModal = false)}>
    <div class="modal-body">
      <h2>{createMode === "import" ? "Import Identity" : "New Identity"}</h2>

      <!-- Mode tabs -->
      <div class="mode-tabs">
        <button
          class="mode-tab"
          class:active={createMode === "generate"}
          on:click={() => (createMode = "generate")}>
          Generate Key
        </button>
        <button
          class="mode-tab"
          class:active={createMode === "import"}
          on:click={() => (createMode = "import")}>
          Import nsec
        </button>
      </div>

      <div class="form-group">
        <label>Name</label>
        <Input bind:value={createName} placeholder="My Identity" autofocus={true} />
      </div>

      {#if createMode === "import"}
        <div class="form-group">
          <label>Private Key (nsec)</label>
          <Input
            bind:value={createNsec}
            placeholder="nsec1..."
            type="password" />
          <p class="field-hint">Your nsec will be encrypted with the password below and stored locally.</p>
        </div>
      {/if}

      <div class="form-group">
        <label>Password</label>
        <Input type="password" bind:value={createPassword} placeholder="At least 6 characters" />
      </div>

      <div class="form-group">
        <label>Confirm Password</label>
        <Input
          type="password"
          bind:value={createPasswordConfirm}
          placeholder="Repeat password"
          on:keydown={e => e.key === "Enter" && createIdentity()} />
      </div>

      <div class="modal-actions">
        <button class="btn-ghost" on:click={() => (showCreateModal = false)}>Cancel</button>
        <button class="btn-accent-pill" disabled={isCreating} on:click={createIdentity}>
          {#if isCreating}
            <span class="spinner"></span> Working…
          {:else}
            {createMode === "import" ? "Import" : "Create"}
          {/if}
        </button>
      </div>
    </div>
  </Modal>
{/if}

<!-- ═══ Password Modal ════════════════════════════════════════════════════════ -->
{#if showPasswordModal}
  <Modal canClose={true} on:escape={closePasswordModal}>
    <div class="modal-body">
      <h2>
        {pendingAction === "switch" ? "Switch Identity" : "Confirm Identity"}
      </h2>
      <p class="modal-subtitle">
        Enter password for <strong>{selectedIdentity?.name}</strong>
      </p>

      <div class="form-group">
        <label>Password</label>
        <Input
          type="password"
          bind:value={passwordInput}
          placeholder="Enter password"
          autofocus={true}
          on:keydown={e => e.key === "Enter" && confirmPassword()} />
      </div>

      <div class="modal-actions">
        <button class="btn-ghost" on:click={closePasswordModal}>Cancel</button>
        <button class="btn-accent-pill" disabled={!passwordInput} on:click={confirmPassword}>
          {pendingAction === "switch" ? "Switch" : "Show QR"}
        </button>
      </div>
    </div>
  </Modal>
{/if}

<!-- ═══ QR / npub Modal ═══════════════════════════════════════════════════════ -->
{#if showNpubModal}
  <Modal canClose={true} on:escape={() => (showNpubModal = false)}>
    <div class="modal-body modal-body-center">
      <h2>{selectedIdentity?.name}</h2>
      <p class="modal-subtitle">Share this to let others message you</p>

      {#if npubImageData}
        <div class="qr-wrapper">
          <img src={npubImageData} alt="npub QR code" class="qr-img" />
        </div>
        <div class="npub-mono">{getNpub(selectedIdentity.pubkey)}</div>

        <div class="modal-actions modal-actions-center">
          <button class="btn-ghost" on:click={() => copyNpub(selectedIdentity.pubkey)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
            Copy npub
          </button>
          <!-- P3: Save QR as image -->
          <button class="btn-accent-pill" on:click={downloadQR}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Save QR
          </button>
        </div>
      {/if}
    </div>
  </Modal>
{/if}

<style>
  /* ─── Page layout ─────────────────────────────────────────────────────── */
  .page {
    min-height: 100%;
    background: var(--neutral-900);
    padding: 16px;
    padding-bottom: 100px;
    max-width: 560px;
    margin: 0 auto;
  }

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .page-title {
    font-size: 22px;
    font-weight: 700;
    color: var(--neutral-50);
    margin: 0;
  }

  .header-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  /* ─── Cards ───────────────────────────────────────────────────────────── */
  .card {
    background: var(--surface);
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 14px;
  }

  .card-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--neutral-400);
    margin-bottom: 12px;
  }

  /* ─── Current identity hero ───────────────────────────────────────────── */
  .current-card {
    background: var(--surface-elevated);
  }

  .identity-hero {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .identity-hero-info {
    flex: 1;
    min-width: 0;
  }

  .identity-hero-name {
    font-size: 18px;
    font-weight: 600;
    color: var(--neutral-50);
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .identity-hero-npub {
    font-size: 12px;
    color: var(--neutral-400);
    font-family: monospace;
  }

  /* ─── Identity list ───────────────────────────────────────────────────── */
  .identity-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .identity-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 12px;
    transition: background 0.15s;
  }

  .identity-row:hover {
    background: var(--tinted-100);
  }

  .identity-row.active {
    background: color-mix(in srgb, var(--accent) 10%, transparent);
  }

  .identity-row-info {
    flex: 1;
    min-width: 0;
  }

  .identity-row-name {
    font-size: 15px;
    font-weight: 500;
    color: var(--neutral-100);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .identity-row-npub {
    font-size: 11px;
    color: var(--neutral-400);
    font-family: monospace;
    margin-top: 2px;
  }

  .identity-row-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }

  /* ─── Badge ───────────────────────────────────────────────────────────── */
  .badge-active {
    font-size: 10px;
    padding: 2px 7px;
    background: var(--accent);
    color: #fff;
    border-radius: 6px;
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  /* ─── Empty state ─────────────────────────────────────────────────────── */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 16px;
    gap: 12px;
    color: var(--neutral-400);
    text-align: center;
  }

  .empty-icon {
    font-size: 40px;
    line-height: 1;
    opacity: 0.4;
  }

  .empty-state p {
    font-size: 15px;
    margin: 0;
  }

  /* ─── Buttons ─────────────────────────────────────────────────────────── */
  .btn-accent-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 18px;
    background: var(--accent);
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    transition: opacity 0.15s;
    white-space: nowrap;
  }

  .btn-accent-pill:hover {
    opacity: 0.85;
  }

  .btn-accent-pill:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-text {
    background: none;
    border: none;
    color: var(--accent);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    padding: 8px 4px;
  }

  .btn-ghost {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: var(--tinted-200);
    color: var(--neutral-100);
    font-size: 14px;
    font-weight: 500;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    transition: background 0.15s;
  }

  .btn-ghost:hover {
    background: var(--tinted-400);
  }

  .btn-icon {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: none;
    background: var(--tinted-200);
    color: var(--neutral-300);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s;
    flex-shrink: 0;
  }

  .btn-icon:hover {
    background: var(--tinted-400);
    color: var(--neutral-100);
  }

  .btn-switch:hover {
    background: var(--accent);
    color: #fff;
  }

  .btn-danger:hover {
    background: var(--danger);
    color: #fff;
  }

  /* ─── Modals ──────────────────────────────────────────────────────────── */
  .modal-body {
    padding: 4px;
    min-width: 300px;
    max-width: 380px;
  }

  .modal-body-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .modal-body h2 {
    font-size: 18px;
    font-weight: 700;
    color: var(--neutral-50);
    margin: 0 0 6px 0;
  }

  .modal-subtitle {
    font-size: 14px;
    color: var(--neutral-400);
    margin: 0 0 20px 0;
  }

  .modal-subtitle strong {
    color: var(--neutral-200);
  }

  .form-group {
    margin-bottom: 14px;
  }

  .form-group label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: var(--neutral-300);
    margin-bottom: 6px;
  }

  .field-hint {
    font-size: 12px;
    color: var(--neutral-500);
    margin: 6px 0 0 0;
  }

  .modal-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 20px;
  }

  .modal-actions-center {
    justify-content: center;
  }

  /* ─── Mode tabs ───────────────────────────────────────────────────────── */
  .mode-tabs {
    display: flex;
    background: var(--tinted-100);
    border-radius: 10px;
    padding: 3px;
    margin-bottom: 20px;
    gap: 2px;
  }

  .mode-tab {
    flex: 1;
    padding: 7px 12px;
    font-size: 13px;
    font-weight: 500;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    background: transparent;
    color: var(--neutral-400);
    transition: all 0.15s;
  }

  .mode-tab.active {
    background: var(--surface);
    color: var(--neutral-100);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  }

  /* ─── QR display ──────────────────────────────────────────────────────── */
  .qr-wrapper {
    background: #fff;
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 14px;
  }

  .qr-img {
    width: 200px;
    height: 200px;
    display: block;
  }

  .npub-mono {
    font-family: monospace;
    font-size: 11px;
    color: var(--neutral-400);
    word-break: break-all;
    text-align: center;
    max-width: 280px;
    margin-bottom: 4px;
  }

  /* ─── Spinner ─────────────────────────────────────────────────────────── */
  .spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.4);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
