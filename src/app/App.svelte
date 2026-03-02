<script lang="ts">
  import "@fortawesome/fontawesome-free/css/fontawesome.css"
  import "@fortawesome/fontawesome-free/css/solid.css"

  import * as nip19 from "nostr-tools/nip19"
  import {get} from "svelte/store"
  import {sleep, memoize} from "@welshman/lib"
  import * as lib from "@welshman/lib"
  import * as util from "@welshman/util"
  import * as signer from "@welshman/signer"
  import * as net from "@welshman/net"
  import * as app from "@welshman/app"
  import logger from "src/util/logger"
  import * as misc from "src/util/misc"
  import * as nostr from "src/util/nostr"
  import {ready} from "src/engine"
  import {loadUserData} from "src/app/state"
  import {themeVariables, appName} from "src/partials/state"
  import Toast from "src/partials/Toast.svelte"
  import Menu from "src/app/Menu.svelte"
  import Routes from "src/app/Routes.svelte"
  import Nav from "src/app/Nav.svelte"
  import ForegroundButtons from "src/app/ForegroundButtons.svelte"
  import HomePage from "src/app/views/HomePage.svelte"
  import ChatPage from "src/app/views/ChatPage.svelte"
  import ContactsPage from "src/app/views/ContactsPage.svelte"
  import IdentityPage from "src/app/views/IdentityPage.svelte"
  import SettingsPage from "src/app/views/SettingsPage.svelte"
  import LoginPage from "src/app/views/LoginPage.svelte"
  import QRCode from "src/app/views/QRCode.svelte"
  import {onMount} from "svelte"
  import {logUsage} from "src/app/state"
  import {
    router,
    asPerson,
    asUrlComponent,
  } from "src/app/util/router"

  const {session, pubkey} = app

  // Routes - Core chat app only
  router.register("/", HomePage)
  router.register("/chat/:targetPubkey", ChatPage, {
    requireSigner: true,
    serializers: {
      targetPubkey: asPerson,
    },
  })
  router.register("/contacts", ContactsPage)
  router.register("/identity", IdentityPage)
  router.register("/settings", SettingsPage, {
    requireSigner: true,
  })
  router.register("/login", LoginPage)
  router.register("/qrcode/:code", QRCode, {
    serializers: {
      code: asUrlComponent("code"),
    },
  })

  router.init()

  // Globals
  Object.assign(window, {
    get,
    nip19,
    logger,
    router,
    ...signer,
    ...lib,
    ...util,
    ...net,
    ...app,
    ...nostr,
    ...misc,
  })

  // Theme

  const style = document.createElement("style")

  document.head.append(style)

  $: style.textContent = `:root { ${$themeVariables}; background: var(--neutral-800); }`

  // Scroll position

  let scrollY: number

  const unsubHistory = router.history.subscribe($history => {
    if ($history[0].modal) {
      // This is not idempotent, so don't duplicate it
      if (document.body.style.position !== "fixed") {
        scrollY = window.scrollY

        document.body.style.top = `-${scrollY}px`
        document.body.style.position = `fixed`
      }
    } else if (document.body.style.position === "fixed") {
      document.body.setAttribute("style", "")

      if (scrollY !== undefined) {
        requestAnimationFrame(() => {
          window.scrollTo(0, scrollY)
          scrollY = undefined
        })
      }
    }
  })

  // Usage logging, router listener

  onMount(() => {
    const unsubPage = router.page.subscribe(
      memoize($page => {
        if ($page) {
          logUsage($page.path)
        }

        window.scrollTo(0, 0)
      }),
    )

    const unsubModal = router.modal.subscribe($modal => {
      if ($modal) {
        logUsage($modal.path)
      }
    })

    const unsubRouter = router.listen()

    return () => {
      unsubPage()
      unsubModal()
      unsubRouter()
      unsubHistory()
    }
  })

  // Protocol handler

  try {
    const handler = navigator.registerProtocolHandler as (
      scheme: string,
      handler: string,
      name: string,
    ) => void

    handler?.("web+nostr", `${location.origin}/%s`, appName)
    handler?.("nostr", `${location.origin}/%s`, appName)
  } catch (e) {
    // pass
  }

  // App data boostrap and relay meta fetching

  ready.then(async () => {
    // Our stores are throttled by 300, so wait until they're populated
    // before loading app data
    await sleep(350)

    if ($session) {
      loadUserData()
    }
  })
</script>

{#await ready}
  <!-- pass -->
{:then}
  <div class="text-tinted-200">
    <Routes />
    {#key $pubkey}
      <ForegroundButtons />
      <Nav />
      <Menu />
      <Toast />
    {/key}
  </div>
{/await}
