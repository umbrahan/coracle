// vite.config.js
import fs from "fs";
import dotenv from "file:///sessions/admiring-great-faraday/mnt/projects/coracle-workspace/chat/node_modules/.pnpm/dotenv@16.5.0/node_modules/dotenv/lib/main.js";
import * as path from "path";
import { defineConfig } from "file:///sessions/admiring-great-faraday/mnt/projects/coracle-workspace/chat/node_modules/.pnpm/vite@5.4.18_@types+node@22.15.12_terser@5.39.0/node_modules/vite/dist/node/index.js";
import { VitePWA } from "file:///sessions/admiring-great-faraday/mnt/projects/coracle-workspace/chat/node_modules/.pnpm/vite-plugin-pwa@0.20.5_@vite-pwa+assets-generator@0.2.6_vite@5.4.18_@types+node@22.15.1_27540fdb3e04eb0b541dc1676daf15fd/node_modules/vite-plugin-pwa/dist/index.js";
import { favicons } from "file:///sessions/admiring-great-faraday/mnt/projects/coracle-workspace/chat/node_modules/.pnpm/favicons@7.2.0/node_modules/favicons/dist/index.mjs";
import htmlPlugin from "file:///sessions/admiring-great-faraday/mnt/projects/coracle-workspace/chat/node_modules/.pnpm/vite-plugin-html-config@2.0.2_vite@5.4.18_@types+node@22.15.12_terser@5.39.0_/node_modules/vite-plugin-html-config/dist/index.js";
import sveltePreprocess from "file:///sessions/admiring-great-faraday/mnt/projects/coracle-workspace/chat/node_modules/.pnpm/svelte-preprocess@6.0.3_@babel+core@7.27.1_postcss-load-config@4.0.2_postcss@8.5.3_ts-n_9cb347ff08acf94756092f5975898ad0/node_modules/svelte-preprocess/dist/index.js";
import { svelte } from "file:///sessions/admiring-great-faraday/mnt/projects/coracle-workspace/chat/node_modules/.pnpm/@sveltejs+vite-plugin-svelte@3.1.2_svelte@4.2.19_vite@5.4.18_@types+node@22.15.12_terser@5.39.0_/node_modules/@sveltejs/vite-plugin-svelte/src/index.js";
var __vite_injected_original_dirname = "/sessions/admiring-great-faraday/mnt/projects/coracle-workspace/chat";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.template" });
var isWidgetBuild = process.env.VITE_BUILD_WIDGET === "true";
var accentColor = (process.env.VITE_LIGHT_THEME ?? "").match(/accent:(#\w+)/)?.[1] ?? "#007aff";
var vite_config_default = defineConfig(async () => {
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
  const icons = await favicons("public" + process.env.VITE_APP_LOGO);
  if (!fs.existsSync("public/icons")) fs.mkdirSync("public/icons");
  for (const { name, contents } of icons.images) {
    fs.writeFileSync(`public/icons/${name}`, contents, "binary");
  }
  return {
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvc2Vzc2lvbnMvYWRtaXJpbmctZ3JlYXQtZmFyYWRheS9tbnQvcHJvamVjdHMvY29yYWNsZS13b3Jrc3BhY2UvY2hhdFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL3Nlc3Npb25zL2FkbWlyaW5nLWdyZWF0LWZhcmFkYXkvbW50L3Byb2plY3RzL2NvcmFjbGUtd29ya3NwYWNlL2NoYXQvdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL3Nlc3Npb25zL2FkbWlyaW5nLWdyZWF0LWZhcmFkYXkvbW50L3Byb2plY3RzL2NvcmFjbGUtd29ya3NwYWNlL2NoYXQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgZnMgZnJvbSBcImZzXCJcbmltcG9ydCBkb3RlbnYgZnJvbSBcImRvdGVudlwiXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCJcbmltcG9ydCB7ZGVmaW5lQ29uZmlnfSBmcm9tIFwidml0ZVwiXG5pbXBvcnQge1ZpdGVQV0F9IGZyb20gXCJ2aXRlLXBsdWdpbi1wd2FcIlxuaW1wb3J0IHtmYXZpY29uc30gZnJvbSBcImZhdmljb25zXCJcbmltcG9ydCBodG1sUGx1Z2luIGZyb20gXCJ2aXRlLXBsdWdpbi1odG1sLWNvbmZpZ1wiXG5pbXBvcnQgc3ZlbHRlUHJlcHJvY2VzcyBmcm9tIFwic3ZlbHRlLXByZXByb2Nlc3NcIlxuaW1wb3J0IHtzdmVsdGV9IGZyb20gXCJAc3ZlbHRlanMvdml0ZS1wbHVnaW4tc3ZlbHRlXCJcblxuZG90ZW52LmNvbmZpZyh7cGF0aDogXCIuZW52XCJ9KVxuZG90ZW52LmNvbmZpZyh7cGF0aDogXCIuZW52LnRlbXBsYXRlXCJ9KVxuXG4vLyBcdTI1MDBcdTI1MDAgV2lkZ2V0IC8gbGlicmFyeSBidWlsZCBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbi8vIFJ1biB3aXRoOiAgVklURV9CVUlMRF9XSURHRVQ9dHJ1ZSBwbnBtIGJ1aWxkXG4vLyAgICAgICAgICAgIHBucG0gYnVpbGQ6d2lkZ2V0ICAgKHNob3J0Y3V0IGluIHBhY2thZ2UuanNvbilcbi8vXG4vLyBPdXRwdXQ6IGRpc3Qvd2lkZ2V0L2NvcmFjbGUtY2hhdC5qcyAgICAgICAoRVNNKVxuLy8gICAgICAgICBkaXN0L3dpZGdldC9jb3JhY2xlLWNoYXQuaWlmZS5qcyAgKElJRkUsIGZvciA8c2NyaXB0PiB0YWcpXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbmNvbnN0IGlzV2lkZ2V0QnVpbGQgPSBwcm9jZXNzLmVudi5WSVRFX0JVSUxEX1dJREdFVCA9PT0gXCJ0cnVlXCJcblxuY29uc3QgYWNjZW50Q29sb3IgPSAocHJvY2Vzcy5lbnYuVklURV9MSUdIVF9USEVNRSA/PyBcIlwiKS5tYXRjaCgvYWNjZW50OigjXFx3KykvKT8uWzFdID8/IFwiIzAwN2FmZlwiXG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyhhc3luYyAoKSA9PiB7XG4gIC8vIFNraXAgaGVhdnkgZmF2aWNvbnMgZ2VuZXJhdGlvbiBpbiB3aWRnZXQgYnVpbGRzXG4gIGlmIChpc1dpZGdldEJ1aWxkKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgYWxpYXM6IHsgc3JjOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcInNyY1wiKSB9LFxuICAgICAgfSxcbiAgICAgIGJ1aWxkOiB7XG4gICAgICAgIG91dERpcjogXCJkaXN0L3dpZGdldFwiLFxuICAgICAgICBsaWI6IHtcbiAgICAgICAgICBlbnRyeTogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCJzcmMvd2lkZ2V0L2luZGV4LnRzXCIpLFxuICAgICAgICAgIG5hbWU6IFwiQ29yYWNsZUNoYXRcIixcbiAgICAgICAgICBmb3JtYXRzOiBbXCJlc1wiLCBcImlpZmVcIl0sXG4gICAgICAgICAgZmlsZU5hbWU6IGZtdCA9PiBgY29yYWNsZS1jaGF0LiR7Zm10ID09PSBcImVzXCIgPyBcIlwiIDogZm10ICsgXCIuXCJ9anNgLFxuICAgICAgICB9LFxuICAgICAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAgICAgLy8gS2VlcCB3ZWxzaG1hbiBhcyBleHRlcm5hbCBpbiBFU00gdG8gcmVkdWNlIGJ1bmRsZSBzaXplLlxuICAgICAgICAgIC8vIElJRkUgYnVpbGRzIGJ1bmRsZSBldmVyeXRoaW5nIGZvciBzdGFuZGFsb25lIDxzY3JpcHQ+IHVzZS5cbiAgICAgICAgICBleHRlcm5hbDogZm10ID0+IGZtdCA9PT0gXCJlc1wiXG4gICAgICAgICAgICA/IGlkID0+IGlkLnN0YXJ0c1dpdGgoXCJAd2Vsc2htYW5cIikgfHwgaWQuc3RhcnRzV2l0aChcIm5vc3RyLXRvb2xzXCIpXG4gICAgICAgICAgICA6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHBsdWdpbnM6IFtcbiAgICAgICAgc3ZlbHRlKHtcbiAgICAgICAgICBwcmVwcm9jZXNzOiBzdmVsdGVQcmVwcm9jZXNzKCksXG4gICAgICAgICAgY29tcGlsZXJPcHRpb25zOiB7XG4gICAgICAgICAgICBjdXN0b21FbGVtZW50OiB0cnVlLCAgIC8vIGNvbXBpbGUgPHN2ZWx0ZTpvcHRpb25zIGN1c3RvbUVsZW1lbnQ+IHByb3Blcmx5XG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbndhcm46ICh3LCBoKSA9PiB7IGlmICghdy5jb2RlLnN0YXJ0c1dpdGgoXCJhMTF5LVwiKSkgaCh3KSB9LFxuICAgICAgICB9KSxcbiAgICAgIF0sXG4gICAgfVxuICB9XG5cbiAgY29uc3QgaWNvbnMgPSBhd2FpdCBmYXZpY29ucyhcInB1YmxpY1wiICsgcHJvY2Vzcy5lbnYuVklURV9BUFBfTE9HTylcblxuICBpZiAoIWZzLmV4aXN0c1N5bmMoXCJwdWJsaWMvaWNvbnNcIikpIGZzLm1rZGlyU3luYyhcInB1YmxpYy9pY29uc1wiKVxuXG4gIGZvciAoY29uc3Qge25hbWUsIGNvbnRlbnRzfSBvZiBpY29ucy5pbWFnZXMpIHtcbiAgICBmcy53cml0ZUZpbGVTeW5jKGBwdWJsaWMvaWNvbnMvJHtuYW1lfWAsIGNvbnRlbnRzLCBcImJpbmFyeVwiKVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIGh0dHBzOiBmYWxzZSxcbiAgICB9LFxuICAgIGJ1aWxkOiB7XG4gICAgICBzb3VyY2VtYXA6IHRydWUsXG4gICAgfSxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICBzcmM6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwic3JjXCIpLFxuICAgICAgfSxcbiAgICB9LFxuICAgIHBsdWdpbnM6IFtcbiAgICAgIGh0bWxQbHVnaW4oe1xuICAgICAgICB0aXRsZTogcHJvY2Vzcy5lbnYuVklURV9BUFBfTkFNRSxcbiAgICAgICAgbWV0YXM6IFtcbiAgICAgICAgICB7bmFtZTogXCJkZXNjcmlwdGlvblwiLCBjb250ZW50OiBwcm9jZXNzLmVudi5WSVRFX0FQUF9ERVNDUklQVElPTn0sXG4gICAgICAgICAge25hbWU6IFwidGhlbWUtY29sb3JcIiwgY29udGVudDogYWNjZW50Q29sb3J9LFxuICAgICAgICAgIHtuYW1lOiBcIm9nOnRpdGxlXCIsIGNvbnRlbnQ6IHByb2Nlc3MuZW52LlZJVEVfQVBQX05BTUV9LFxuICAgICAgICAgIHtuYW1lOiBcIm9nOnR5cGVcIiwgY29udGVudDogXCJ3ZWJzaXRlXCJ9LFxuICAgICAgICAgIHtuYW1lOiBcIm9nOmRlc2NyaXB0aW9uXCIsIGNvbnRlbnQ6IHByb2Nlc3MuZW52LlZJVEVfQVBQX0RFU0NSSVBUSU9OfSxcbiAgICAgICAgICB7bmFtZTogXCJvZzppbWFnZVwiLCBjb250ZW50OiBcIi9pbWFnZXMvYmFubmVyLnBuZ1wifSxcbiAgICAgICAgICB7bmFtZTogXCJ0d2l0dGVyOmNhcmRcIiwgY29udGVudDogXCJzdW1tYXJ5X2xhcmdlX2ltYWdlXCJ9LFxuICAgICAgICAgIHtuYW1lOiBcInR3aXR0ZXI6dGl0bGVcIiwgY29udGVudDogcHJvY2Vzcy5lbnYuVklURV9BUFBfTkFNRX0sXG4gICAgICAgICAge25hbWU6IFwidHdpdHRlcjpkZXNjcmlwdGlvblwiLCBjb250ZW50OiBwcm9jZXNzLmVudi5WSVRFX0FQUF9ERVNDUklQVElPTn0sXG4gICAgICAgICAge25hbWU6IFwidHdpdHRlcjppbWFnZVwiLCBjb250ZW50OiBcIi9pbWFnZXMvYmFubmVyLnBuZ1wifSxcbiAgICAgICAgICB7cHJvcGVydHk6IFwib2c6dXJsXCIsIGNvbnRlbnQ6IHByb2Nlc3MuZW52LlZJVEVfQVBQX1VSTH0sXG4gICAgICAgICAge25hbWU6IFwibXNhcHBsaWNhdGlvbi1UaWxlQ29sb3JcIiwgY29udGVudDogYWNjZW50Q29sb3J9LFxuICAgICAgICAgIHtuYW1lOiBcIm1zYXBwbGljYXRpb24tVGlsZUltYWdlXCIsIGNvbnRlbnQ6IFwiL2ljb25zL21zdGlsZS0xNDR4MTQ0LnBuZ1wifSxcbiAgICAgICAgXSxcbiAgICAgICAgbGlua3M6IFtcbiAgICAgICAgICB7cmVsOiBcImljb25cIiwgaHJlZjogXCIvaWNvbnMvZmF2aWNvbi5pY29cIiwgc2l6ZXM6IFwiNDh4NDhcIn0sXG4gICAgICAgICAge3JlbDogXCJpY29uXCIsIGhyZWY6IFwiL2ljb25zL2Zhdmljb24tMTZ4MTYucG5nXCIsIHNpemVzOiBcImFueVwiLCB0eXBlOiBcImltYWdlL3BuZ1wifSxcbiAgICAgICAgICB7cmVsOiBcImljb25cIiwgaHJlZjogXCIvaWNvbnMvZmF2aWNvbi0zMngzMi5wbmdcIiwgc2l6ZXM6IFwiYW55XCIsIHR5cGU6IFwiaW1hZ2UvcG5nXCJ9LFxuICAgICAgICAgIHtyZWw6IFwiaWNvblwiLCBocmVmOiBcIi9pY29ucy9mYXZpY29uLTQ4eDQ4LnBuZ1wiLCBzaXplczogXCJhbnlcIiwgdHlwZTogXCJpbWFnZS9wbmdcIn0sXG4gICAgICAgICAge3JlbDogXCJhcHBsZS10b3VjaC1pY29uXCIsIHNpemVzOiBcIjU3eDU3XCIsIGhyZWY6IFwiL2ljb25zL2FwcGxlLXRvdWNoLWljb24tNTd4NTcucG5nXCJ9LFxuICAgICAgICAgIHtyZWw6IFwiYXBwbGUtdG91Y2gtaWNvblwiLCBzaXplczogXCI2MHg2MFwiLCBocmVmOiBcIi9pY29ucy9hcHBsZS10b3VjaC1pY29uLTYweDYwLnBuZ1wifSxcbiAgICAgICAgICB7cmVsOiBcImFwcGxlLXRvdWNoLWljb25cIiwgc2l6ZXM6IFwiNzJ4NzJcIiwgaHJlZjogXCIvaWNvbnMvYXBwbGUtdG91Y2gtaWNvbi03Mng3Mi5wbmdcIn0sXG4gICAgICAgICAge3JlbDogXCJhcHBsZS10b3VjaC1pY29uXCIsIHNpemVzOiBcIjc2eDc2XCIsIGhyZWY6IFwiL2ljb25zL2FwcGxlLXRvdWNoLWljb24tNzZ4NzYucG5nXCJ9LFxuICAgICAgICAgIHtyZWw6IFwiYXBwbGUtdG91Y2gtaWNvblwiLCBzaXplczogXCIxMTR4MTE0XCIsIGhyZWY6IFwiL2ljb25zL2FwcGxlLXRvdWNoLWljb24tMTE0eDExNC5wbmdcIn0sXG4gICAgICAgICAge3JlbDogXCJhcHBsZS10b3VjaC1pY29uXCIsIHNpemVzOiBcIjEyMHgxMjBcIiwgaHJlZjogXCIvaWNvbnMvYXBwbGUtdG91Y2gtaWNvbi0xMjB4MTIwLnBuZ1wifSxcbiAgICAgICAgICB7cmVsOiBcImFwcGxlLXRvdWNoLWljb25cIiwgc2l6ZXM6IFwiMTQ0eDE0NFwiLCBocmVmOiBcIi9pY29ucy9hcHBsZS10b3VjaC1pY29uLTE0NHgxNDQucG5nXCJ9LFxuICAgICAgICAgIHtyZWw6IFwiYXBwbGUtdG91Y2gtaWNvblwiLCBzaXplczogXCIxNTJ4MTUyXCIsIGhyZWY6IFwiL2ljb25zL2FwcGxlLXRvdWNoLWljb24tMTUyeDE1Mi5wbmdcIn0sXG4gICAgICAgICAge3JlbDogXCJhcHBsZS10b3VjaC1pY29uXCIsIHNpemVzOiBcIjE4MHgxODBcIiwgaHJlZjogXCIvaWNvbnMvYXBwbGUtdG91Y2gtaWNvbi0xODB4MTgwLnBuZ1wifSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICByZWw6IFwiaWNvblwiLFxuICAgICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcbiAgICAgICAgICAgIHNpemVzOiBcIjE5MngxOTJcIixcbiAgICAgICAgICAgIGhyZWY6IFwiL2ljb25zL2FuZHJvaWQtaWNvbi0xOTJ4MTkyLnBuZ1wiLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge3JlbDogXCJpY29uXCIsIHR5cGU6IFwiaW1hZ2UvcG5nXCIsIHNpemVzOiBcIjMyeDMyXCIsIGhyZWY6IFwiL2ljb25zL2Zhdmljb24tMzJ4MzIucG5nXCJ9LFxuICAgICAgICAgIHtyZWw6IFwiaWNvblwiLCB0eXBlOiBcImltYWdlL3BuZ1wiLCBzaXplczogXCI5Nng5NlwiLCBocmVmOiBcIi9pY29ucy9mYXZpY29uLTk2eDk2LnBuZ1wifSxcbiAgICAgICAgICB7cmVsOiBcImljb25cIiwgdHlwZTogXCJpbWFnZS9wbmdcIiwgc2l6ZXM6IFwiMTZ4MTZcIiwgaHJlZjogXCIvaWNvbnMvZmF2aWNvbi0xNngxNi5wbmdcIn0sXG4gICAgICAgICAge3JlbDogXCJtYXNrLWljb25cIiwgaHJlZjogXCIvaW1hZ2VzL2xvZ28uc3ZnXCIsIGNvbG9yOiBcIiNGRkZGRkZcIn0sXG5cbiAgICAgICAgICB7XG4gICAgICAgICAgICByZWw6IFwiaWNvblwiLFxuICAgICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcbiAgICAgICAgICAgIHNpemVzOiBcIjE0NHgxNDRcIixcbiAgICAgICAgICAgIGhyZWY6IFwiL2ljb25zL2FuZHJvaWQtY2hyb21lLTE0NHgxNDQucG5nXCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICByZWw6IFwiaWNvblwiLFxuICAgICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcbiAgICAgICAgICAgIHNpemVzOiBcIjE5MngxOTJcIixcbiAgICAgICAgICAgIGhyZWY6IFwiL2ljb25zL2FuZHJvaWQtY2hyb21lLTE5MngxOTIucG5nXCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICByZWw6IFwiaWNvblwiLFxuICAgICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcbiAgICAgICAgICAgIHNpemVzOiBcIjI1NngyNTZcIixcbiAgICAgICAgICAgIGhyZWY6IFwiL2ljb25zL2FuZHJvaWQtY2hyb21lLTI1NngyNTYucG5nXCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7cmVsOiBcImljb25cIiwgdHlwZTogXCJpbWFnZS9wbmdcIiwgc2l6ZXM6IFwiMzZ4MzZcIiwgaHJlZjogXCIvaWNvbnMvYW5kcm9pZC1jaHJvbWUtMzZ4MzYucG5nXCJ9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHJlbDogXCJpY29uXCIsXG4gICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxuICAgICAgICAgICAgc2l6ZXM6IFwiMzg0eDM4NFwiLFxuICAgICAgICAgICAgaHJlZjogXCIvaWNvbnMvYW5kcm9pZC1jaHJvbWUtMzg0eDM4NC5wbmdcIixcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtyZWw6IFwiaWNvblwiLCB0eXBlOiBcImltYWdlL3BuZ1wiLCBzaXplczogXCI0OHg0OFwiLCBocmVmOiBcIi9pY29ucy9hbmRyb2lkLWNocm9tZS00OHg0OC5wbmdcIn0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgcmVsOiBcImljb25cIixcbiAgICAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXG4gICAgICAgICAgICBzaXplczogXCI1MTJ4NTEyXCIsXG4gICAgICAgICAgICBocmVmOiBcIi9pY29ucy9hbmRyb2lkLWNocm9tZS01MTJ4NTEyLnBuZ1wiLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge3JlbDogXCJpY29uXCIsIHR5cGU6IFwiaW1hZ2UvcG5nXCIsIHNpemVzOiBcIjcyeDcyXCIsIGhyZWY6IFwiL2ljb25zL2FuZHJvaWQtY2hyb21lLTcyeDcyLnBuZ1wifSxcbiAgICAgICAgICB7cmVsOiBcImljb25cIiwgdHlwZTogXCJpbWFnZS9wbmdcIiwgc2l6ZXM6IFwiOTZ4OTZcIiwgaHJlZjogXCIvaWNvbnMvYW5kcm9pZC1jaHJvbWUtOTZ4OTYucG5nXCJ9LFxuICAgICAgICBdLFxuICAgICAgfSksXG4gICAgICBWaXRlUFdBKHtcbiAgICAgICAgcmVnaXN0ZXJUeXBlOiBcImF1dG9VcGRhdGVcIixcbiAgICAgICAgaW5qZWN0UmVnaXN0ZXI6IFwiYXV0b1wiLFxuICAgICAgICB3b3JrYm94OiB7XG4gICAgICAgICAgbWF4aW11bUZpbGVTaXplVG9DYWNoZUluQnl0ZXM6IDUgKiAxMDI0ICoqIDIsIC8vIDUgTUIgb3Igc2V0IHRvIHNvbWV0aGluZyBlbHNlXG4gICAgICAgIH0sXG4gICAgICAgIG1hbmlmZXN0OiB7XG4gICAgICAgICAgbmFtZTogcHJvY2Vzcy5lbnYuVklURV9BUFBfTkFNRSxcbiAgICAgICAgICBzaG9ydF9uYW1lOiBwcm9jZXNzLmVudi5WSVRFX0FQUF9OQU1FLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiBwcm9jZXNzLmVudi5WSVRFX0FQUF9ERVNDUklQVElPTixcbiAgICAgICAgICB0aGVtZV9jb2xvcjogYWNjZW50Q29sb3IsXG4gICAgICAgICAgcHJvdG9jb2xfaGFuZGxlcnM6IFt7cHJvdG9jb2w6IFwid2ViK25vc3RyXCIsIHVybDogXCIvJXNcIn1dLFxuICAgICAgICAgIHBlcm1pc3Npb25zOiBbXCJjbGlwYm9hcmRSZWFkXCIsIFwiY2xpcGJvYXJkV3JpdGVcIiwgXCJ1bmxpbWl0ZWRTdG9yYWdlXCJdLFxuICAgICAgICAgIGljb25zOiBbXG4gICAgICAgICAgICB7c3JjOiBcImltYWdlcy9wd2EtNjR4NjQucG5nXCIsIHNpemVzOiBcIjY0eDY0XCIsIHR5cGU6IFwiaW1hZ2UvcG5nXCJ9LFxuICAgICAgICAgICAge3NyYzogXCJpbWFnZXMvcHdhLTE5MngxOTIucG5nXCIsIHNpemVzOiBcIjE5MngxOTJcIiwgdHlwZTogXCJpbWFnZS9wbmdcIn0sXG4gICAgICAgICAgICB7c3JjOiBcImltYWdlcy9wd2EtNTEyeDUxMi5wbmdcIiwgc2l6ZXM6IFwiNTEyeDUxMlwiLCB0eXBlOiBcImltYWdlL3BuZ1wiLCBwdXJwb3NlOiBcImFueVwifSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgc3JjOiBcImltYWdlcy9tYXNrYWJsZS1pY29uLTUxMng1MTIucG5nXCIsXG4gICAgICAgICAgICAgIHNpemVzOiBcIjUxMng1MTJcIixcbiAgICAgICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcbiAgICAgICAgICAgICAgcHVycG9zZTogXCJtYXNrYWJsZVwiLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgICBzdmVsdGUoe1xuICAgICAgICBwcmVwcm9jZXNzOiBzdmVsdGVQcmVwcm9jZXNzKCksXG4gICAgICAgIG9ud2FybjogKHdhcm5pbmcsIGhhbmRsZXIpID0+IHtcbiAgICAgICAgICBpZiAod2FybmluZy5jb2RlLnN0YXJ0c1dpdGgoXCJhMTF5LVwiKSkgcmV0dXJuXG4gICAgICAgICAgaWYgKHdhcm5pbmcuZmlsZW5hbWUuaW5jbHVkZXMoXCJub2RlX21vZHVsZXNcIikpIHJldHVyblxuXG4gICAgICAgICAgaGFuZGxlcih3YXJuaW5nKVxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgXSxcbiAgfVxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBOFgsT0FBTyxRQUFRO0FBQzdZLE9BQU8sWUFBWTtBQUNuQixZQUFZLFVBQVU7QUFDdEIsU0FBUSxvQkFBbUI7QUFDM0IsU0FBUSxlQUFjO0FBQ3RCLFNBQVEsZ0JBQWU7QUFDdkIsT0FBTyxnQkFBZ0I7QUFDdkIsT0FBTyxzQkFBc0I7QUFDN0IsU0FBUSxjQUFhO0FBUnJCLElBQU0sbUNBQW1DO0FBVXpDLE9BQU8sT0FBTyxFQUFDLE1BQU0sT0FBTSxDQUFDO0FBQzVCLE9BQU8sT0FBTyxFQUFDLE1BQU0sZ0JBQWUsQ0FBQztBQVNyQyxJQUFNLGdCQUFnQixRQUFRLElBQUksc0JBQXNCO0FBRXhELElBQU0sZUFBZSxRQUFRLElBQUksb0JBQW9CLElBQUksTUFBTSxlQUFlLElBQUksQ0FBQyxLQUFLO0FBRXhGLElB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
