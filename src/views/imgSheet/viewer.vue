<template>
  <div id="main">
    <div id="song_name" class="flex_h_center">{{ title }}</div>
    <div id="img_list">
      <img v-for="url in imgs" class="img" :src="'imgs/' + url">
    </div>
  </div>
</template>

<script>
import Request from '@/utils/request'
import { getQueryVariable } from '@/utils/common'

export default {
  name: "ImgSheetList",
  data() {
    return {
      title: "加载中...",
      imgs: [],
    }
  },
  mounted() {
    let sheetName = getQueryVariable('sheet');
    Request.get("img_sheet_list.json").then((sheetInfos) => {
      sheetInfos = sheetInfos ?? [];
      let sheet = sheetInfos.find((e) => e.title == sheetName);
      if (sheet) {
        this.title = sheetName;
        this.imgs = sheet.imgs ?? [];
      }
      else {
        this.title = `未找到曲谱《${sheetName}》`;
        console.warn(`未找到曲谱《${sheetName}》`)
      }
    }).catch(e => {
        this.title = `加载曲谱《${sheetName}》时遇到错误：<br>${e}`;

    })
  },
  methods: {
  }
}
</script>

<style src="@/common.css" scoped></style>

<style scoped>
a,
a:link,
a:visited,
a:active,
a:focus {
  text-decoration: none;
}

#vue-main {
  width: 60%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

#song_name {
  padding: 20px 10px;
  color: var(--foreground-color);
  font-size: 30px;
  overflow: hidden;
}

#img_list {
  width: 100%;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}

.img {
  width: calc(100% - 20px);
  max-width: 600px;
  margin: 10px 20px;
}
</style>