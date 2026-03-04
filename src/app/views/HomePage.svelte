<script lang="ts">
  /**
   * HomePage — Telegram 风格对话列表
   *
   * 左侧固定底部导航（移动端）/ 左侧边栏（桌面端）
   * 主体：搜索栏 + 对话列表，每行显示头像、名字、最后一条消息预览和时间
   */
  import {pubkey, userFollowList, profilesByPubkey, repository} from "@welshman/app"
  import {DIRECT_MESSAGE} from "@welshman/util"
  import {router} from "src/app/util/router"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import {THEME_LABELS, type ThemeName} from "src/partials/themes"
  import {theme, setTheme} from "src/partials/state"

  let searchQuery = ""
  let showThemePicker = false

  // ── Unread count helpers ───────────────────────────────────────────────────
  // 每个 peer 的「最后已读时间戳」存在 localStorage 中
  // key: `chat_last_seen_${myPubkey}_${peerPubkey}`  value: unix seconds string
  function getLastSeen(myPubkey: string, peerPubkey: string): number {
    const v = localStorage.getItem(`chat_last_seen_${myPubkey}_${peerPubkey}`)
    return v ? parseInt(v, 10) : 0
  }

  // ── Conversation list ─────────────────────────────────────────────────────
  // 查询所有 DM 并聚合为「每个联系人的最新消息」
  $: followsArray = ($userFollowList?.publicTags || []).map(t => t[1])
  $: conversations = buildConversations(followsArray, $pubkey)

  $: filtered = searchQuery.trim()
    ? conversations.filter(c => {
        const q = searchQuery.toLowerCase()
        const p = $profilesByPubkey.get(c.pubkey)
        return (
          (p?.name ?? "").toLowerCase().includes(q) ||
          (p?.display_name ?? "").toLowerCase().includes(q) ||
          c.pubkey.slice(0, 8).includes(q)
        )
      })
    : conversations

  function buildConversations(followList: string[], myPubkey: string | undefined) {
    if (!myPubkey) return []

    // 从 repository 查询双方的 DM
    const events = repository.query([{kinds: [DIRECT_MESSAGE]}])

    // 聚合为 Map<peerPubkey, {ts, preview, unread}>
    const map = new Map<string, {ts: number; preview: string; unread: number}>()

    for (const ev of events) {
      const recipients = ev.tags.filter(t => t[0] === "p").map(t => t[1])
      let peer: string | null = null
      const isIncoming = ev.pubkey !== myPubkey

      if (ev.pubkey === myPubkey) {
        peer = recipients[0] ?? null
      } else if (recipients.includes(myPubkey)) {
        peer = ev.pubkey
      }

      if (!peer) continue

      const existing = map.get(peer)
      const lastSeen = getLastSeen(myPubkey, peer)
      // 仅统计别人发来的、且比「最后已读」更新的消息
      const isUnread = isIncoming && ev.created_at > lastSeen

      if (!existing) {
        map.set(peer, {ts: ev.created_at, preview: ev.content, unread: isUnread ? 1 : 0})
      } else {
        map.set(peer, {
          ts: Math.max(existing.ts, ev.created_at),
          preview: ev.created_at >= existing.ts ? ev.content : existing.preview,
          unread: existing.unread + (isUnread ? 1 : 0),
        })
      }
    }

    // 合并 follows（即使没有消息记录也显示）
    for (const f of followList) {
      if (!map.has(f)) map.set(f, {ts: 0, preview: "", unread: 0})
    }

    // 按时间倒序排列
    return Array.from(map.entries())
      .map(([pubkey, {ts, preview, unread}]) => ({pubkey, ts, preview, unread}))
      .sort((a, b) => b.ts - a.ts)
  }

  // 打开聊天时更新 lastSeen（标记已读）
  function markAllRead(myPubkey: string, peerPubkey: string) {
    const now = Math.floor(Date.now() / 1000)
    localStorage.setItem(`chat_last_seen_${myPubkey}_${peerPubkey}`, String(now))
  }

  function formatTs(ts: number): string {
    if (!ts) return ""
    const d = new Date(ts * 1000)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
    if (diffDays === 0) return d.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})
    if (diffDays === 1) return "昨天"
    if (diffDays < 7) return d.toLocaleDateString([], {weekday: "short"})
    return d.toLocaleDateString([], {month: "numeric", day: "numeric"})
  }

  const openChat = (pk: string) => {
    if ($pubkey) markAllRead($pubkey, pk)
    router.at(`/chat/${pk}`).push()
  }

  // 总未读数（用于底部导航 badge）
  $: totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0)

  const themeNames = Object.keys(THEME_LABELS) as ThemeName[]
