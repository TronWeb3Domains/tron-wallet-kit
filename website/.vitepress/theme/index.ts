import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import WalletTable from "./components/WalletTable.vue";
import ThemeBuilder from "./components/ThemeBuilder.vue";
import "./custom.css";

const theme: Theme = {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("WalletTable", WalletTable);
    app.component("ThemeBuilder", ThemeBuilder);
  },
};

export default theme;
