<svelte:options customElement="coracle-chat" />
<!--
  ChatWidget.svelte — 可嵌入聊天组件

  用法（Svelte）：
    <ChatWidget
      myPubkey="npub1..."
      peerPubkey="npub1..."
      relayUrl="wss://my-relay.example.com"
      theme="ios-dark"
    />

  用法（Web Component，任意框架）：
    <coracle-chat
      my-pubkey="npub1..."
      peer-pubkey="npub1..."
      relay-url="wss://my-relay.example.com"
      theme="ios-dark"
    ></coracle-chat>

  尺寸建议：
    width: 360–480px  height: 500–700px
    或者 100% 填满容器
-->
<script lang="ts">
  import {onMount, onDestroy, tick} from "svelte"
  import {Nip01Signer} from "@welshman/signer"
  import {makeEvent, DIRECT_MESSAGE} from "@welshman/util"
  import {finalizeEvent} from "nostr-tools/pure"
  import * as nip19 from "nostr-tools/nip19"
  import {MessageTTLManager} from "src/engine/utils/message-ttl"
  import {THEMES, type ThemeName} from "src/partials/themes"
  import type {TrustedEvent} from "@welshman/util"

  // ── Props ─────────────────────────────────────────────────────────
  /** 当前用户的 npub 或 hex pubkey */
  export let myPubkey = ""
  /** 对话对象的 npub 或 hex pubkey */
  export let peerPubkey = ""
  /** 私有 relay URL（默认走 localStorage 配置） */
  export let relayUrl = ""
  /** 主题名称 */
  export let theme: ThemeName = "ios-dark"
  /** 私钥（nsec 或 hex），如不传则只读模式 */
  export let nsec = ""
  /** 占位文字 */
  export let placeholder = "消息…"
  /** 是否显示对方信息头部（嵌入时可关闭） */
  export let showHeader = true

  // ── Internal state ────────────────────────────────────────────────
  let messages: Array<{id: string; mine: boolean; text: string; ts: number}> = []
  let messageInput = ""
  let isSending = false
  let ttlManager: MessageTTLManager
  let messagesEl: HTMLElement
  let textareaEl: HTMLTextAreaElement
  let pool: any = null
  let subscription: any = null
  let signer: any = null

  // Resolve pubkeys (accept npub or hex)
  function resolvePubkey(key: string): string {
    if (!key) return ""
    if (key.startsWith("npub")) {
      try { return nip19.decode(key).data as string } catch { return "" }
    }
    return key
  }

  $: myHex = resolvePubkey(myPubkey)
  $: peerHex = resolvePubkey(peerPubkey)
  $: relays = relayUrl ? [relayUrl] : (
    (() => { try { return JSON.parse(localStorage.getItem("chat_relays") ?? "[]") } catch { return [] } })()
  ) as string[]

  // CSS variables injected into shadow DOM
  $: themeVars = Object.entries(THEMES[theme] ?? THEMES["ios-dark"])
    .map(([k, v]) => `--${k}: ${v};`)
    .join(" ")

  onMount(async () => {
    // Init signer if nsec provided
    if (nsec) {
      const secretHex = nsec.startsWith("nsec")
        ? (nip19.decode(nsec).data as Uint8Array)
        : nsec
      signer = Nip01Signer.fromSecret(secretHex as any)
    }

    ttlManager = new MessageTTLManager(1000)
    ttlManager.start()
    ttlManager.onExpired(ev => {
      messages = messages.filter(m => m.id !== ev.id)
    })

    if (relays.length > 0 && myHex && peerHex) {
      await setupSubscription()
    }
  })

  // Get secret key from signer
  function getSignerSecretKey(): Uint8Array {
    // Nip01Signer has a secretKey property
    return (signer as any).secretKey
  }

  onDestroy(() => {
    subscription?.stop?.()
    ttlManager?.stop()
  })

  async function setupSubscription() {
    const {SimplePool} = await import("nostr-tools/pool")
    pool = new SimplePool()

    const filters = [{
      kinds: [DIRECT_MESSAGE],
      authors: [myHex, peerHex],
    }]

    subscription = pool.subscribe(relays, filters, {
      onevent: async (ev: TrustedEvent) => {
        const recipients = ev.tags.filter(t => t[0] === "p").map(t => t[1])
        const relevant =
          (ev.pubkey === myHex && recipients.includes(peerHex)) ||
          (ev.pubkey === peerHex && recipients.includes(myHex))
        if (!relevant) return

        ttlManager.add(ev)
        const text = await tryDecrypt(ev)
        const entry = {id: ev.id, mine: ev.pubkey === myHex, text, ts: ev.created_at}
        messages = [...messages.filter(m => m.id !== ev.id), entry]
          .sort((a, b) => a.ts - b.ts)
        await tick()
        scrollToBottom()
      },
    })
  }

  async function tryDecrypt(ev: TrustedEvent): Promise<string> {
    if (!signer) return "🔒 加密消息"
    try {
      const decryptWith = ev.pubkey === myHex ? peerHex : ev.pubkey
      return await signer.nip04.decrypt(decryptWith, ev.content)
    } catch {
      return "⚠ 无法解密"
    }
  }

  async function sendMessage() {
    if (!messageInput.trim() || !signer || isSending || !pool) return
    isSending = true
    const content = messageInput.trim()
    messageInput = ""
    resizeTextarea()

    try {
      const encrypted = await signer.nip04.encrypt(peerHex, content)
      const unsignedEvent = makeEvent(DIRECT_MESSAGE, {
        content: encrypted,
        tags: [["p", peerHex], ["expiration", String(Math.floor(Date.now() / 1000) + 86400 * 7)]],
      })
      const event = finalizeEvent(unsignedEvent, getSignerSecretKey())

      pool.publish(relays, event)

      const entry = {id: event.id, mine: true, text: content, ts: event.created_at}
      messages = [...messages, entry]
      await tick()
      scrollToBottom()
    } catch (err) {
      console.error("[ChatWidget] send failed:", err)
      messageInput = content
    } finally {
      isSending = false
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  function resizeTextarea() {
    if (!textareaEl) return
    textareaEl.style.height = "auto"
    textareaEl.style.height = Math.min(textareaEl.scrollHeight, 100) + "px"
  }

  function scrollToBottom() {
    if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight
  }

  function fmt(ts: number): string {
    return new Date(ts * 1000).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})
  }
