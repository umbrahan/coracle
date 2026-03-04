<script lang="ts">
  import {router} from "src/app/util/router"
  import {page} from "src/app/util/router"
  import {derived} from "svelte/store"

  export let badges = {
    posts: 0,
    chats: 0,
    contacts: 0,
    settings: 0,
  }

  interface NavItem {
    label: string
    icon: string
    path: string
  }

  const navItems: NavItem[] = [
    {label: "Posts", icon: "fa-newspaper", path: "/"},
    {label: "Chats", icon: "fa-comments", path: "/channels"},
    {label: "Contacts", icon: "fa-address-book", path: "/people/list"},
    {label: "Settings", icon: "fa-gear", path: "/settings"},
  ]

  // Get current path from router page
  const currentPath = derived(page, $page => {
    if (!$page) return "/"
    // Extract the base path without query parameters
    return $page.path.split("?")[0].split("/")[1] || ""
  })

  const getBasePath = (path: string) => {
    return "/" + path.split("/")[1]
  }

  const isActive = (item: NavItem) => {
    const baseItemPath = getBasePath(item.path)
    const baseCurrentPath = "/" + $currentPath
    return baseItemPath === baseCurrentPath
  }

  const navigate = (path: string) => {
    router.at(path).push()
  }
</script>

<div class="bottom-nav">
  <nav class="bottom-nav-container">
    {#each navItems as item (item.path)}
      <button
        class="nav-item {isActive(item) ? 'nav-item-active' : ''}"
        on:click={() => navigate(item.path)}
        aria-label={item.label}
        aria-current={isActive(item) ? 'page' : undefined}>
        <div class="nav-item-icon">
          <i class="fa {item.icon}" />
          {#if badges[item.label.toLowerCase()] > 0}
            <span class="nav-item-badge">
              {badges[item.label.toLowerCase()] > 99 ? '99+' : badges[item.label.toLowerCase()]}
            </span>
          {/if}
        </div>
        <span class="nav-item-label">{item.label}</span>
      </button>
    {/each}
  </nav>
</div>

<style>
  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    background-color: var(--neutral-900);
    border-top: 1px solid var(--neutral-800);
    padding-bottom: env(safe-area-inset-bottom, 0);
  }

  .bottom-nav-container {
    display: flex;
    justify-content: space-around;
    align-items: center;
    height: 60px;
    max-width: 100%;
  }

  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    height: 100%;
    background: none;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    color: var(--neutral-600);
    position: relative;
    padding: 4px 8px;
  }

  .nav-item:hover {
    color: var(--neutral-500);
  }

  .nav-item-active {
    color: var(--accent);
  }

  .nav-item-icon {
    position: relative;
    font-size: 20px;
    margin-bottom: 2px;
  }

  .nav-item-label {
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
  }

  .nav-item-badge {
    position: absolute;
    top: -6px;
    right: -8px;
    background-color: var(--danger);
    color: var(--white);
    font-size: 10px;
    font-weight: 600;
    padding: 2px 5px;
    border-radius: 10px;
    min-width: 16px;
    text-align: center;
    line-height: 1;
  }

  /* Desktop: hide bottom navigation */
  @media (min-width: 1024px) {
    .bottom-nav {
      display: none;
    }
  }
</style>
