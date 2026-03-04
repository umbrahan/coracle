<script lang="ts">
  import {onMount} from "svelte"
  import {derived} from "svelte/store"
  import {signer, shouldUnwrap} from "@welshman/app"
  import {now} from "@welshman/lib"
  import {createScroller, toTitle} from "src/util/misc"
  import Tabs from "src/partials/Tabs.svelte"
  import Link from "src/partials/Link.svelte"
  import Popover from "src/partials/Popover.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Content from "src/partials/Content.svelte"
  import ChannelsListItem from "src/app/views/ChannelsListItem.svelte"
  import {router} from "src/app/util/router"
  import {channels, hasNewMessages, setChecked} from "src/engine"

  const activeTab = window.location.pathname.slice(1) === "channels" ? "conversations" : "requests"
  const setActiveTab = tab => {
    const path = tab === "requests" ? "channels/requests" : "channels"

    router.at(path).push()
  }

  const loadMore = async () => {
    limit += 20
  }

  $: tabChannels = activeTab === "conversations" ? $accepted : $requests
  $: accepted = derived(channels, $ch => $ch.filter(c => c.last_sent > 0))
  $: requests = derived(channels, $ch => $ch.filter(c => c.last_received > 0 && c.last_sent === 0))

  let element
  let limit = 20
  let isLoading = true

  onMount(() => {
    // Simulate loading
    setTimeout(() => {
      isLoading = false
    }, 300)

    if (!$shouldUnwrap) {
      router.at("channels/enable").open({mini: true, noEscape: true})
    }

    const scroller = createScroller(loadMore, {element, delay: 300})

    return () => {
      scroller.stop()
    }
  })

  const markAllChannelsRead = () => setChecked("channels/*", now())

  document.title = "Chats"
</script>

<div class="chats-page">
  <!-- Header -->
  <div class="chats-header">
    <div class="chats-header-top">
      <h1 class="chats-title">Chats</h1>
      <Link modal class="btn btn-icon btn-accent" href="/channels/create" disabled={!$signer}>
        <i class="fa-solid fa-plus" />
      </Link>
    </div>
    <div class="chats-tabs-container">
      <Tabs tabs={["conversations", "requests"]} {activeTab} {setActiveTab}>
        <div slot="tab" let:tab class="flex gap-2">
          <div>{toTitle(tab)}</div>
          <div class="tab-badge">
            {(tab === "conversations" ? $accepted : $requests).length}
          </div>
        </div>
        <Popover triggerType="mouseenter" class="mark-all-popover">
          <div slot="trigger">
            <i
              class="fa fa-bell cursor-pointer"
              class:text-neutral-600={!$hasNewMessages}
              on:click={markAllChannelsRead} />
          </div>
          <div slot="tooltip">Mark all as read</div>
        </Popover>
      </Tabs>
    </div>
  </div>

  <!-- Loading state -->
  {#if isLoading}
    <div class="loading-container">
      <div class="skeleton-item">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-text"></div>
        <div class="skeleton-time"></div>
      </div>
      <div class="skeleton-item">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-text"></div>
        <div class="skeleton-time"></div>
      </div>
      <div class="skeleton-item">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-text"></div>
        <div class="skeleton-time"></div>
      </div>
    </div>
  {:else}
    <!-- Channel list -->
    <FlexColumn bind:element class="chats-list">
      {#each tabChannels.slice(0, limit) as channel (channel.id)}
        <ChannelsListItem {channel} />
      {:else}
        <Content size="lg" class="empty-state">
          <i class="fa fa-comments fa-2x" />
          <p>No messages found.</p>
        </Content>
      {/each}
    </FlexColumn>
  {/if}
</div>

<style>
  .chats-page {
    min-height: 100vh;
    padding-bottom: 80px; /* Space for bottom nav */
    background: var(--neutral-900);
  }

  .chats-header {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--neutral-900);
    border-bottom: 1px solid var(--neutral-800);
    padding: 12px 16px 0;
  }

  .chats-header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .chats-title {
    font-size: 24px;
    font-weight: 700;
    color: var(--neutral-100);
    margin: 0;
  }

  .btn-icon {
    width: 40px;
    height: 40px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }

  .chats-tabs-container {
    position: relative;
  }

  .tab-badge {
    height: 20px;
    min-width: 20px;
    padding: 0 6px;
    border-radius: 10px;
    background: var(--neutral-700);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
  }

  .mark-all-popover {
    position: absolute;
    top: 0;
    right: 0;
  }

  .loading-container {
    padding: 16px;
  }

  .skeleton-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: var(--neutral-800);
    border-radius: 12px;
    margin-bottom: 12px;
  }

  .skeleton-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--neutral-700);
    animation: pulse 1.5s infinite;
    flex-shrink: 0;
  }

  .skeleton-text {
    flex: 1;
    height: 16px;
    border-radius: 4px;
    background: var(--neutral-700);
    animation: pulse 1.5s infinite;
  }

  .skeleton-time {
    width: 40px;
    height: 12px;
    border-radius: 4px;
    background: var(--neutral-700);
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .chats-list {
    padding: 12px 16px;
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
    margin-bottom: 12px;
    opacity: 0.5;
  }

  @media (min-width: 1024px) {
    .chats-page {
      padding-bottom: 24px;
    }
  }
</style>
