<script lang="ts">
  import {onMount} from "svelte"
  import {session} from "@welshman/app"
  import {router} from "src/app/util/router"
  import Button from "src/partials/Button.svelte"
  import Link from "src/partials/Link.svelte"
  import Card from "src/partials/Card.svelte"
  import UserSettings from "src/app/views/UserSettings.svelte"

  let activeSection = "main"
  let isLoading = true

  const sections = [
    {
      id: "profile",
      icon: "fa-user",
      label: "Profile",
      description: "Edit your profile information",
      path: "/settings/profile",
    },
    {
      id: "keys",
      icon: "fa-key",
      label: "Keys",
      description: "Manage your cryptographic keys",
      path: "/settings/keys",
    },
    {
      id: "relays",
      icon: "fa-server",
      label: "Relays",
      description: "Configure your relay connections",
      path: "/settings/relays",
    },
    {
      id: "content",
      icon: "fa-shield",
      label: "Content",
      description: "Content moderation settings",
      path: "/settings/content",
    },
    {
      id: "data",
      icon: "fa-database",
      label: "Data",
      description: "Import and export your data",
      path: "/settings/data",
    },
    {
      id: "wallet",
      icon: "fa-wallet",
      label: "Wallet",
      description: "Lightning wallet settings",
      path: "/settings/wallet",
    },
  ]

  const identitySection = {
    id: "identity",
    icon: "fa-exchange-alt",
    label: "Switch Identity",
    description: "Change your active account",
    action: "switch",
  }

  onMount(() => {
    // Simulate loading
    setTimeout(() => {
      isLoading = false
    }, 300)
  })

  document.title = "Settings"

  const handleSwitchIdentity = () => {
    // This will be implemented in Phase 3
    console.log("Switch identity clicked")
  }

  const navigateTo = (path) => {
    router.at(path).push()
  }
</script>

<div class="settings-page">
  <!-- Header -->
  <div class="settings-header">
    <h1 class="settings-title">Settings</h1>
  </div>

  <!-- Loading state -->
  {#if isLoading}
    <div class="loading-container">
      <div class="skeleton-item">
        <div class="skeleton-icon"></div>
        <div class="skeleton-content"></div>
      </div>
      <div class="skeleton-item">
        <div class="skeleton-icon"></div>
        <div class="skeleton-content"></div>
      </div>
      <div class="skeleton-item">
        <div class="skeleton-icon"></div>
        <div class="skeleton-content"></div>
      </div>
    </div>
  {:else}
    <!-- Identity switcher section -->
    <div class="settings-section">
      <div class="section-title">Account</div>
      <Card>
        <button
          class="settings-item identity-item"
          on:click={handleSwitchIdentity}>
          <div class="settings-item-icon">
            <i class="fa {identitySection.icon}" />
          </div>
          <div class="settings-item-content">
            <div class="settings-item-label">{identitySection.label}</div>
            <div class="settings-item-description">{identitySection.description}</div>
          </div>
          <i class="fa fa-chevron-right settings-item-arrow" />
        </button>
      </Card>
    </div>

    <!-- Main settings sections -->
    <div class="settings-section">
      <div class="section-title">Preferences</div>
      <div class="settings-grid">
        {#each sections as section}
          <Card class="settings-card" on:click={() => navigateTo(section.path)}>
            <div class="settings-card-icon">
              <i class="fa {section.icon}" />
            </div>
            <div class="settings-card-content">
              <div class="settings-card-label">{section.label}</div>
              <div class="settings-card-description">{section.description}</div>
            </div>
            <i class="fa fa-chevron-right settings-card-arrow" />
          </Card>
        {/each}
      </div>
    </div>

    <!-- Quick settings -->
    <div class="settings-section">
      <div class="section-title">Quick Settings</div>
      <Card class="quick-settings-card">
        <UserSettings />
      </Card>
    </div>

    <!-- App info -->
    <div class="settings-section">
      <div class="section-title">About</div>
      <Card>
        <div class="app-info">
          <div class="app-info-item">
            <span class="app-info-label">Version</span>
            <span class="app-info-value">1.0.0</span>
          </div>
          <Link external href="https://github.com/coracle-social/coracle" class="app-info-link">
            View on GitHub
          </Link>
        </div>
      </Card>
    </div>
  {/if}
</div>

<style>
  .settings-page {
    min-height: 100vh;
    padding-bottom: 80px; /* Space for bottom nav */
    background: var(--neutral-900);
  }

  .settings-header {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--neutral-900);
    border-bottom: 1px solid var(--neutral-800);
    padding: 12px 16px;
  }

  .settings-title {
    font-size: 24px;
    font-weight: 700;
    color: var(--neutral-100);
    margin: 0;
  }

  .settings-section {
    padding: 16px;
  }

  .section-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--neutral-600);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
    padding-left: 4px;
  }

  .loading-container {
    padding: 16px;
  }

  .skeleton-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: var(--neutral-800);
    border-radius: 12px;
    margin-bottom: 12px;
  }

  .skeleton-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: var(--neutral-700);
    animation: pulse 1.5s infinite;
    flex-shrink: 0;
  }

  .skeleton-content {
    flex: 1;
    height: 16px;
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

  .settings-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 16px;
    background: none;
    border: none;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .settings-item:hover {
    background: var(--neutral-750);
  }

  .settings-item-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: var(--accent);
    color: var(--white);
    font-size: 16px;
    flex-shrink: 0;
  }

  .identity-item .settings-item-icon {
    background: var(--neutral-700);
  }

  .settings-item-content {
    flex: 1;
    text-align: left;
  }

  .settings-item-label {
    font-size: 16px;
    font-weight: 600;
    color: var(--neutral-100);
    margin-bottom: 2px;
  }

  .settings-item-description {
    font-size: 13px;
    color: var(--neutral-600);
  }

  .settings-item-arrow {
    color: var(--neutral-600);
    font-size: 12px;
  }

  .settings-grid {
    display: grid;
    gap: 12px;
  }

  .settings-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .settings-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .settings-card-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: var(--neutral-700);
    color: var(--neutral-300);
    font-size: 16px;
    flex-shrink: 0;
  }

  .settings-card-content {
    flex: 1;
  }

  .settings-card-label {
    font-size: 15px;
    font-weight: 600;
    color: var(--neutral-100);
    margin-bottom: 2px;
  }

  .settings-card-description {
    font-size: 12px;
    color: var(--neutral-600);
  }

  .settings-card-arrow {
    color: var(--neutral-600);
    font-size: 12px;
  }

  .quick-settings-card {
    padding: 16px;
  }

  .app-info {
    padding: 16px;
  }

  .app-info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
  }

  .app-info-label {
    font-size: 14px;
    color: var(--neutral-600);
  }

  .app-info-value {
    font-size: 14px;
    font-weight: 600;
    color: var(--neutral-300);
  }

  .app-info-link {
    display: block;
    text-align: center;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--neutral-800);
  }

  @media (min-width: 1024px) {
    .settings-page {
      padding-bottom: 24px;
    }

    .settings-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
