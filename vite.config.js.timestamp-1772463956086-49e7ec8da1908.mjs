// vite.config.js
import fs from "fs";
import dotenv from "file:///sessions/admiring-great-faraday/mnt/projects/coracle-workspace/chat/node_modules/.pnpm/dotenv@16.5.0/node_modules/dotenv/lib/main.js";
import * as path from "path";
import { defineConfig } from "file:///sessions/admiring-great-faraday/mnt/projects/coracle-workspace/chat/node_modules/.pnpm/vite@5.4.18_@types+node@22.15.12_terser@5.39.0/node_modules/vite/dist/node/index.js";
import { VitePWA } from "file:///sessions/admiring-great-faraday/mnt/projects/coracle-workspace/chat/node_modules/.pnpm/vite-plugin-pwa@0.20.5_@vite-pwa+assets-generator@0.2.6_vite@5.4.18_@types+node@22.15.1_27540fdb3e04eb0b541dc1676daf15fd/node_modules/vite-plugin-pwa/dist/index.js";
import htmlPlugin from "file:///sessions/admiring-great-faraday/mnt/projects/coracle-workspace/chat/node_modules/.pnpm/vite-plugin-html-config@2.0.2_vite@5.4.18_@types+node@22.15.12_terser@5.39.0_/node_modules/vite-plugin-html-config/dist/index.js";
import sveltePreprocess from "file:///sessions/admiring-great-faraday/mnt/projects/coracle-workspace/chat/node_modules/.pnpm/svelte-preprocess@6.0.3_@babel+core@7.27.1_postcss-load-config@4.0.2_postcss@8.5.3_ts-n_9cb347ff08acf94756092f5975898ad0/node_modules/svelte-preprocess/dist/index.js";
import { svelte } from "file:///sessions/admiring-great-faraday/mnt/projects/coracle-workspace/chat/node_modules/.pnpm/@sveltejs+vite-plugin-svelte@3.1.2_svelte@4.2.19_vite@5.4.18_@types+node@22.15.12_terser@5.39.0_/node_modules/@sveltejs/vite-plugin-svelte/src/index.js";
var __vite_injected_original_dirname = "/sessions/admiring-great-faraday/mnt/projects/coracle-workspace/chat";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.template" });
var isWidgetBuild = process.env.VITE_BUILD_WIDGET === "true";
var accentColor = (process.env.VITE_LIGHT_THEME ?? "").match(/accent:(#\w+)/)?.[1] ?? "#007aff";
var vite_config_default = defineConfig(async ({ command }) => {
  if (isWidgetBuild) {
    return {
      resolve: {
        alias: { src: path.resolve(__vite_injected_original_dirname, "src") }
      },
      build: {
        outDir: "dist/widget",
        lib: {
          entry: path.resolve(__vite_injected_original_dirname, "src/widget/index.ts"),
          name: "CoracleChat",
          formats: ["es", "iife"],
          fileName: (fmt) => `coracle-chat.${fmt === "es" ? "" : fmt + "."}js`
        },
        rollupOptions: {
          // Keep welshman as external in ESM to reduce bundle size.
          // IIFE builds bundle everything for standalone <script> use.
          external: (fmt) => fmt === "es" ? (id) => id.startsWith("@welshman") || id.startsWith("nostr-tools") : false
        }
      },
      plugins: [
        svelte({
          preprocess: sveltePreprocess(),
          compilerOptions: {
            customElement: true
            // compile <svelte:options customElement> properly
          },
          onwarn: (w, h) => {
            if (!w.code.startsWith("a11y-")) h(w);
          }
        })
      ]
    };
  }
  const icons = command === "serve" ? { images: [] } : await (await import("file:///sessions/admiring-great-faraday/mnt/projects/coracle-workspace/chat/node_modules/.pnpm/favicons@7.2.0/node_modules/favicons/dist/index.mjs")).favicons("public" + process.env.VITE_APP_LOGO);
  if (!fs.existsSync("public/icons")) fs.mkdirSync("public/icons");
  for (const { name, contents } of icons.images) {
    fs.writeFileSync(`public/icons/${name}`, contents, "binary");
  }
  return {
    // Use a local (Linux) path for caching to avoid Mac FUSE filesystem permission issues
    cacheDir: "/tmp/vite-cache-coracle",
    server: {
      https: false
    },
    build: {
      sourcemap: true
    },
    resolve: {
      alias: {
        src: path.resolve(__vite_injected_original_dirname, "src")
      }
    },
    plugins: [
      htmlPlugin({
        title: process.env.VITE_APP_NAME,
        metas: [
          { name: "description", content: process.env.VITE_APP_DESCRIPTION },
          { name: "theme-color", content: accentColor },
          { name: "og:title", content: process.env.VITE_APP_NAME },
          { name: "og:type", content: "website" },
          { name: "og:description", content: process.env.VITE_APP_DESCRIPTION },
          { name: "og:image", content: "/images/banner.png" },
          { name: "twitter:card", content: "summary_large_image" },
          { name: "twitter:title", content: process.env.VITE_APP_NAME },
          { name: "twitter:description", content: process.env.VITE_APP_DESCRIPTION },
          { name: "twitter:image", content: "/images/banner.png" },
          { property: "og:url", content: process.env.VITE_APP_URL },
          { name: "msapplication-TileColor", content: accentColor },
          { name: "msapplication-TileImage", content: "/icons/mstile-144x144.png" }
        ],
        links: [
          { rel: "icon", href: "/icons/favicon.ico", sizes: "48x48" },
          { rel: "icon", href: "/icons/favicon-16x16.png", sizes: "any", type: "image/png" },
          { rel: "icon", href: "/icons/favicon-32x32.png", sizes: "any", type: "image/png" },
          { rel: "icon", href: "/icons/favicon-48x48.png", sizes: "any", type: "image/png" },
          { rel: "apple-touch-icon", sizes: "57x57", href: "/icons/apple-touch-icon-57x57.png" },
          { rel: "apple-touch-icon", sizes: "60x60", href: "/icons/apple-touch-icon-60x60.png" },
          { rel: "apple-touch-icon", sizes: "72x72", href: "/icons/apple-touch-icon-72x72.png" },
          { rel: "apple-touch-icon", sizes: "76x76", href: "/icons/apple-touch-icon-76x76.png" },
          { rel: "apple-touch-icon", sizes: "114x114", href: "/icons/apple-touch-icon-114x114.png" },
          { rel: "apple-touch-icon", sizes: "120x120", href: "/icons/apple-touch-icon-120x120.png" },
          { rel: "apple-touch-icon", sizes: "144x144", href: "/icons/apple-touch-icon-144x144.png" },
          { rel: "apple-touch-icon", sizes: "152x152", href: "/icons/apple-touch-icon-152x152.png" },
          { rel: "apple-touch-icon", sizes: "180x180", href: "/icons/apple-touch-icon-180x180.png" },
          {
            rel: "icon",
            type: "image/png",
            sizes: "192x192",
            href: "/icons/android-icon-192x192.png"
          },
          { rel: "icon", type: "image/png", sizes: "32x32", href: "/icons/favicon-32x32.png" },
          { rel: "icon", type: "image/png", sizes: "96x96", href: "/icons/favicon-96x96.png" },
          { rel: "icon", type: "image/png", sizes: "16x16", href: "/icons/favicon-16x16.png" },
          { rel: "mask-icon", href: "/images/logo.svg", color: "#FFFFFF" },
          {
            rel: "icon",
            type: "image/png",
            sizes: "144x144",
            href: "/icons/android-chrome-144x144.png"
          },
          {
            rel: "icon",
            type: "image/png",
            sizes: "192x192",
            href: "/icons/android-chrome-192x192.png"
          },
          {
            rel: "icon",
            type: "image/png",
            sizes: "256x256",
            href: "/icons/android-chrome-256x256.png"
          },
          { rel: "icon", type: "image/png", sizes: "36x36", href: "/icons/android-chrome-36x36.png" },
          {
            rel: "icon",
            type: "image/png",
            sizes: "384x384",
            href: "/icons/android-chrome-384x384.png"
          },
          { rel: "icon", type: "image/png", sizes: "48x48", href: "/icons/android-chrome-48x48.png" },
          {
            rel: "icon",
            type: "image/png",
            sizes: "512x512",
            href: "/icons/android-chrome-512x512.png"
          },
          { rel: "icon", type: "image/png", sizes: "72x72", href: "/icons/android-chrome-72x72.png" },
          { rel: "icon", type: "image/png", sizes: "96x96", href: "/icons/android-chrome-96x96.png" }
        ]
      }),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 ** 2
          // 5 MB or set to something else
        },
        manifest: {
          name: process.env.VITE_APP_NAME,
          short_name: process.env.VITE_APP_NAME,
          description: process.env.VITE_APP_DESCRIPTION,
          theme_color: accentColor,
          protocol_handlers: [{ protocol: "web+nostr", url: "/%s" }],
          permissions: ["clipboardRead", "clipboardWrite", "unlimitedStorage"],
          icons: [
            { src: "images/pwa-64x64.png", sizes: "64x64", type: "image/png" },
            { src: "images/pwa-192x192.png", sizes: "192x192", type: "image/png" },
            { src: "images/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
            {
              src: "images/maskable-icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable"
            }
          ]
        }
      }),
      svelte({
        preprocess: sveltePreprocess(),
        onwarn: (warning, handler) => {
          if (warning.code.startsWith("a11y-")) return;
          if (warning.filename.includes("node_modules")) return;
          handler(warning);
        }
      })
    ]
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvc2Vzc2lvbnMvYWRtaXJpbmctZ3JlYXQtZmFyYWRheS9tbnQvcHJvamVjdHMvY29yYWNsZS13b3Jrc3BhY2UvY2hhdFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL3Nlc3Npb25zL2FkbWlyaW5nLWdyZWF0LWZhcmFkYXkvbW50L3Byb2plY3RzL2NvcmFjbGUtd29ya3NwYWNlL2NoYXQvdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL3Nlc3Npb25zL2FkbWlyaW5nLWdyZWF0LWZhcmFkYXkvbW50L3Byb2plY3RzL2NvcmFjbGUtd29ya3NwYWNlL2NoYXQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgZnMgZnJvbSBcImZzXCJcbmltcG9ydCBkb3RlbnYgZnJvbSBcImRvdGVudlwiXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCJcbmltcG9ydCB7ZGVmaW5lQ29uZmlnfSBmcm9tIFwidml0ZVwiXG5pbXBvcnQge1ZpdGVQV0F9IGZyb20gXCJ2aXRlLXBsdWdpbi1wd2FcIlxuaW1wb3J0IGh0bWxQbHVnaW4gZnJvbSBcInZpdGUtcGx1Z2luLWh0bWwtY29uZmlnXCJcbmltcG9ydCBzdmVsdGVQcmVwcm9jZXNzIGZyb20gXCJzdmVsdGUtcHJlcHJvY2Vzc1wiXG5pbXBvcnQge3N2ZWx0ZX0gZnJvbSBcIkBzdmVsdGVqcy92aXRlLXBsdWdpbi1zdmVsdGVcIlxuXG5kb3RlbnYuY29uZmlnKHtwYXRoOiBcIi5lbnZcIn0pXG5kb3RlbnYuY29uZmlnKHtwYXRoOiBcIi5lbnYudGVtcGxhdGVcIn0pXG5cbi8vIFx1MjUwMFx1MjUwMCBXaWRnZXQgLyBsaWJyYXJ5IGJ1aWxkIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuLy8gUnVuIHdpdGg6ICBWSVRFX0JVSUxEX1dJREdFVD10cnVlIHBucG0gYnVpbGRcbi8vICAgICAgICAgICAgcG5wbSBidWlsZDp3aWRnZXQgICAoc2hvcnRjdXQgaW4gcGFja2FnZS5qc29uKVxuLy9cbi8vIE91dHB1dDogZGlzdC93aWRnZXQvY29yYWNsZS1jaGF0LmpzICAgICAgIChFU00pXG4vLyAgICAgICAgIGRpc3Qvd2lkZ2V0L2NvcmFjbGUtY2hhdC5paWZlLmpzICAoSUlGRSwgZm9yIDxzY3JpcHQ+IHRhZylcbi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuY29uc3QgaXNXaWRnZXRCdWlsZCA9IHByb2Nlc3MuZW52LlZJVEVfQlVJTERfV0lER0VUID09PSBcInRydWVcIlxuXG5jb25zdCBhY2NlbnRDb2xvciA9IChwcm9jZXNzLmVudi5WSVRFX0xJR0hUX1RIRU1FID8/IFwiXCIpLm1hdGNoKC9hY2NlbnQ6KCNcXHcrKS8pPy5bMV0gPz8gXCIjMDA3YWZmXCJcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKGFzeW5jICh7Y29tbWFuZH0pID0+IHtcbiAgLy8gU2tpcCBoZWF2eSBmYXZpY29ucyBnZW5lcmF0aW9uIGluIHdpZGdldCBidWlsZHNcbiAgaWYgKGlzV2lkZ2V0QnVpbGQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcmVzb2x2ZToge1xuICAgICAgICBhbGlhczogeyBzcmM6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwic3JjXCIpIH0sXG4gICAgICB9LFxuICAgICAgYnVpbGQ6IHtcbiAgICAgICAgb3V0RGlyOiBcImRpc3Qvd2lkZ2V0XCIsXG4gICAgICAgIGxpYjoge1xuICAgICAgICAgIGVudHJ5OiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcInNyYy93aWRnZXQvaW5kZXgudHNcIiksXG4gICAgICAgICAgbmFtZTogXCJDb3JhY2xlQ2hhdFwiLFxuICAgICAgICAgIGZvcm1hdHM6IFtcImVzXCIsIFwiaWlmZVwiXSxcbiAgICAgICAgICBmaWxlTmFtZTogZm10ID0+IGBjb3JhY2xlLWNoYXQuJHtmbXQgPT09IFwiZXNcIiA/IFwiXCIgOiBmbXQgKyBcIi5cIn1qc2AsXG4gICAgICAgIH0sXG4gICAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgICAvLyBLZWVwIHdlbHNobWFuIGFzIGV4dGVybmFsIGluIEVTTSB0byByZWR1Y2UgYnVuZGxlIHNpemUuXG4gICAgICAgICAgLy8gSUlGRSBidWlsZHMgYnVuZGxlIGV2ZXJ5dGhpbmcgZm9yIHN0YW5kYWxvbmUgPHNjcmlwdD4gdXNlLlxuICAgICAgICAgIGV4dGVybmFsOiBmbXQgPT4gZm10ID09PSBcImVzXCJcbiAgICAgICAgICAgID8gaWQgPT4gaWQuc3RhcnRzV2l0aChcIkB3ZWxzaG1hblwiKSB8fCBpZC5zdGFydHNXaXRoKFwibm9zdHItdG9vbHNcIilcbiAgICAgICAgICAgIDogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgcGx1Z2luczogW1xuICAgICAgICBzdmVsdGUoe1xuICAgICAgICAgIHByZXByb2Nlc3M6IHN2ZWx0ZVByZXByb2Nlc3MoKSxcbiAgICAgICAgICBjb21waWxlck9wdGlvbnM6IHtcbiAgICAgICAgICAgIGN1c3RvbUVsZW1lbnQ6IHRydWUsICAgLy8gY29tcGlsZSA8c3ZlbHRlOm9wdGlvbnMgY3VzdG9tRWxlbWVudD4gcHJvcGVybHlcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9ud2FybjogKHcsIGgpID0+IHsgaWYgKCF3LmNvZGUuc3RhcnRzV2l0aChcImExMXktXCIpKSBoKHcpIH0sXG4gICAgICAgIH0pLFxuICAgICAgXSxcbiAgICB9XG4gIH1cblxuICAvLyBTa2lwIGZhdmljb25zIGdlbmVyYXRpb24gaW4gZGV2IG1vZGUgKHJlcXVpcmVzIHNoYXJwIG5hdGl2ZSBtb2R1bGUpXG4gIGNvbnN0IGljb25zID0gY29tbWFuZCA9PT0gXCJzZXJ2ZVwiXG4gICAgPyB7aW1hZ2VzOiBbXX1cbiAgICA6IGF3YWl0IChhd2FpdCBpbXBvcnQoXCJmYXZpY29uc1wiKSkuZmF2aWNvbnMoXCJwdWJsaWNcIiArIHByb2Nlc3MuZW52LlZJVEVfQVBQX0xPR08pXG5cbiAgaWYgKCFmcy5leGlzdHNTeW5jKFwicHVibGljL2ljb25zXCIpKSBmcy5ta2RpclN5bmMoXCJwdWJsaWMvaWNvbnNcIilcblxuICBmb3IgKGNvbnN0IHtuYW1lLCBjb250ZW50c30gb2YgaWNvbnMuaW1hZ2VzKSB7XG4gICAgZnMud3JpdGVGaWxlU3luYyhgcHVibGljL2ljb25zLyR7bmFtZX1gLCBjb250ZW50cywgXCJiaW5hcnlcIilcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgLy8gVXNlIGEgbG9jYWwgKExpbnV4KSBwYXRoIGZvciBjYWNoaW5nIHRvIGF2b2lkIE1hYyBGVVNFIGZpbGVzeXN0ZW0gcGVybWlzc2lvbiBpc3N1ZXNcbiAgICBjYWNoZURpcjogXCIvdG1wL3ZpdGUtY2FjaGUtY29yYWNsZVwiLFxuICAgIHNlcnZlcjoge1xuICAgICAgaHR0cHM6IGZhbHNlLFxuICAgIH0sXG4gICAgYnVpbGQ6IHtcbiAgICAgIHNvdXJjZW1hcDogdHJ1ZSxcbiAgICB9LFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgIHNyYzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCJzcmNcIiksXG4gICAgICB9LFxuICAgIH0sXG4gICAgcGx1Z2luczogW1xuICAgICAgaHRtbFBsdWdpbih7XG4gICAgICAgIHRpdGxlOiBwcm9jZXNzLmVudi5WSVRFX0FQUF9OQU1FLFxuICAgICAgICBtZXRhczogW1xuICAgICAgICAgIHtuYW1lOiBcImRlc2NyaXB0aW9uXCIsIGNvbnRlbnQ6IHByb2Nlc3MuZW52LlZJVEVfQVBQX0RFU0NSSVBUSU9OfSxcbiAgICAgICAgICB7bmFtZTogXCJ0aGVtZS1jb2xvclwiLCBjb250ZW50OiBhY2NlbnRDb2xvcn0sXG4gICAgICAgICAge25hbWU6IFwib2c6dGl0bGVcIiwgY29udGVudDogcHJvY2Vzcy5lbnYuVklURV9BUFBfTkFNRX0sXG4gICAgICAgICAge25hbWU6IFwib2c6dHlwZVwiLCBjb250ZW50OiBcIndlYnNpdGVcIn0sXG4gICAgICAgICAge25hbWU6IFwib2c6ZGVzY3JpcHRpb25cIiwgY29udGVudDogcHJvY2Vzcy5lbnYuVklURV9BUFBfREVTQ1JJUFRJT059LFxuICAgICAgICAgIHtuYW1lOiBcIm9nOmltYWdlXCIsIGNvbnRlbnQ6IFwiL2ltYWdlcy9iYW5uZXIucG5nXCJ9LFxuICAgICAgICAgIHtuYW1lOiBcInR3aXR0ZXI6Y2FyZFwiLCBjb250ZW50OiBcInN1bW1hcnlfbGFyZ2VfaW1hZ2VcIn0sXG4gICAgICAgICAge25hbWU6IFwidHdpdHRlcjp0aXRsZVwiLCBjb250ZW50OiBwcm9jZXNzLmVudi5WSVRFX0FQUF9OQU1FfSxcbiAgICAgICAgICB7bmFtZTogXCJ0d2l0dGVyOmRlc2NyaXB0aW9uXCIsIGNvbnRlbnQ6IHByb2Nlc3MuZW52LlZJVEVfQVBQX0RFU0NSSVBUSU9OfSxcbiAgICAgICAgICB7bmFtZTogXCJ0d2l0dGVyOmltYWdlXCIsIGNvbnRlbnQ6IFwiL2ltYWdlcy9iYW5uZXIucG5nXCJ9LFxuICAgICAgICAgIHtwcm9wZXJ0eTogXCJvZzp1cmxcIiwgY29udGVudDogcHJvY2Vzcy5lbnYuVklURV9BUFBfVVJMfSxcbiAgICAgICAgICB7bmFtZTogXCJtc2FwcGxpY2F0aW9uLVRpbGVDb2xvclwiLCBjb250ZW50OiBhY2NlbnRDb2xvcn0sXG4gICAgICAgICAge25hbWU6IFwibXNhcHBsaWNhdGlvbi1UaWxlSW1hZ2VcIiwgY29udGVudDogXCIvaWNvbnMvbXN0aWxlLTE0NHgxNDQucG5nXCJ9LFxuICAgICAgICBdLFxuICAgICAgICBsaW5rczogW1xuICAgICAgICAgIHtyZWw6IFwiaWNvblwiLCBocmVmOiBcIi9pY29ucy9mYXZpY29uLmljb1wiLCBzaXplczogXCI0OHg0OFwifSxcbiAgICAgICAgICB7cmVsOiBcImljb25cIiwgaHJlZjogXCIvaWNvbnMvZmF2aWNvbi0xNngxNi5wbmdcIiwgc2l6ZXM6IFwiYW55XCIsIHR5cGU6IFwiaW1hZ2UvcG5nXCJ9LFxuICAgICAgICAgIHtyZWw6IFwiaWNvblwiLCBocmVmOiBcIi9pY29ucy9mYXZpY29uLTMyeDMyLnBuZ1wiLCBzaXplczogXCJhbnlcIiwgdHlwZTogXCJpbWFnZS9wbmdcIn0sXG4gICAgICAgICAge3JlbDogXCJpY29uXCIsIGhyZWY6IFwiL2ljb25zL2Zhdmljb24tNDh4NDgucG5nXCIsIHNpemVzOiBcImFueVwiLCB0eXBlOiBcImltYWdlL3BuZ1wifSxcbiAgICAgICAgICB7cmVsOiBcImFwcGxlLXRvdWNoLWljb25cIiwgc2l6ZXM6IFwiNTd4NTdcIiwgaHJlZjogXCIvaWNvbnMvYXBwbGUtdG91Y2gtaWNvbi01N3g1Ny5wbmdcIn0sXG4gICAgICAgICAge3JlbDogXCJhcHBsZS10b3VjaC1pY29uXCIsIHNpemVzOiBcIjYweDYwXCIsIGhyZWY6IFwiL2ljb25zL2FwcGxlLXRvdWNoLWljb24tNjB4NjAucG5nXCJ9LFxuICAgICAgICAgIHtyZWw6IFwiYXBwbGUtdG91Y2gtaWNvblwiLCBzaXplczogXCI3Mng3MlwiLCBocmVmOiBcIi9pY29ucy9hcHBsZS10b3VjaC1pY29uLTcyeDcyLnBuZ1wifSxcbiAgICAgICAgICB7cmVsOiBcImFwcGxlLXRvdWNoLWljb25cIiwgc2l6ZXM6IFwiNzZ4NzZcIiwgaHJlZjogXCIvaWNvbnMvYXBwbGUtdG91Y2gtaWNvbi03Nng3Ni5wbmdcIn0sXG4gICAgICAgICAge3JlbDogXCJhcHBsZS10b3VjaC1pY29uXCIsIHNpemVzOiBcIjExNHgxMTRcIiwgaHJlZjogXCIvaWNvbnMvYXBwbGUtdG91Y2gtaWNvbi0xMTR4MTE0LnBuZ1wifSxcbiAgICAgICAgICB7cmVsOiBcImFwcGxlLXRvdWNoLWljb25cIiwgc2l6ZXM6IFwiMTIweDEyMFwiLCBocmVmOiBcIi9pY29ucy9hcHBsZS10b3VjaC1pY29uLTEyMHgxMjAucG5nXCJ9LFxuICAgICAgICAgIHtyZWw6IFwiYXBwbGUtdG91Y2gtaWNvblwiLCBzaXplczogXCIxNDR4MTQ0XCIsIGhyZWY6IFwiL2ljb25zL2FwcGxlLXRvdWNoLWljb24tMTQ0eDE0NC5wbmdcIn0sXG4gICAgICAgICAge3JlbDogXCJhcHBsZS10b3VjaC1pY29uXCIsIHNpemVzOiBcIjE1MngxNTJcIiwgaHJlZjogXCIvaWNvbnMvYXBwbGUtdG91Y2gtaWNvbi0xNTJ4MTUyLnBuZ1wifSxcbiAgICAgICAgICB7cmVsOiBcImFwcGxlLXRvdWNoLWljb25cIiwgc2l6ZXM6IFwiMTgweDE4MFwiLCBocmVmOiBcIi9pY29ucy9hcHBsZS10b3VjaC1pY29uLTE4MHgxODAucG5nXCJ9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHJlbDogXCJpY29uXCIsXG4gICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxuICAgICAgICAgICAgc2l6ZXM6IFwiMTkyeDE5MlwiLFxuICAgICAgICAgICAgaHJlZjogXCIvaWNvbnMvYW5kcm9pZC1pY29uLTE5MngxOTIucG5nXCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7cmVsOiBcImljb25cIiwgdHlwZTogXCJpbWFnZS9wbmdcIiwgc2l6ZXM6IFwiMzJ4MzJcIiwgaHJlZjogXCIvaWNvbnMvZmF2aWNvbi0zMngzMi5wbmdcIn0sXG4gICAgICAgICAge3JlbDogXCJpY29uXCIsIHR5cGU6IFwiaW1hZ2UvcG5nXCIsIHNpemVzOiBcIjk2eDk2XCIsIGhyZWY6IFwiL2ljb25zL2Zhdmljb24tOTZ4OTYucG5nXCJ9LFxuICAgICAgICAgIHtyZWw6IFwiaWNvblwiLCB0eXBlOiBcImltYWdlL3BuZ1wiLCBzaXplczogXCIxNngxNlwiLCBocmVmOiBcIi9pY29ucy9mYXZpY29uLTE2eDE2LnBuZ1wifSxcbiAgICAgICAgICB7cmVsOiBcIm1hc2staWNvblwiLCBocmVmOiBcIi9pbWFnZXMvbG9nby5zdmdcIiwgY29sb3I6IFwiI0ZGRkZGRlwifSxcblxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHJlbDogXCJpY29uXCIsXG4gICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxuICAgICAgICAgICAgc2l6ZXM6IFwiMTQ0eDE0NFwiLFxuICAgICAgICAgICAgaHJlZjogXCIvaWNvbnMvYW5kcm9pZC1jaHJvbWUtMTQ0eDE0NC5wbmdcIixcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHJlbDogXCJpY29uXCIsXG4gICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxuICAgICAgICAgICAgc2l6ZXM6IFwiMTkyeDE5MlwiLFxuICAgICAgICAgICAgaHJlZjogXCIvaWNvbnMvYW5kcm9pZC1jaHJvbWUtMTkyeDE5Mi5wbmdcIixcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHJlbDogXCJpY29uXCIsXG4gICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxuICAgICAgICAgICAgc2l6ZXM6IFwiMjU2eDI1NlwiLFxuICAgICAgICAgICAgaHJlZjogXCIvaWNvbnMvYW5kcm9pZC1jaHJvbWUtMjU2eDI1Ni5wbmdcIixcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtyZWw6IFwiaWNvblwiLCB0eXBlOiBcImltYWdlL3BuZ1wiLCBzaXplczogXCIzNngzNlwiLCBocmVmOiBcIi9pY29ucy9hbmRyb2lkLWNocm9tZS0zNngzNi5wbmdcIn0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgcmVsOiBcImljb25cIixcbiAgICAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXG4gICAgICAgICAgICBzaXplczogXCIzODR4Mzg0XCIsXG4gICAgICAgICAgICBocmVmOiBcIi9pY29ucy9hbmRyb2lkLWNocm9tZS0zODR4Mzg0LnBuZ1wiLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge3JlbDogXCJpY29uXCIsIHR5cGU6IFwiaW1hZ2UvcG5nXCIsIHNpemVzOiBcIjQ4eDQ4XCIsIGhyZWY6IFwiL2ljb25zL2FuZHJvaWQtY2hyb21lLTQ4eDQ4LnBuZ1wifSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICByZWw6IFwiaWNvblwiLFxuICAgICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcbiAgICAgICAgICAgIHNpemVzOiBcIjUxMng1MTJcIixcbiAgICAgICAgICAgIGhyZWY6IFwiL2ljb25zL2FuZHJvaWQtY2hyb21lLTUxMng1MTIucG5nXCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7cmVsOiBcImljb25cIiwgdHlwZTogXCJpbWFnZS9wbmdcIiwgc2l6ZXM6IFwiNzJ4NzJcIiwgaHJlZjogXCIvaWNvbnMvYW5kcm9pZC1jaHJvbWUtNzJ4NzIucG5nXCJ9LFxuICAgICAgICAgIHtyZWw6IFwiaWNvblwiLCB0eXBlOiBcImltYWdlL3BuZ1wiLCBzaXplczogXCI5Nng5NlwiLCBocmVmOiBcIi9pY29ucy9hbmRyb2lkLWNocm9tZS05Nng5Ni5wbmdcIn0sXG4gICAgICAgIF0sXG4gICAgICB9KSxcbiAgICAgIFZpdGVQV0Eoe1xuICAgICAgICByZWdpc3RlclR5cGU6IFwiYXV0b1VwZGF0ZVwiLFxuICAgICAgICBpbmplY3RSZWdpc3RlcjogXCJhdXRvXCIsXG4gICAgICAgIHdvcmtib3g6IHtcbiAgICAgICAgICBtYXhpbXVtRmlsZVNpemVUb0NhY2hlSW5CeXRlczogNSAqIDEwMjQgKiogMiwgLy8gNSBNQiBvciBzZXQgdG8gc29tZXRoaW5nIGVsc2VcbiAgICAgICAgfSxcbiAgICAgICAgbWFuaWZlc3Q6IHtcbiAgICAgICAgICBuYW1lOiBwcm9jZXNzLmVudi5WSVRFX0FQUF9OQU1FLFxuICAgICAgICAgIHNob3J0X25hbWU6IHByb2Nlc3MuZW52LlZJVEVfQVBQX05BTUUsXG4gICAgICAgICAgZGVzY3JpcHRpb246IHByb2Nlc3MuZW52LlZJVEVfQVBQX0RFU0NSSVBUSU9OLFxuICAgICAgICAgIHRoZW1lX2NvbG9yOiBhY2NlbnRDb2xvcixcbiAgICAgICAgICBwcm90b2NvbF9oYW5kbGVyczogW3twcm90b2NvbDogXCJ3ZWIrbm9zdHJcIiwgdXJsOiBcIi8lc1wifV0sXG4gICAgICAgICAgcGVybWlzc2lvbnM6IFtcImNsaXBib2FyZFJlYWRcIiwgXCJjbGlwYm9hcmRXcml0ZVwiLCBcInVubGltaXRlZFN0b3JhZ2VcIl0sXG4gICAgICAgICAgaWNvbnM6IFtcbiAgICAgICAgICAgIHtzcmM6IFwiaW1hZ2VzL3B3YS02NHg2NC5wbmdcIiwgc2l6ZXM6IFwiNjR4NjRcIiwgdHlwZTogXCJpbWFnZS9wbmdcIn0sXG4gICAgICAgICAgICB7c3JjOiBcImltYWdlcy9wd2EtMTkyeDE5Mi5wbmdcIiwgc2l6ZXM6IFwiMTkyeDE5MlwiLCB0eXBlOiBcImltYWdlL3BuZ1wifSxcbiAgICAgICAgICAgIHtzcmM6IFwiaW1hZ2VzL3B3YS01MTJ4NTEyLnBuZ1wiLCBzaXplczogXCI1MTJ4NTEyXCIsIHR5cGU6IFwiaW1hZ2UvcG5nXCIsIHB1cnBvc2U6IFwiYW55XCJ9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzcmM6IFwiaW1hZ2VzL21hc2thYmxlLWljb24tNTEyeDUxMi5wbmdcIixcbiAgICAgICAgICAgICAgc2l6ZXM6IFwiNTEyeDUxMlwiLFxuICAgICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxuICAgICAgICAgICAgICBwdXJwb3NlOiBcIm1hc2thYmxlXCIsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICAgIHN2ZWx0ZSh7XG4gICAgICAgIHByZXByb2Nlc3M6IHN2ZWx0ZVByZXByb2Nlc3MoKSxcbiAgICAgICAgb253YXJuOiAod2FybmluZywgaGFuZGxlcikgPT4ge1xuICAgICAgICAgIGlmICh3YXJuaW5nLmNvZGUuc3RhcnRzV2l0aChcImExMXktXCIpKSByZXR1cm5cbiAgICAgICAgICBpZiAod2FybmluZy5maWxlbmFtZS5pbmNsdWRlcyhcIm5vZGVfbW9kdWxlc1wiKSkgcmV0dXJuXG5cbiAgICAgICAgICBoYW5kbGVyKHdhcm5pbmcpXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICBdLFxuICB9XG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE4WCxPQUFPLFFBQVE7QUFDN1ksT0FBTyxZQUFZO0FBQ25CLFlBQVksVUFBVTtBQUN0QixTQUFRLG9CQUFtQjtBQUMzQixTQUFRLGVBQWM7QUFDdEIs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
