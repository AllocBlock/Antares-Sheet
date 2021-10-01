<template>
  <div id="main">
      <div id="center">
          <p style="color:white; font-size:60px;">欢迎来到我的小窝~</p>
          <a id="sheet_button" class="button" href="music/index.html">&gt; 曲谱 &lt;</a>
      </div>
      <div style="position:absolute; width:100%;text-align: center; bottom:0; left:0;">
          <p style="color:white; cursor: pointer;" onclick="window.open('https://beian.miit.gov.cn')">蜀ICP备2021000515号</p>
      </div>
  </div>
</template>

<script>
import { get } from "@/utils/request";

export default {
  name: "SheetList",
  mounted() {
    get("api/sheet.php", {}).then(res => {
      this.list = res.data.list
    })
  },
};
</script>

<style scoped>
a, a:link, a:visited, a:active, a:focus
{
    text-decoration: none;
}
#main
{
    width: 100%; 
    height: 100%; 
    overflow: hidden;
    display: flex;
    justify-content: center; 
    align-items: center;
}
#center
{
    width: 100%;
    height: 40%; 
    display: flex; 
    flex-direction: column;
    justify-content: center; 
    align-items: center;
}
.button
{
    transition: all 0.2s ease-out;
    cursor: pointer;
    user-select: none;
}
#sheet_button
{
    color:white;
    font-size:40px;
}
#sheet_button:hover
{
    color: rgb(255, 144, 144);
}
</style>