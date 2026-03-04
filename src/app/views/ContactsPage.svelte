<script lang="ts">
  import {onMount} from "svelte"
  import {pubkey, userFollowList, signer, publishThunk} from "@welshman/app"
  import {FOLLOWS, makeEvent} from "@welshman/util"
  import {Router, addMaximalFallbacks} from "@welshman/router"
  import * as nip19 from "nostr-tools/nip19"
  import QRCode from "qrcode"
  import QrScanner from "qr-scanner"
  import {profilesByPubkey} from "@welshman/app"
  import {router} from "src/app/util/router"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import Input from "src/partials/Input.svelte"
  import Modal from "src/partials/Modal.svelte"
  import {showInfo, showWarning} from "src/partials/Toast.svelte"

  let searchQuery = ""
  let filteredFollows: string[] = []
  let showAddModal = false
  let showShareModal = false
  let newContactNpub = ""
  let npubImageData = ""
  let isAdding = false

  // 从 userFollowList 中提取 pubkey 数组
  $: followsArray = ($userFollowList?.publicTags || []).map(t => t[1])

  // QR Scanner state
  let showScanner = false
  let videoEl: HTMLVideoElement | null = null
  let qrScanner: QrScanner | null = null

  // 过滤联系人列表
  $: {
    const followsList = followsArray
    if (!searchQuery.trim()) {
      filteredFollows = followsList
    } else {
      const query = searchQuery.toLowerCase()
      filteredFollows = followsList.filter(pub => {
        const profile = $profilesByPubkey.get(pub)
        if (profile) {
          const name = profile.name || ""
          const displayName = profile.display_name || ""
          const nip05 = profile.nip05 || ""
          return (
            name.toLowerCase().includes(query) ||
            displayName.toLowerCase().includes(query) ||
            nip05.toLowerCase().includes(query)
          )
        }
        return false
      })
    }
  }

  onMount(async () => {
    // 生成分享 QR 码
    if ($pubkey) {
      await generateShareQR()
    }
  })

  // QR Scanner
  async function startScanner() {
    if (!videoEl) return
    showScanner = true
    qrScanner = new QrScanner(
      videoEl,
      result => {
        const text = result.data
        const pubkey = parseNpub(text)
        if (pubkey) {
          newContactNpub = text
          stopScanner()
          showInfo("QR code scanned!")
        }
      },
      {
        returnDetailedScanResult: true,
        highlightScanRegion: true,
        highlightCodeOutline: true,
      },
    )
    await qrScanner.start()
  }

  function stopScanner() {
    qrScanner?.stop()
    qrScanner?.destroy()
    qrScanner = null
    showScanner = false
  }

  // 打开添加联系人模态框
  function openAddModal() {
    newContactNpub = ""
    showScanner = false
    showAddModal = true
  }

  // 打开分享模态框
  async function openShareModal() {
    if (!$pubkey) {
      showWarning("Please create or select an identity first")
      return
    }
    await generateShareQR()
    showShareModal = true
  }

  // 生成分享 QR 码
  async function generateShareQR() {
    if (!$pubkey) return

    try {
      const npub = nip19.npubEncode($pubkey)
      const profile = $profilesByPubkey.get($pubkey)
      const name = profile?.name || profile?.display_name || "Anonymous"

      // 创建包含 npub 和名称的 JSON
      const shareData = JSON.stringify({
        npub,
        name,
      })

      const qrCode = await QRCode.toDataURL(shareData, {
        width: 256,
        margin: 2,
      })
      npubImageData = qrCode
    } catch (error) {
      console.error("Failed to generate QR code:", error)
    }
  }

  // 从 npub 解析公钥
  function parseNpub(npub: string): string | null {
    try {
      // 尝试直接解析 npub
      if (npub.startsWith("npub")) {
        const decoded = nip19.decode(npub)
        if (decoded.type === "npub") {
          return decoded.data as string
        }
        return null
      }

      // 尝试解析 nprofile
      if (npub.startsWith("nprofile")) {
        const decoded = nip19.decode(npub)
        if (decoded.type === "nprofile") {
          return (decoded.data as any).pubkey
        }
        return null
      }

      // 尝试解析 nsec
      if (npub.startsWith("nsec")) {
        const decoded = nip19.decode(npub)
        if (decoded.type === "nsec") {
          // Convert Uint8Array to hex string
          return Array.from(decoded.data as Uint8Array)
            .map(b => b.toString(16).padStart(2, "0"))
            .join("")
        }
        return null
      }

      // 尝试解析 JSON 格式（来自其他应用的分享）
      try {
        const data = JSON.parse(npub)
        if (data.npub) {
          return parseNpub(data.npub)
        }
        if (data.pubkey) {
          return data.pubkey
        }
      } catch (e) {
        // 不是 JSON 格式
      }

      // 尝试解析裸公钥（hex 格式）
      if (/^[0-9a-f]{64}$/i.test(npub)) {
        return npub.toLowerCase()
      }

      return null
    } catch (error) {
      console.error("Failed to parse npub:", error)
      return null
    }
  }

  // 添加联系人
  async function addContact() {
    if (!newContactNpub.trim()) {
      showWarning("Please enter npub or scan QR code")
      return
    }

    const contactPubkey = parseNpub(newContactNpub.trim())

    if (!contactPubkey) {
      showWarning("Invalid npub format")
      return
    }

    isAdding = true

    try {
      // 检查是否已存在
      const $followsList = followsArray
      if ($followsList.includes(contactPubkey)) {
        showWarning("Contact already exists")
        return
      }

      // 添加到关注列表
      const followList = $followsList.map(pk => ["p", pk])
      followList.push(["p", contactPubkey])

      const unsignedEvent = makeEvent(FOLLOWS, {
        content: "",
        tags: followList,
      })

      const $signerInstance = $signer
      if (!$signerInstance) {
        showWarning("No signer available")
        return
      }

      // Sign the event using the signer
      const signedEvent = await $signerInstance.sign({
        kind: unsignedEvent.kind,
        content: unsignedEvent.content,
        tags: unsignedEvent.tags,
        created_at: unsignedEvent.created_at || Math.floor(Date.now() / 1000),
      })

      await publishThunk({
        event: signedEvent,
        relays: Router.get().FromUser().policy(addMaximalFallbacks).getUrls(),
      })

      showInfo("Contact added successfully!")
      showAddModal = false
      newContactNpub = ""
    } catch (error) {
      console.error("Failed to add contact:", error)
      const message = error instanceof Error ? error.message : "Unknown error"
      showWarning("Failed to add contact: " + message)
    } finally {
      isAdding = false
    }
  }

  // 取消关注
  async function unfollowContact(pubkey: string) {
    if (!confirm("Remove this contact?")) return

    try {
      const $followsList = followsArray
      const updatedFollows = $followsList.filter(pk => pk !== pubkey)

      const unsignedEvent = makeEvent(FOLLOWS, {
        content: "",
        tags: updatedFollows.map(pk => ["p", pk]),
      })

      const $signerInstance = $signer
      if (!$signerInstance) {
        showWarning("No signer available")
        return
      }

      // Sign the event using the signer
      const signedEvent = await $signerInstance.sign({
        kind: unsignedEvent.kind,
        content: unsignedEvent.content,
        tags: unsignedEvent.tags,
        created_at: unsignedEvent.created_at || Math.floor(Date.now() / 1000),
      })

      await publishThunk({
        event: signedEvent,
        relays: Router.get().FromUser().policy(addMaximalFallbacks).getUrls(),
      })

      showInfo("Contact removed")
    } catch (error) {
      console.error("Failed to remove contact:", error)
      showWarning("Failed to remove contact")
    }
  }

  // 打开聊天
  function openChat(contactPubkey: string) {
    router.at(`/chat/${contactPubkey}`).push()
  }

  // 查看个人资料
  function viewProfile(contactPubkey: string) {
    router.at("/people/:entity").qp({pubkey: contactPubkey}).push()
  }

  // 复制 npub
  async function copyNpub(contactPubkey: string) {
    const npub = nip19.npubEncode(contactPubkey)
    await navigator.clipboard.writeText(npub)
    showInfo("npub copied to clipboard")
  }

  // 返回首页
  function goHome() {
    router.at("/").push()
  }
