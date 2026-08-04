import type { Config } from "tailwindcss";

export default {
  content: [
    "./app.vue",
    "./components/**/*.{vue,js,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./server/**/*.{js,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
