import { fileURLToPath } from "node:url";

const config = {
  plugins: {
    // Tailwind 从 src 扫描源码；根级 i18n 仅包含协议与文案，不含样式。
    "@tailwindcss/postcss": { base: fileURLToPath(new URL("./src", import.meta.url)) }
  }
};

export default config;
