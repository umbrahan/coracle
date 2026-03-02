<script lang="ts">
  import {onMount, onDestroy, tick} from "svelte"
  import {pubkey, signer, repository, profilesByPubkey} from "@welshman/app"
  import {makeEvent, DIRECT_MESSAGE} from "@welshman/util"
  import {publishThunk} from "@welshman/app"
  import {decrypt as signerDecrypt} from "@welshman/signer"
  import * as nip19 from "nostr-tools/nip19"
  import {get} from "svelte/store"
  import {router} from "src/app/util/router"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import {getChatRelays} from "src/engine/utils/relay-policy"
  import {MessageTTLManager} from "src/engine/utils/message-ttl"
  import type {TrustedEvent} from "@welshman/util"

  export let targetPubkey: string

  let messageInput = ""
  let isSending = false
  let chatRelays: string[] = []
  let messages: TrustedEvent[] = []
  let ttlManager: MessageTTLManager
  let subscription: any = null
  let messagesEl: HTMLElement
  let textareaEl: HTMLTextAreaElement

  $: contact = $profilesByPubkey.get(targetPubkey)
  $: contactName =
    contact?.display_name || contact?.name || targetPubkey.slice(0, 8) + "…"

  onMount(async () => {
    ttlManager = new MessageTTLManager(1000)
    ttlManager.start()

    const relaySet = getChatRelays()
    chatRelays = relaySet.urls

    await subscribeToMessages()

    ttlManager.onExpired(event => {
      messages = messages.filter(m => m.id !== event.id)
    })

    await tick()
    scrollToBottom()
  })

  onDestroy(() => {
    subscription?.stop()
    ttlManager?.stop()
  })

  async function subscribeToMessages() {
    const {SimplePool} = await import("nostr-tools/pool")
    const pool = new SimplePool()
    const currentPubkey = get(pubkey)
    if (!currentPubkey || !targetPubkey) return

    const authors = [currentPubkey, targetPubkey]
    const kinds = [DIRECT_MESSAGE]
    const relays = getChatRelays().urls

    const history = repository.query([{kinds, authors}])
    const chatHistory = history.filter(event => {
      const recipients = event.tags.filter(t => t[0] === "p").map(t => t[1])
      return (
        (event.pubkey === currentPubkey && recipients.includes(targetPubkey)) ||
        (event.pubkey === targetPubkey && recipients.includes(currentPubkey))
      )
    })

    chatHistory.forEach(msg => ttlManager.add(msg))
    messages = ttlManager.getValidMessages().sort((a, b) => a.created_at - b.created_at)

    subscription = pool.subscribe(relays, {kinds, authors}, {
      onevent(event) {
        const recipients = event.tags.filter(t => t[0] === "p").map(t => t[1])
        if (
          (event.pubkey === currentPubkey && recipients.includes(targetPubkey)) ||
          (event.pubkey === targetPubkey && recipients.includes(currentPubkey))
        ) {
          ttlManager.add(event)
          messages = ttlManager.getValidMessages().sort((a, b) => a.created_at - b.created_at)
          tick().then(() => scrollToBottom())
        }
      },
    })
  }

  async function decryptMessage(event: TrustedEvent): Promise<string> {
    try {
      const $signerInstance = get(signer)
      if (!$signerInstance) return "…"
      const currentPubkey = get(pubkey)
      const decryptPubkey =
        event.pubkey === currentPubkey ? targetPubkey : event.pubkey
      // signerDecrypt auto-detects NIP-04 vs NIP-44 based on content format
      return await signerDecrypt($signerInstance, decryptPubkey, event.content)
    } catch {
      return "⚠ 无法解密"
    }
  }

  function formatTime(timestamp: number): string {
    const date = new Date(timestamp * 1000)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)
    if (diffDays === 0) return date.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})
    if (diffDays === 1) return "昨天"
    if (diffDays < 7) return date.toLocaleDateString([], {weekday: "short"})
    return date.toLocaleDateString([], {month: "short", day: "numeric"})
  }

  const isMyMessage = (event: TrustedEvent) => event.pubkey === get(pubkey)

  function scrollToBottom() {
    if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight
  }

  async function sendMessage() {
    if (!messageInput.trim() || !get(signer) || isSending) return
    isSending = true
    const content = messageInput.trim()
    messageInput = ""
    resizeTextarea()

    try {
      // Use NIP-44 encryption (more secure); decryptMessage falls back to NIP-04 for old messages
      const encryptedContent = await get(signer).nip44.encrypt(targetPubkey, content)
      const event = makeEvent(DIRECT_MESSAGE, {
        content: encryptedContent,
        tags: [
          ["p", targetPubkey],
          ["expiration", String(Math.floor(Date.now() / 1000) + 86400 * 7)],
        ],
      })

      await publishThunk({event, relays: chatRelays})
      ttlManager.add({...event, pubkey: get(pubkey)} as TrustedEvent)
      messages = ttlManager.getValidMessages().sort((a, b) => a.created_at - b.created_at)
      await tick()
      scrollToBottom()
    } catch (err) {
      console.error("Failed to send:", err)
      messageInput = content
    } finally {
      isSending = false
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function resizeTextarea() {
    if (!textareaEl) return
    textareaEl.style.height = "auto"
    textareaEl.style.height = Math.min(textareaEl.scrollHeight, 120) + "px"
  }
</script>

<div class="chat-root">
  <!-- ── Header ───────────────────────────────────────────── -->
  <header class="chat-header">
    <button class="back-btn" on:click={() => window.history.back()}>
      <svg width="11" height="18" viewBox="0 0 11 18" fill="none">
        <path d="M9.5 1.5L2 9L9.5 16.5" stroke="currentColor" stroke-width="2.2"
          stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <button class="header-center"
      on:click={() => router.at("/people/:entity").qp({pubkey: targetPubkey}).push()}>
      <PersonCircle pubkey={targetPubkey} class="h-9 w-9 rounded-full" />
      <div class="header-info">
        <span class="header-name">{contactName}</span>
        {#if contact?.nip05}
          <span class="header-sub">{contact.nip05}</span>
        {/if}
      </div>
    </button>

    <button class="header-action"
      on:click={() => navigator.clipboard?.writeText(nip19.npubEncode(targetPubkey))}
      title="复制 npub">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2"/>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg>
    </button>
  </header>

  <!-- ── Messages ──────────────────────────────────────────── -->
  <div class="messages-scroll" bind:this={messagesEl}>
    {#if messages.length === 0}
      <div class="empty-chat">
        <PersonCircle pubkey={targetPubkey} class="h-18 w-18 rounded-full" />
        <p class="empty-name">{contactName}</p>
        <p class="empty-hint">发送第一条消息吧</p>
      </div>
    {:else}
      <div class="messages-inner">
        {#each messages as message, i (message.id)}
          {@const mine = isMyMessage(message)}
          {@const prevSame = i > 0 && isMyMessage(messages[i - 1]) === mine}
          <div class="msg-row" class:mine>
            {#if !mine}
              {#if !prevSame}
                <PersonCircle pubkey={message.pubkey} class="h-7 w-7 rounded-full flex-shrink-0" />
              {:else}
                <div class="avatar-spacer"></div>
              {/if}
            {/if}

            {#await decryptMessage(message)}
              <div class="bubble" class:mine class:tail={!prevSame}>
                <span class="bubble-loading">···</span>
              </div>
            {:then content}
              <div class="bubble" class:mine class:tail={!prevSame}>
                <span class="bubble-text">{content}</span>
                <span class="bubble-time">{formatTime(message.created_at)}</span>
              </div>
            {/await}
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- ── Input ─────────────────────────────────────────────── -->
  <div class="input-bar">
    <div class="input-inner">
      <textarea
        bind:this={textareaEl}
        bind:value={messageInput}
        placeholder="消息…"
        rows="1"
        on:keydown={handleKeydown}
        on:input={resizeTextarea}
        class="msg-input"
      />
      <button
        class="send-btn"
        class:active={!!messageInput.trim() && !isSending && !!$signer}
        disabled={!messageInput.trim() || isSending || !$signer}
        on:click={sendMessage}>
        {#if isSending}
          <svg class="spin" width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2.5">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
          </svg>
        {:else}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        {/if}
      </button>
    </div>
  </div>
</div>

<style>
  .chat-root {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--neutral-900);
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif;
  }

  /* Header */
  .chat-header {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 10px 12px;
    padding-top: calc(10px + env(safe-area-inset-top, 0px));
    background: var(--surface-overlay, var(--neutral-800));
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 0.5px solid var(--neutral-700);
    position: sticky;
    top: 0;
    z-index: 10;
    min-height: 56px;
  }

  .back-btn {
    color: var(--accent);
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px 10px 8px 4px;
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .header-center {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    min-width: 0;
    background: none;
    border: none;
    text-align: left;
  }

  .header-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .header-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--neutral-100);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .header-sub {
    font-size: 11px;
    color: var(--neutral-500);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .header-action {
    color: var(--accent);
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  /* Messages */
  .messages-scroll {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
  }

  .messages-inner {
    display: flex;
    flex-direction: column;
    padding: 12px 8px 8px;
    gap: 2px;
  }

  .empty-chat {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    gap: 8px;
  }

  .empty-name {
    font-size: 17px;
    font-weight: 600;
    color: var(--neutral-200);
    margin: 4px 0 0;
  }

  .empty-hint {
    font-size: 14px;
    color: var(--neutral-500);
    margin: 0;
  }

  /* Row */
  .msg-row {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    padding: 1px 4px;
  }

  .msg-row.mine {
    flex-direction: row-reverse;
  }

  .avatar-spacer {
    width: 28px;
    flex-shrink: 0;
  }

  /* Bubble */
  .bubble {
    display: inline-flex;
    flex-direction: row;
    align-items: flex-end;
    gap: 6px;
    padding: 8px 12px;
    border-radius: 18px;
    background: var(--bubble-other-bg, #e9e9eb);
    color: var(--bubble-other-text, #1c1c1e);
    word-break: break-word;
    max-width: min(72vw, 380px);
  }

  .bubble.tail { border-bottom-left-radius: 4px; }
  .bubble.mine { background: var(--bubble-self-bg); color: var(--bubble-self-text); }
  .bubble.mine.tail { border-bottom-left-radius: 18px; border-bottom-right-radius: 4px; }

  .bubble-text {
    font-size: 15px;
    line-height: 1.45;
    white-space: pre-wrap;
  }

  .bubble-time {
    font-size: 10px;
    opacity: 0.55;
    white-space: nowrap;
    flex-shrink: 0;
    align-self: flex-end;
    margin-bottom: 1px;
  }

  .bubble-loading {
    font-size: 20px;
    letter-spacing: 3px;
    opacity: 0.35;
  }

  /* Input */
  .input-bar {
    padding: 8px 12px;
    padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
    background: var(--surface-overlay, var(--neutral-800));
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 0.5px solid var(--neutral-700);
  }

  .input-inner {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    background: var(--neutral-800);
    border: 1px solid var(--neutral-700);
    border-radius: 22px;
    padding: 6px 6px 6px 14px;
    transition: border-color 0.15s;
  }

  .input-inner:focus-within { border-color: var(--accent); }

  .msg-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    resize: none;
    font-size: 15px;
    line-height: 1.4;
    color: var(--neutral-100);
    min-height: 22px;
    max-height: 120px;
    font-family: inherit;
    caret-color: var(--accent);
  }

  .msg-input::placeholder { color: var(--neutral-500); }

  .send-btn {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: none;
    background: var(--neutral-700);
    color: var(--neutral-500);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    cursor: default;
    transition: background 0.15s, color 0.15s;
  }

  .send-btn.active {
    background: var(--accent);
    color: #fff;
    cursor: pointer;
  }

  .send-btn.active:active { filter: brightness(0.9); }

  @keyframes spin { to { transform: rotate(360deg); } }
  .spin { animation: spin 0.8s linear infinite; }

  @media (min-width: 768px) {
    .chat-root {
      max-width: 800px;
      margin: 0 auto;
      border-left: 0.5px solid var(--neutral-700);
      border-right: 0.5px solid var(--neutral-700);
    }
  }
</style>