</script>

<div class="home-root">
  <!-- ── Header ─────────────────────────────────────────────── -->
  <header class="home-header">
    <div class="header-row">
      <!-- Left: identity / avatar -->
      <button class="avatar-btn"
        on:click={() => router.at("/identity").push()}
        title="身份管理">
        {#if $pubkey}
          <PersonCircle pubkey={$pubkey} class="h-9 w-9 rounded-full" />
        {:else}
          <div class="avatar-placeholder">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
          </div>
        {/if}
      </button>

      <h1 class="app-title">消息</h1>

      <div class="header-actions">
        <!-- Theme picker -->
        <div class="theme-wrap">
          <button class="icon-btn" on:click={() => showThemePicker = !showThemePicker}
            title="切换主题">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
            </svg>
          </button>

          {#if showThemePicker}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div class="backdrop" on:click={() => showThemePicker = false}></div>
            <div class="theme-menu">
              {#each themeNames as name}
                <button class="theme-item" class:active={$theme === name}
                  on:click={() => { setTheme(name); showThemePicker = false }}>
                  <span class="theme-dot" style="background: {name.includes('light') ? '#fff' : '#1c1c1e'}; border: 2px solid {name.includes('ios') ? '#007aff' : name.includes('tg') ? '#2aabee' : '#FC560E'}"></span>
                  {THEME_LABELS[name]}
                  {#if $theme === name}
                    <svg class="check" width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" stroke-width="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  {/if}
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <!-- New chat -->
        <button class="icon-btn"
          on:click={() => router.at("/contacts").push()}
          title="联系人">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Search -->
    <div class="search-bar">
      <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        class="search-input"
        bind:value={searchQuery}
        placeholder="搜索"
        type="search"
      />
      {#if searchQuery}
        <button class="search-clear" on:click={() => searchQuery = ""}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      {/if}
    </div>
  </header>

  <!-- ── Conversation List ─────────────────────────────────────── -->
  <div class="conv-list">
    {#if !$pubkey}
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <p class="empty-title">请先登录</p>
        <button class="empty-btn" on:click={() => router.at("/login").push()}>
          登录 / 创建身份
        </button>
      </div>
    {:else if filtered.length === 0}
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <p class="empty-title">
          {searchQuery ? "没有匹配的联系人" : "还没有联系人"}
        </p>
        {#if !searchQuery}
          <button class="empty-btn" on:click={() => router.at("/contacts").push()}>
            添加联系人
          </button>
        {/if}
      </div>
    {:else}
      {#each filtered as conv (conv.pubkey)}
        {@const profile = $profilesByPubkey.get(conv.pubkey)}
        {@const name = profile?.display_name || profile?.name || conv.pubkey.slice(0, 8) + "…"}
        <div class="conv-row" role="button" tabindex="0"
          on:click={() => openChat(conv.pubkey)}
          on:keydown={e => e.key === "Enter" && openChat(conv.pubkey)}>
          <PersonCircle pubkey={conv.pubkey} class="conv-avatar h-13 w-13 rounded-full" />
          <div class="conv-body">
            <div class="conv-top">
              <span class="conv-name">{name}</span>
              <div class="conv-top-right">
                {#if conv.ts}
                  <span class="conv-time" class:unread-time={conv.unread > 0}>{formatTs(conv.ts)}</span>
                {/if}
              </div>
            </div>
            <div class="conv-bottom-row">
              {#if conv.preview}
                <div class="conv-preview">
                  <span class="preview-text">{conv.preview.slice(0, 60)}{conv.preview.length > 60 ? "…" : ""}</span>
                </div>
              {:else}
                <div class="conv-preview">
                  <span class="preview-muted">点击开始聊天</span>
                </div>
              {/if}
              {#if conv.unread > 0}
                <span class="unread-badge">{conv.unread > 99 ? "99+" : conv.unread}</span>
              {/if}
            </div>
          </div>
          <svg class="conv-chevron" width="8" height="14" viewBox="0 0 8 14" fill="none">
            <path d="M1 1l6 6-6 6" stroke="currentColor" stroke-width="1.8"
              stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      {/each}
    {/if}
  </div>

  <!-- ── Bottom Nav ─────────────────────────────────────────────── -->
  <nav class="bottom-nav">
    <button class="nav-tab active" on:click={() => router.at("/").push()}>
      <div class="nav-icon-wrap">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        {#if totalUnread > 0}
          <span class="nav-badge">{totalUnread > 99 ? "99+" : totalUnread}</span>
        {/if}
      </div>
      <span>消息</span>
    </button>
    <button class="nav-tab" on:click={() => router.at("/contacts").push()}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
      <span>联系人</span>
    </button>
    <button class="nav-tab" on:click={() => router.at("/identity").push()}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
      <span>身份</span>
    </button>
    <button class="nav-tab" on:click={() => router.at("/settings").push()}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
      <span>设置</span>
    </button>
  </nav>
</div>

<style>
  /* ── Root ─────────────────────────────────────────────── */
  .home-root {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--neutral-900);
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif;
  }

  /* ── Header ─────────────────────────────────────────── */
  .home-header {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--surface-overlay, var(--neutral-800));
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 0.5px solid var(--neutral-700);
    padding: 0 16px 10px;
    padding-top: env(safe-area-inset-top, 0px);
  }

  .header-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 0 8px;
  }

  .avatar-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .avatar-placeholder {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--neutral-700);
    color: var(--neutral-400);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .app-title {
    flex: 1;
    font-size: 22px;
    font-weight: 700;
    color: var(--neutral-100);
    margin: 0;
    letter-spacing: -0.3px;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .icon-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--neutral-800);
    border: none;
    color: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  /* Theme picker */
  .theme-wrap { position: relative; }

  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 20;
  }

  .theme-menu {
    position: absolute;
    right: 0;
    top: calc(100% + 8px);
    z-index: 30;
    background: var(--surface, var(--neutral-800));
    border: 0.5px solid var(--neutral-700);
    border-radius: 14px;
    padding: 6px;
    min-width: 160px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.2);
  }

  .theme-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 9px 10px;
    background: none;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    color: var(--neutral-200);
    font-size: 14px;
    text-align: left;
  }

  .theme-item.active { background: var(--neutral-700); }
  .theme-item:hover { background: var(--neutral-700); }

  .theme-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .check {
    margin-left: auto;
    color: var(--accent);
  }

  /* Search */
  .search-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--neutral-800);
    border-radius: 12px;
    padding: 7px 12px;
  }

  .search-icon { color: var(--neutral-500); flex-shrink: 0; }

  .search-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    font-size: 15px;
    color: var(--neutral-100);
    caret-color: var(--accent);
  }

  .search-input::placeholder { color: var(--neutral-500); }
  .search-input::-webkit-search-cancel-button { display: none; }

  .search-clear {
    background: none;
    border: none;
    color: var(--neutral-500);
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 0;
  }

  /* ── Conv list ─────────────────────────────────────────── */
  .conv-list {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .conv-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    cursor: pointer;
    transition: background 0.1s;
    border-bottom: 0.5px solid var(--neutral-800);
  }

  .conv-row:hover { background: var(--neutral-800); }
  .conv-row:active { background: var(--neutral-700); }

  :global(.conv-avatar) {
    width: 52px !important;
    height: 52px !important;
    flex-shrink: 0;
  }

  .conv-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .conv-top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }

  .conv-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--neutral-100);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .conv-time {
    font-size: 12px;
    color: var(--neutral-500);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .conv-preview { overflow: hidden; }

  .preview-text, .preview-muted {
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
  }

  .preview-text { color: var(--neutral-400); }
  .preview-muted { color: var(--neutral-600); }

  .conv-chevron { color: var(--neutral-600); flex-shrink: 0; }

  /* ── Unread badge ─────────────────────────────────────────── */
  .conv-bottom-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .conv-bottom-row .conv-preview {
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  .unread-badge {
    flex-shrink: 0;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 10px;
    background: var(--accent);
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  .conv-top-right {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .unread-time {
    color: var(--accent);
    font-weight: 600;
  }

  /* Bottom nav badge */
  .nav-icon-wrap {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nav-badge {
    position: absolute;
    top: -6px;
    right: -8px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: 8px;
    background: var(--accent);
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    border: 1.5px solid var(--surface-overlay, var(--neutral-800));
  }

  /* ── Empty state ─────────────────────────────────────────── */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
    gap: 12px;
    padding: 24px;
    text-align: center;
  }

  .empty-icon { color: var(--neutral-600); }
  .empty-title { font-size: 17px; color: var(--neutral-400); margin: 0; }

  .empty-btn {
    padding: 10px 24px;
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 22px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 4px;
  }

  /* ── Bottom Nav ─────────────────────────────────────────── */
  .bottom-nav {
    display: flex;
    border-top: 0.5px solid var(--neutral-700);
    background: var(--surface-overlay, var(--neutral-800));
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  .nav-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 10px 0 8px;
    background: none;
    border: none;
    color: var(--neutral-500);
    cursor: pointer;
    font-size: 11px;
    transition: color 0.15s;
  }

  .nav-tab.active { color: var(--accent); }
  .nav-tab:hover { color: var(--neutral-300); }
</style>
