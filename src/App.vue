<template>
  <div id="app_top">
    <router-view />
  </div>
</template>

<script>
import { DefaultBrightTheme, DefaultDarkTheme } from "@/utils/theme"
import { setEnv } from "@/utils/common"

export default {
  name: "App",
  mounted() {
    // 检查平台，切换PC/移动端模式
    if (document.body.clientWidth / document.body.clientHeight < 0.8) {
      // 竖屏
      setEnv("mobile");
    } else {
      setEnv("pc");
    }
  },
  data() {
    return {
      // theme: DefaultDarkTheme,
      theme: DefaultBrightTheme,
    }
  },
}
</script>

<style src="./common.css"></style>

<style>
/* top wrapper */
#app_top {
  min-height: 100vh;
  min-width: 100vw;
  background: v-bind('theme.backgroundColor');
  color: v-bind('theme.foregroundColor');
  --background-color: v-bind('theme.backgroundColor');
  --foreground-color: v-bind('theme.foregroundColor');
  --theme-color: v-bind('theme.themeColor');
  --theme-color-rgb: v-bind('theme.themeColorRgb');
}

html,
body {
  width: 100%;
  margin: 0;
  padding: 0;
}

::selection {
  background: var(--theme-color);
}

a,
a:link,
a:visited,
a:active,
a:focus {
  text-decoration: none;
}

*::-webkit-scrollbar {
  background-color: rgba(221, 221, 221, 0.3);
  width: 10px;
}

*::-webkit-scrollbar-thumb {
  background-color: rgba(224, 224, 224, 0.8);
  animation: all 0.3s ease-out;
  border-radius: 5px;
}

*::-webkit-scrollbar-thumb:hover {
  background-color: rgba(var(--theme-color-rgb), 0.8);
}
</style>