</script>

<div class="contacts-page">
  <!-- Header -->
  <div class="contacts-header">
    <div class="header-top">
      <button class="btn-back" on:click={goHome}>
        <i class="fa fa-arrow-left"></i>
      </button>
      <h1 class="page-title">Contacts</h1>
      <div class="header-actions">
        <button class="btn-icon" on:click={openAddModal} title="Add Contact">
          <i class="fa fa-user-plus"></i>
        </button>
        <button class="btn-icon" on:click={openShareModal} title="Share My Identity">
          <i class="fa fa-qrcode"></i>
        </button>
      </div>
    </div>
    <div class="search-container">
      <Input
        bind:value={searchQuery}
        placeholder="Search contacts..."
        class="search-input">
        <i slot="before" class="fa fa-search" />
        <i
          slot="after"
          class="fa fa-times cursor-pointer"
          style:display={searchQuery ? 'block' : 'none'}
          on:click={() => searchQuery = ''} />
      </Input>
    </div>
  </div>

  <!-- Contacts List -->
  <div class="contacts-container">
    {#if filteredFollows.length === 0}
      <div class="empty-state">
        {#if followsArray && followsArray.length === 0}
          <i class="fa fa-address-book fa-2x"></i>
          <p>No contacts yet</p>
          <button class="btn btn-accent" on:click={openAddModal}>
            <i class="fa fa-user-plus"></i> Add Your First Contact
          </button>
        {:else}
          <i class="fa fa-search fa-2x"></i>
          <p>No contacts match your search</p>
        {/if}
      </div>
    {:else}
      <div class="contacts-list">
        {#each filteredFollows as contactPubkey (contactPubkey)}
          {@const profile = $profilesByPubkey.get(contactPubkey)}
          <div class="contact-card">
            <div class="contact-item" on:click={() => openChat(contactPubkey)}>
              <PersonCircle pubkey={contactPubkey} class="w-14 h-14" />
              <div class="contact-info">
                <div class="contact-name">
                  {profile?.display_name || profile?.name || contactPubkey.slice(0, 8)}
                  {#if profile?.nip05}
                    <i class="fa fa-check-circle text-accent ml-2" title="Verified NIP-05"></i>
                  {/if}
                </div>
                {#if profile?.about}
                  <div class="contact-about">{profile.about.slice(0, 60)}...</div>
                {/if}
                <div class="contact-npub">{nip19.npubEncode(contactPubkey).slice(0, 20)}...</div>
              </div>
            </div>
            <div class="contact-actions">
              <button
                class="btn-sm btn-secondary"
                on:click={() => viewProfile(contactPubkey)}>
                <i class="fa fa-info-circle"></i> Profile
              </button>
              <button
                class="btn-sm btn-secondary"
                on:click={() => copyNpub(contactPubkey)}>
                <i class="fa fa-copy"></i> Copy
              </button>
              <button
                class="btn-sm btn-danger"
                on:click={() => unfollowContact(contactPubkey)}>
                <i class="fa fa-user-minus"></i> Remove
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Add Contact Modal -->
  {#if showAddModal}
    <Modal canClose={true} on:escape={() => { stopScanner(); showAddModal = false }}>
      <div class="modal-content">
        <h2>Add Contact</h2>
        <p class="modal-hint">
          Paste a npub / nprofile, or tap the camera to scan a QR code.
        </p>

        <!-- QR Scanner view -->
        {#if showScanner}
          <div class="scanner-wrap">
            <!-- svelte-ignore a11y-media-has-caption -->
            <video bind:this={videoEl} class="scanner-video" playsinline></video>
            <button class="scanner-close" on:click={stopScanner}>✕ Cancel scan</button>
          </div>
        {:else}
          <div class="form-group">
            <label>npub or nprofile</label>
            <div class="input-row">
              <Input
                bind:value={newContactNpub}
                placeholder="npub1..."
                autofocus={true}
                on:keydown={e => { if (e.key === "Enter") addContact() }} />
              <button
                class="btn-cam"
                on:click={startScanner}
                title="Scan QR code">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </button>
            </div>
          </div>
        {/if}

        <div class="modal-actions">
          <button class="btn btn-secondary" on:click={() => { stopScanner(); showAddModal = false }}>
            Cancel
          </button>
          {#if !showScanner}
            <button
              class="btn btn-accent"
              disabled={!newContactNpub.trim() || isAdding}
              on:click={addContact}>
              {#if isAdding}
                <i class="fa fa-circle-notch fa-spin"></i> Adding...
              {:else}
                Add Contact
              {/if}
            </button>
          {/if}
        </div>
      </div>
    </Modal>
  {/if}

  <!-- Share Modal -->
  {#if showShareModal}
    <Modal canClose={true} on:escape={() => showShareModal = false}>
      <div class="modal-content">
        <h2>Share My Identity</h2>
        <p class="modal-hint">
          Others can scan this QR code to add you as a contact.
        </p>

        <div class="qr-container">
          {#if npubImageData}
            <img src={npubImageData} alt="Share QR code" class="qr-image" />
          {/if}
        </div>

        <div class="share-actions">
          <button class="btn btn-secondary" on:click={() => navigator.clipboard.writeText(nip19.npubEncode($pubkey))}>
            <i class="fa fa-copy"></i> Copy npub
          </button>
          <button class="btn btn-accent" on:click={() => {
            const link = document.createElement('a')
            link.download = 'my-identity-qr.png'
            link.href = npubImageData
            link.click()
          }}>
            <i class="fa fa-download"></i> Save QR Code
          </button>
        </div>
      </div>
    </Modal>
  {/if}
</div>

<style>
  .contacts-page {
    min-height: 100vh;
    background: var(--neutral-900);
    padding-bottom: 80px;
  }

  .contacts-header {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--neutral-900);
    border-bottom: 1px solid var(--neutral-800);
    padding: 16px;
  }

  .header-top {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  .btn-back {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--neutral-800);
    border: none;
    color: var(--neutral-200);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .page-title {
    flex: 1;
    font-size: 24px;
    font-weight: 700;
    color: var(--neutral-100);
    margin: 0;
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }

  .btn-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--neutral-800);
    border: none;
    color: var(--neutral-200);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .btn-icon:hover {
    background: var(--neutral-700);
  }

  .search-container {
    position: relative;
  }

  .search-input {
    width: 100%;
  }

  .contacts-container {
    padding: 16px;
  }

  .contacts-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .contact-card {
    background: var(--neutral-800);
    border-radius: 12px;
    overflow: hidden;
  }

  .contact-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .contact-item:hover {
    background: var(--neutral-700);
  }

  .contact-info {
    flex: 1;
    min-width: 0;
  }

  .contact-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--neutral-100);
    display: flex;
    align-items: center;
    flex-wrap: wrap;
  }

  .contact-about {
    font-size: 14px;
    color: var(--neutral-500);
    margin-top: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .contact-npub {
    font-size: 12px;
    color: var(--neutral-600);
    font-family: monospace;
    margin-top: 4px;
  }

  .contact-actions {
    display: flex;
    gap: 8px;
    padding: 0 16px 16px;
  }

  .btn-sm {
    padding: 6px 12px;
    font-size: 13px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
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

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 40vh;
    text-align: center;
    color: var(--neutral-600);
    padding: 24px;
  }

  .empty-state i {
    margin-bottom: 16px;
    opacity: 0.5;
  }

  .empty-state p {
    margin: 12px 0 24px;
    font-size: 16px;
  }

  .modal-content {
    max-width: 400px;
  }

  .modal-content h2 {
    font-size: 20px;
    font-weight: 600;
    color: var(--neutral-100);
    margin: 0 0 12px 0;
  }

  .modal-hint {
    color: var(--neutral-400);
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

  .modal-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 24px;
  }

  /* QR scanner */
  .scanner-wrap {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 16px;
    background: #000;
    aspect-ratio: 1 / 1;
    max-width: 300px;
    margin-left: auto;
    margin-right: auto;
  }

  .scanner-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .scanner-close {
    position: absolute;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.7);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 20px;
    padding: 6px 16px;
    font-size: 13px;
    cursor: pointer;
    white-space: nowrap;
  }

  /* Input + camera button side by side */
  .input-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .input-row :global(input) {
    flex: 1;
  }

  .btn-cam {
    width: 42px;
    height: 42px;
    border-radius: 10px;
    border: none;
    background: var(--tinted-200, var(--neutral-700));
    color: var(--neutral-300);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.15s;
  }

  .btn-cam:hover {
    background: var(--accent);
    color: #fff;
  }

  .qr-container {
    display: flex;
    justify-content: center;
    padding: 24px;
    background: var(--neutral-700);
    border-radius: 12px;
    margin-bottom: 16px;
  }

  .qr-image {
    width: 256px;
    height: 256px;
    border-radius: 8px;
  }

  .share-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
  }

  @media (min-width: 768px) {
    .contacts-page {
      max-width: 800px;
      margin: 0 auto;
    }
  }
</style>
