<template>
  <div id="main">
    <div style="font-size:40px; margin: 20px 0;">曲谱列表</div>
    <input type="text" placeholder="搜索曲谱..." v-model="searchText" @input="onSearch"/>
    <div id="sheet-table">
      <div id="sheet-not-found" class="flex_hv_center" v-if="sheetInfos.length == 0">
        未找到任何曲谱...
      </div>
      <template v-else>
        <div v-for="sheetInfo in sheetInfos" class="sheet_block button" @click="openSheet(sheetInfo)">
          <div class="sheet_name">{{ sheetInfo.title }}</div>
          <div class="sheet_singer">—— {{ sheetInfo.singer }}</div>
          <div class="sheet_type">{{ sheetInfo.type }}</div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import Request from '@/utils/request'

export default {
  name: "ImgSheetList",
  data() {
    return {
      allSheetInfos: [],
      sheetInfos: [],
      searchText: ''
    }
  },
  mounted() {
    Request.get("img_sheet_list.json").then((data)=>{
        this.allSheetInfos = data ? data : [];
        this.sheetInfos = this.allSheetInfos
    })
  },
  methods: {
    openSheet(sheetInfo) {
      this.$router.push(`./imgSheet?sheet=${sheetInfo.title}`)
    },
    onSearch() {
      const searchText = this.searchText.toLowerCase()
      if (!searchText) this.sheetInfos = this.allSheetInfos
      else {
        let priorities = this.allSheetInfos.map(sheetInfo => {
          let priority = 0
          
          const title = sheetInfo.title.toLowerCase()
          const singer = sheetInfo.singer.toLowerCase()
          const type = sheetInfo.type.toLowerCase()
          if (title.indexOf(searchText) > -1) {
            priority = 10000
          }
          else if (singer.indexOf(searchText) > -1) {
            priority = 8000
          }
          else if (type.indexOf(searchText) > -1) {
            priority = 6000
          }
          else {
            // 模糊搜索
            for (let char in searchText) {
              if (title.indexOf(char) > -1) priority++;
              if (singer.indexOf(char) > -1) priority++;
              if (type.indexOf(char) > -1) priority++;
            }
          }
          return priority
        })

        let packed = []
        for (let i = 0; i < priorities.length; ++i) {
          if (priorities[i] > 0) {
            packed.push([this.allSheetInfos[i], priorities[i]])
          }
        }

        packed.sort((a, b) => a[1] > b[1])
        
        this.sheetInfos = packed.map(e => e[0])
      }
    }
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

#main {
  padding: 0 10vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.button {
  transition: all 0.2s ease-out;
  cursor: pointer;
  user-select: none;
}

#sheet-table {
  width: 100%;
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
}
#sheet-not-found {
  width: 100%;
  padding: 10px 0;
}

.sheet_block {
  padding: 10px 20px;
  margin: 10px 20px;

  border-radius: 20px;
  border: 2px var(--foreground-color) solid;
  overflow: hidden;
}

.sheet_block:hover {
  background-color: rgba(243, 110, 163, 0.2);
}

.sheet_block[type=digital] {
  color: rgb(122, 236, 236);
}

.sheet_name {
  font-size: 30px;
  overflow: hidden;
}

.sheet_singer {
  font-size: 20px;
  text-align: right;
  overflow: hidden;
}

.sheet_type {
  font-size: 14px;
  overflow: hidden;
  color: grey;
}
</style>