</script>

<!-- Root element carries theme CSS variables -->
<div class="cw-root" style={themeVars}>
  {#if showHeader}
    <div class="cw-header">
      <div class="cw-header-info">
        <span class="cw-peer-id">{peerPubkey ? peerPubkey.slice(0, 16) + "…" : "未设置对话对象"}</span>
      </div>
    </div>
  {/if}

  <div class="cw-messages" bind:this={messagesEl}>
    {#if messages.length === 0}
      <div class="cw-empty">开始对话吧</div>
    {:else}
      {#each messages as msg (msg.id)}
        <div class="cw-row" class:mine={msg.mine}>
          <div class="cw-bubble" class:mine={msg.mine}>
            <span class="cw-text">{msg.text}</span>
            <span class="cw-time">{fmt(msg.ts)}</span>
          </div>
        </div>
      {/each}
    {/if}
  </div>

  {#if signer}
    <div class="cw-input-bar">
      <div class="cw-input-wrap">
        <textarea
          bind:this={textareaEl}
          bind:value={messageInput}
          {placeholder}
          rows="1"
          on:keydown={handleKeydown}
          on:input={resizeTextarea}
          class="cw-textarea"
        />
        <button
          class="cw-send"
          class:active={!!messageInput.trim() && !isSending}
          on:click={sendMessage}
          disabled={!messageInput.trim() || isSending}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  {:else}
    <div class="cw-readonly">只读模式（未提供私钥）</div>
  {/if}
</div>

<style>
  /* All styles scoped — safe for Shadow DOM embedding */
  .cw-root {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    background: var(--neutral-900, #000);
    color: var(--neutral-100, #f2f2f7);
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif;
    font-size: 14px;
    border-radius: inherit;
    overflow: hidden;
  }

  .cw-header {
    padding: 10px 14px;
    background: var(--surface-overlay, var(--neutral-800, #1c1c1e));
    border-bottom: 0.5px solid var(--neutral-700, #2c2c2e);
    font-size: 13px;
    font-weight: 600;
  }

  .cw-peer-id { color: var(--neutral-400, #636366); font-family: monospace; font-size: 11px; }

  .cw-messages {
    flex: 1;
    overflow-y: auto;
    padding: 10px 8px;
    display: flex;
    flex-direction: column;
    gap: 3px;
    -webkit-overflow-scrolling: touch;
  }

  .cw-empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--neutral-500, #48484a);
    font-size: 13px;
    padding: 24px;
    text-align: center;
  }

  .cw-row { display: flex; }
  .cw-row.mine { justify-content: flex-end; }

  .cw-bubble {
    max-width: 75%;
    padding: 7px 11px;
    border-radius: 16px;
    background: var(--bubble-other-bg, #2c2c2e);
    color: var(--bubble-other-text, #f2f2f7);
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    gap: 6px;
    word-break: break-word;
  }

  .cw-bubble.mine {
    background: var(--bubble-self-bg, #0a84ff);
    color: var(--bubble-self-text, #fff);
    border-bottom-right-radius: 4px;
  }

  .cw-bubble:not(.mine) { border-bottom-left-radius: 4px; }

  .cw-text { font-size: 14px; line-height: 1.4; white-space: pre-wrap; }
  .cw-time { font-size: 9px; opacity: 0.55; white-space: nowrap; align-self: flex-end; flex-shrink: 0; }

  .cw-input-bar {
    padding: 6px 8px;
    background: var(--surface-overlay, var(--neutral-800, #1c1c1e));
    border-top: 0.5px solid var(--neutral-700, #2c2c2e);
  }

  .cw-input-wrap {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    background: var(--neutral-800, #1c1c1e);
    border: 1px solid var(--neutral-700, #2c2c2e);
    border-radius: 20px;
    padding: 5px 5px 5px 12px;
    transition: border-color 0.15s;
  }

  .cw-input-wrap:focus-within { border-color: var(--accent, #0a84ff); }

  .cw-textarea {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    resize: none;
    font-size: 14px;
    line-height: 1.4;
    color: var(--neutral-100, #f2f2f7);
    min-height: 20px;
    max-height: 90px;
    font-family: inherit;
    caret-color: var(--accent, #0a84ff);
  }

  .cw-textarea::placeholder { color: var(--neutral-500, #48484a); }

  .cw-send {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: none;
    background: var(--neutral-700, #2c2c2e);
    color: var(--neutral-500, #48484a);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    cursor: default;
    transition: background 0.15s, color 0.15s;
  }

  .cw-send.active { background: var(--accent, #0a84ff); color: #fff; cursor: pointer; }

  .cw-readonly {
    padding: 10px;
    text-align: center;
    font-size: 12px;
    color: var(--neutral-500, #48484a);
    border-top: 0.5px solid var(--neutral-700, #2c2c2e);
  }
</style>
