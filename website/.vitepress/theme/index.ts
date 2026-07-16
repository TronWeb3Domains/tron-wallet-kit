import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import WalletTable from "./components/WalletTable.vue";
import ThemeBuilder from "./components/ThemeBuilder.vue";
import ThemeBuilderWidget from "./components/ThemeBuilderWidget.vue";
import PlaygroundWidget from "./components/PlaygroundWidget.vue";
import "./custom.css";

const theme: Theme = {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("WalletTable", WalletTable);
    app.component("ThemeBuilder", ThemeBuilder);
    app.component("ThemeBuilderWidget", ThemeBuilderWidget);
    app.component("PlaygroundWidget", PlaygroundWidget);
  },
};

export default theme;
