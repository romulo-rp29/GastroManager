export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    "../components/**/*.{js,ts,jsx,tsx}", // se tiver pasta fora de client
  ],
  theme: { extend: {} },
  plugins: [],
} satisfies import("tailwindcss").Config;
