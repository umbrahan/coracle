<script lang="ts">
  import {onMount} from "svelte"
  import {flatten, partition} from "@welshman/lib"
  import {profileHasName} from "@welshman/util"
  import {profilesByPubkey} from "@welshman/app"
  import {createScroller} from "src/util/misc"
  import Card from "src/partials/Card.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import PersonSummary from "src/app/shared/PersonSummary.svelte"
  import Input from "src/partials/Input.svelte"

  export let pubkeys = []

  let element
  let limit = 20
  let searchQuery = ""
  let filteredPubkeys = []
  let alphabetIndex = []
  let isLoading = true

  const loadMore = async () => {
    limit += 20
  }

  const hasName = pubkey => profileHasName($profilesByPubkey.get(pubkey))

  // Generate alphabet index
  const generateAlphabetIndex = (keys) => {
    const index = new Set()
    const profiles = $profilesByPubkey

    keys.forEach(pubkey => {
      const profile = profiles.get(pubkey)
      if (profile && profile.name) {
        const firstChar = profile.name.charAt(0).toUpperCase()
        if (/[A-Z]/.test(firstChar)) {
          index.add(firstChar)
        }
      }
    })

    return Array.from(index).sort()
  }

  // Filter pubkeys based on search
  const filterPubkeys = () => {
    if (!searchQuery.trim()) {
      filteredPubkeys = pubkeys
    } else {
      const query = searchQuery.toLowerCase()
      const profiles = $profilesByPubkey

      filteredPubkeys = pubkeys.filter(pubkey => {
        const profile = profiles.get(pubkey)
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

    alphabetIndex = generateAlphabetIndex(filteredPubkeys)
  }

  onMount(() => {
    // Simulate loading
    setTimeout(() => {
      isLoading = false
    }, 300)

    const scroller = createScroller(loadMore, {
      element,
      threshold: 5000,
      delay: 100,
    })

    // Initialize filtered list
    filterPubkeys()

    return () => {
      scroller.stop()
    }
  })

  // Update filtered list when search query changes
  $: if (searchQuery !== undefined) {
    filterPubkeys()
  }

  // Update filtered list when pubkeys change
  $: if (pubkeys.length > 0) {
    filterPubkeys()
  }

  $: [withName, withoutName] = partition(hasName, filteredPubkeys)
  $: sorted = flatten([...withName, ...withoutName])
  $: results = sorted.slice(0, limit)

  document.title = "Contacts"
</script>

<div class="contacts-page">
  <!-- Search header -->
  <div class="contacts-header">
    <h1 class="contacts-title">Contacts</h1>
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

  <!-- Alphabet index (shown when not searching) -->
  {#if !searchQuery && alphabetIndex.length > 0}
    <div class="alphabet-index">
      {#each alphabetIndex as letter}
        <a
          href="#section-{letter}"
          class="alphabet-item">
          {letter}
        </a>
      {/each}
    </div>
  {/if}

  <!-- Loading state -->
  {#if isLoading}
    <div class="loading-container">
      <div class="skeleton-item">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-text-long"></div>
      </div>
      <div class="skeleton-item">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-text-long"></div>
      </div>
      <div class="skeleton-item">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-text-long"></div>
      </div>
    </div>
  {:else}
    <!-- Contacts list -->
    <div class="contacts-container">
      {#if results.length === 0}
        <div class="empty-state">
          <i class="fa fa-address-book fa-2x" />
          <p>No contacts found.</p>
        </div>
      {:else}
        <FlexColumn bind:element>
          {#each results as pubkey, index (pubkey)}
            {@const profile = $profilesByPubkey.get(pubkey)}
            {@const firstChar = profile?.name?.charAt(0).toUpperCase()}

            <!-- Section header for alphabet -->
            {#if !searchQuery && firstChar && /[A-Z]/.test(firstChar) && (index === 0 || sorted[index - 1] !== pubkey)}
              {@const prevProfile = $profilesByPubkey.get(sorted[index - 1])}
              {@const prevChar = prevProfile?.name?.charAt(0).toUpperCase()}

              {#if firstChar !== prevChar}
                <div id="section-{firstChar}" class="section-header">
                  {firstChar}
                </div>
              {/if}
            {/if}

            <Card>
              <PersonSummary {pubkey} />
            </Card>
          {/each}
        </FlexColumn>
      {/if}
    </div>
  {/if}
</div>

<style>
  .contacts-page {
    min-height: 100vh;
    padding-bottom: 80px; /* Space for bottom nav */
    background: var(--neutral-900);
  }

  .contacts-header {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--neutral-900);
    border-bottom: 1px solid var(--neutral-800);
    padding: 12px 16px;
  }

  .contacts-title {
    font-size: 24px;
    font-weight: 700;
    color: var(--neutral-100);
    margin: 0 0 12px 0;
  }

  .search-container {
    position: relative;
  }

  .search-input {
    width: 100%;
  }

  .alphabet-index {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 8px 16px;
    background: var(--neutral-850);
    border-bottom: 1px solid var(--neutral-800);
  }

  .alphabet-item {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 12px;
    font-weight: 600;
    color: var(--neutral-400);
    text-decoration: none;
    transition: all 0.2s;
  }

  .alphabet-item:hover {
    background: var(--neutral-700);
    color: var(--neutral-200);
  }

  .contacts-container {
    padding: 12px 16px;
  }

  .section-header {
    padding: 8px 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 0.5px;
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

  .skeleton-text-long {
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
    .contacts-page {
      padding-bottom: 24px;
    }
  }
</style>
