<script lang="ts">
  import {onMount, onDestroy, tick} from "svelte"
  import {pubkey, repository} from "@welshman/app"
  import {Router, addMaximalFallbacks} from "@welshman/router"
  import {router} from "src/app/util/router"
  import {now, sortBy} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {getIdFilters} from "@welshman/util"
  import {deriveEvents} from "@welshman/store"
  import {myRequest} from "src/engine"
  import {noteKinds} from "src/util/nostr"
  import {getSetting} from "src/engine"
  import {isEventMuted} from "src/engine"
  import Spinner from "src/partials/Spinner.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import FeedItem from "src/app/shared/FeedItem.svelte"
  import {EventBuffer} from "src/engine/utils/event-buffer"
  import {fly} from "src/util/transition"
  import Button from "src/partials/Button.svelte"

  document.title = "Posts"

  // 创建 EventBuffer 实例
  let eventBuffer = new EventBuffer()
  let unsubscribe: (() => void) | null = null

  // 下拉刷新状态
  let isRefreshing = false
  let isRefreshingTop = false
  let startY = 0
  let currentY = 0
  let pullDistance = 0
  let container: HTMLElement
  let pullIndicator: HTMLElement

  // 滚动加载状态
  let isLoadingMore = false
  let hasMore = true
  let oldestTimestamp = now()
  const LOAD_MORE_THRESHOLD = 300 // 距离底部多少像素时开始加载
  const PAGE_SIZE = 20

  // 订阅控制器
  let abortController = new AbortController()

  // 当前事件列表
  let events: TrustedEvent[] = []
  let isFirstLoad = true

  // 获取用户的关注列表或默认用户
  let authors: string[] = []

  // 导出给子组件使用的上下文获取函数
  const getContext = (event: TrustedEvent) => repository.query(getIdFilters([event.id]))

  // 获取中继器列表
  const getRelays = () => {
    const routerInstance = Router.get()
    return routerInstance.ForUser().policy(addMaximalFallbacks).getUrls()
  }

  // 显示登录
  const showLogin = () => router.at("login").open()

  // 初始化关注列表
  const initializeAuthors = () => {
    if ($pubkey) {
      // 从 repository 获取用户的关注列表
      const follows = repository.query([{kinds: [3], authors: [$pubkey]}])
      if (follows.length > 0) {
        const followEvent = follows[0]
        authors = followEvent.tags
          .filter(tag => tag[0] === "p")
          .map(tag => tag[1] as string)
          .slice(0, 1000) // 限制数量
      }
    }

    // 如果没有关注列表，使用默认列表
    if (authors.length === 0) {
      authors = getSetting("default_follows") || []
    }
  }

  // 加载初始数据
  const loadInitial = async () => {
    isFirstLoad = true
    eventBuffer.reset()
    hasMore = true
    oldestTimestamp = now()

    initializeAuthors()

    // 创建订阅
    abortController = new AbortController()

    const filters = [
      {
        kinds: noteKinds,
        authors: authors.length > 0 ? authors : undefined,
        limit: PAGE_SIZE,
      },
    ]

    // 使用流式订阅
    myRequest({
      signal: abortController.signal,
      relays: getRelays(),
      filters,
      onEvent: (event: TrustedEvent) => {
        eventBuffer.add([event])
      },
      onClose: () => {
        eventBuffer.setLoading(false)
        isFirstLoad = false
      },
    })

    // 同时加载历史数据
    await loadMore()
    isFirstLoad = false
  }

  // 加载更多数据
  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return

    isLoadingMore = true
    eventBuffer.setLoading(true)

    try {
      const filters = [
        {
          kinds: noteKinds,
          authors: authors.length > 0 ? authors : undefined,
          until: oldestTimestamp,
          limit: PAGE_SIZE,
        },
      ]

      const receivedEvents: TrustedEvent[] = []

      await myRequest({
        signal: abortController.signal,
        relays: getRelays(),
        filters,
        onEvent: (event: TrustedEvent) => {
          receivedEvents.push(event)
        },
      })

      if (receivedEvents.length > 0) {
        // 更新最旧时间戳
        const sorted = sortBy((e: TrustedEvent) => e.created_at, receivedEvents)
        oldestTimestamp = sorted[0].created_at - 1

        // 添加到缓冲区
        eventBuffer.add(receivedEvents)

        // 如果收到的数据少于请求数量，说明没有更多数据了
        if (receivedEvents.length < PAGE_SIZE) {
          hasMore = false
          eventBuffer.setHasMore(false)
        }
      } else {
        hasMore = false
        eventBuffer.setHasMore(false)
      }
    } catch (error) {
      console.error("Error loading more posts:", error)
    } finally {
      isLoadingMore = false
      eventBuffer.setLoading(false)
    }
  }

  // 下拉刷新
  const refresh = async () => {
    if (isRefreshing) return

    isRefreshing = true
    pullDistance = 0

    try {
      const filters = [
        {
          kinds: noteKinds,
          authors: authors.length > 0 ? authors : undefined,
          since: now() - 3600, // 最近一小时
          limit: 50,
        },
      ]

      await myRequest({
        signal: abortController.signal,
        relays: getRelays(),
        filters,
        onEvent: (event: TrustedEvent) => {
          eventBuffer.add([event])
        },
      })
    } catch (error) {
      console.error("Error refreshing posts:", error)
    } finally {
      isRefreshing = false
    }
  }

  // 触摸事件处理 - 下拉刷新
  const handleTouchStart = (e: TouchEvent) => {
    if (container.scrollTop === 0) {
      startY = e.touches[0].clientY
      isRefreshingTop = true
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isRefreshingTop || isRefreshing) return

    currentY = e.touches[0].clientY
    const diff = currentY - startY

    if (diff > 0) {
      pullDistance = Math.min(diff * 0.5, 120) // 最大下拉距离
    }
  }

  const handleTouchEnd = async () => {
    if (!isRefreshingTop) return

    isRefreshingTop = false

    // 如果下拉超过阈值，触发刷新
    if (pullDistance > 60) {
      await refresh()
    }

    pullDistance = 0
  }

  // 滚动事件处理 - 加载更多
  const handleScroll = async () => {
    if (!container) return

    const scrollHeight = container.scrollHeight
    const scrollTop = container.scrollTop
    const clientHeight = container.clientHeight

    // 当滚动到底部附近时，加载更多
    if (scrollHeight - scrollTop - clientHeight < LOAD_MORE_THRESHOLD) {
      await loadMore()
    }
  }

  // 订阅 EventBuffer
  $: if (unsubscribe) unsubscribe()

  $: unsubscribe = eventBuffer.subscribe($state => {
    events = $state.events
    hasMore = $state.hasMore
  })

  // 组件挂载
  onMount(async () => {
    if ($pubkey) {
      await loadInitial()

      // 添加滚动监听
      if (container) {
        container.addEventListener("scroll", handleScroll)
        container.addEventListener("touchstart", handleTouchStart)
        container.addEventListener("touchmove", handleTouchMove)
        container.addEventListener("touchend", handleTouchEnd)
      }
    }
  })

  // 组件销毁
  onDestroy(() => {
    if (unsubscribe) unsubscribe()
    abortController.abort()

    if (container) {
      container.removeEventListener("scroll", handleScroll)
      container.removeEventListener("touchstart", handleTouchStart)
      container.removeEventListener("touchmove", handleTouchMove)
      container.removeEventListener("touchend", handleTouchEnd)
    }
  })
