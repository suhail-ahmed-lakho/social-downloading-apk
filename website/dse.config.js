import { defineConfig } from "design-system-enforcer";

export default defineConfig({
  preset: "recommended",
  targetDir: "app",
  include: ["**/*.{tsx,jsx,ts,js}"],
  exclude: [
    "**/node_modules/**",
    "**/.next/**",
    "**/public/**",
    "**/.git/**",
    "**/dist/**",
  ],
  components: {
    disallowRawHtml: {},
    requiredInventory: [],
  },
  rules: {
    "no-raw-html-elements": "off",
    "component-inventory-active": "off",
    "no-raw-hex-colors": "off",
    "no-text-arrows": "warn",
    "no-backdrop-blur": "off",
    "no-uppercase-text": "off",
    "font-size-min": "warn",
    "font-size-max": "warn",
    "font-weight-max": "warn",
  },
});
