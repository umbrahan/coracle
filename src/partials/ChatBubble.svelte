<script lang="ts">
  import cx from "classnames"
  import {formatTimestamp} from "@welshman/lib"
  import Media from "src/partials/Media.svelte"

  export let isIncoming: boolean = true
  export let content: string = ""
  export let timestamp: number = 0
  export let attachments: Array<{url: string, mimeType?: string}> = []

  // Extract links from content
  const extractLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s<]+)/g
    return text.match(urlRegex) || []
  }

  // Split content by links and render
  const renderContent = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s<]+)/g
    const parts = text.split(urlRegex)

    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return {
          type: "link",
          content: part,
          key: `link-${i}`,
        }
      }
      return {
        type: "text",
        content: part,
        key: `text-${i}`,
      }
    })
  }

  $: contentParts = renderContent(content)

  // Bubble styles
  $: bubbleClass = cx(
    "max-w-[70%] rounded-2xl p-3 text-[14px] break-words relative",
    {
      // Incoming message (received)
      "bg-[#F4F4F5] text-black dark:bg-[#2C2C2E] dark:text-white rounded-tl-none":
        isIncoming,
      // Outgoing message (sent)
      "bg-[#3390EC] text-white dark:bg-[#64B5EF] dark:text-black rounded-tr-none ml-auto":
        !isIncoming,
    }
  )

  $: timeClass = cx("text-[11px] opacity-70 float-right mt-1 ml-2", {
    "text-neutral-500 dark:text-neutral-400": isIncoming,
    "text-white/70 dark:text-black/70": !isIncoming,
  })
</script>

<div class={bubbleClass}>
  {#if attachments.length > 0}
    <div class="mb-2">
      {#each attachments as attachment}
        {#if attachment.mimeType?.startsWith("image/") || !attachment.mimeType}
          <Media url={attachment.url} />
        {:else}
          <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            class="block underline"
          >
            Attachment
          </a>
        {/if}
      {/each}
    </div>
  {/if}

  {#if content}
    <div class="content">
      {#each contentParts as part}
        {#if part.type === "link"}
          <a
            href={part.content}
            target="_blank"
            rel="noopener noreferrer"
            class="underline"
            class:underline-neutral-500={isIncoming}
            class:underline-white/70={!isIncoming}
          >
            {part.content}
          </a>
        {:else}
          <span>{part.content}</span>
        {/if}
      {/each}
    </div>
  {/if}

  <div class="clear-both" />

  {#if timestamp > 0}
    <span class={timeClass}>
      {formatTimestamp(timestamp)}
    </span>
  {/if}
</div>

<style>
  .content {
    white-space: pre-wrap;
    word-break: break-word;
  }
</style>
