import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss"],
  css: ["~/assets/css/tailwind.css"],
  runtimeConfig: {
    groqApiKey: "",
    groqModel: "openai/gpt-oss-20b",
  },
  experimental: {
    appManifest: false,
  },
});