</script>

<div class="posts-page">
  <!-- 下拉刷新指示器 -->
  {#if pullDistance > 0}
    <div
      class="pull-indicator"
      style="height: {pullDistance}px; opacity: {pullDistance / 120}"
      bind:this={pullIndicator}>
      <div class="pull-indicator-content">
        {#if pullDistance > 60}
          <i class="fa fa-refresh fa-spin" />
        {:else}
          <i class="fa fa-arrow-down" />
        {/if}
        <span class="pull-text">
          {pullDistance > 60 ? "释放刷新" : "下拉刷新"}
        </span>
      </div>
    </div>
  {/if}

  <!-- 内容区域 -->
  <div
    class="posts-container"
    bind:this={container}
    class:loading={isFirstLoad}>
    {#if !$pubkey}
      <!-- 未登录状态 -->
      <div class="empty-state">
        <i class="fa fa-newspaper fa-3x" />
        <h3>欢迎来到 Posts</h3>
        <p>连接到 nostr 网络查看动态</p>
        <Button class="btn btn-accent" on:click={showLogin}>
          登录
        </Button>
      </div>
    {:else if isFirstLoad}
      <!-- 首次加载骨架屏 -->
      <div class="skeleton-container">
        {#each Array(5) as _}
          <div class="skeleton-item">
            <div class="skeleton-header">
              <div class="skeleton-avatar"></div>
              <div class="skeleton-meta">
                <div class="skeleton-name"></div>
                <div class="skeleton-time"></div>
              </div>
            </div>
            <div class="skeleton-content">
              <div class="skeleton-line"></div>
              <div class="skeleton-line"></div>
              <div class="skeleton-line short"></div>
            </div>
          </div>
        {/each}
      </div>
    {:else if events.length === 0}
      <!-- 空状态 -->
      <div class="empty-state">
        <i class="fa fa-newspaper fa-3x" />
        <p class="empty-title">暂无内容</p>
        <p class="empty-desc">关注一些用户来获取最新动态</p>
      </div>
    {:else}
      <!-- 事件列表 -->
      <FlexColumn>
        {#each events as event, index (event.id)}
          {#if !$isEventMuted(event)}
            <div in:fly={{y: 20, delay: index * 50}}>
              <FeedItem
                showMeta={false}
                topLevel={true}
                {getContext}
                depth={2}
                note={event} />
            </div>
          {/if}
        {/each}
      </FlexColumn>

      <!-- 加载更多指示器 -->
      {#if isLoadingMore}
        <div class="loading-more">
          <Spinner />
          <span>加载更多...</span>
        </div>
      {:else if !hasMore}
        <div class="no-more">
          <p>没有更多内容了</p>
        </div>
      {/if}
    {/if}
  </div>

  <!-- 刷新指示器 -->
  {#if isRefreshing}
    <div class="refreshing-indicator">
      <Spinner />
      <span>刷新中...</span>
    </div>
  {/if}
</div>

<style>
  .posts-page {
    position: relative;
    width: 100%;
    min-height: 100vh;
    padding-bottom: 60px; /* 为底部导航留出空间 */
  }

  .pull-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--neutral-900);
    transition: height 0.2s ease;
  }

  .pull-indicator-content {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--tinted-200);
    font-size: 14px;
  }

  .pull-text {
    margin-left: 4px;
  }

  .posts-container {
    width: 100%;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .posts-container.loading {
    height: 100vh;
    overflow: hidden;
  }

  /* 骨架屏样式 */
  .skeleton-container {
    padding: 16px;
  }

  .skeleton-item {
    background: var(--neutral-800);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 16px;
  }

  .skeleton-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  .skeleton-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(
      90deg,
      var(--neutral-700) 25%,
      var(--neutral-600) 50%,
      var(--neutral-700) 75%
    );
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
  }

  .skeleton-meta {
    flex: 1;
  }

  .skeleton-name {
    height: 16px;
    width: 120px;
    background: var(--neutral-700);
    border-radius: 4px;
    margin-bottom: 6px;
  }

  .skeleton-time {
    height: 12px;
    width: 80px;
    background: var(--neutral-700);
    border-radius: 4px;
  }

  .skeleton-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .skeleton-line {
    height: 14px;
    background: var(--neutral-700);
    border-radius: 4px;
    animation: skeleton-loading 1.5s infinite;
  }

  .skeleton-line.short {
    width: 60%;
  }

  @keyframes skeleton-loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  /* 空状态样式 */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: var(--tinted-300);
    text-align: center;
  }

  .empty-state i {
    margin-bottom: 16px;
    opacity: 0.5;
  }

  .empty-state h3 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--tinted-200);
  }

  .empty-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .empty-desc {
    font-size: 14px;
    color: var(--tinted-400);
    margin-bottom: 16px;
  }

  /* 加载更多样式 */
  .loading-more {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 24px;
    color: var(--tinted-300);
    font-size: 14px;
  }

  .no-more {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    color: var(--tinted-500);
    font-size: 14px;
  }

  /* 刷新指示器 */
  .refreshing-indicator {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 16px;
    background: var(--neutral-900);
    border-bottom: 1px solid var(--neutral-800);
    z-index: 100;
    color: var(--tinted-200);
    font-size: 14px;
  }

  /* 桌面端适配 */
  @media (min-width: 1024px) {
    .posts-page {
      padding-bottom: 0;
    }
  }
</style>
