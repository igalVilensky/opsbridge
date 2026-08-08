import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss"],
  css: ["~/assets/css/tailwind.css"],
  app: {
    head: {
      title: "OpsBridge",
      link: [
        {
          rel: "icon",
          type: "image/svg+xml",
          href: "/agorando-favicon.svg",
        },
      ],
    },
  },
  runtimeConfig: {
    groqApiKey: "",
    groqModel: "openai/gpt-oss-20b",
  },
  experimental: {
    appManifest: false,
  },
});
