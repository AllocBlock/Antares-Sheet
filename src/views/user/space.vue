<template>
  <div id="main">
    <div style="font-size:40px; margin: 20px 0;">曲谱列表</div>
    <input type="text" placeholder="搜索曲谱..." v-model="searchText" @input="onSearch"/>
    <div id="sheet-table">
      <div v-if="projectInfos.length == 0">
        未找到任何曲谱...
      </div>
      <template v-else>
        <div v-for="project in projectInfos" class="sheet_block button" @click="openProject(project)">
          <div class="sheet_name">{{ project.sheetMeta.title }}</div>
          <div class="sheet_singer">—— {{ project.sheetMeta.singer }}</div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { Project, ProjectInfo } from '@/utils/project';

export default {
  name: "UserSpace",
  data() {
    return {
      title: "加载中...",
      allProjectInfos: [],
      projectInfos: [],
      searchText: ''
    }
  },
  mounted() {
    this.allProjectInfos = Project.getAll()
    this.projectInfos = this.allProjectInfos
    console.log(this.allProjectInfos)
  },
  methods: {
    openProject(project) {
      window.location.href = `/sheet?pid=${project.pid}`
    },
    onSearch() {
      const searchText = this.searchText.toLowerCase()
      if (!searchText) this.projectInfos = this.allProjectInfos
      else {
        let priorities = this.allProjectInfos.map(project => {
          let priority = 0
          
          const title = project.sheetMeta.title.toLowerCase()
          const singer = project.sheetMeta.singer.toLowerCase()
          if (title.indexOf(searchText) > -1) {
            priority = 10000
          }
          else if (singer.indexOf(searchText) > -1) {
            priority = 8000
          }
          else {
            // 模糊搜索
            for (let char in searchText) {
              if (title.indexOf(char) > -1) priority++;
              if (singer.indexOf(char) > -1) priority++;
            }
          }
          return priority
        })

        let packed = []
        for (let i = 0; i < priorities.length; ++i) {
          if (priorities[i] > 0) {
            packed.push([this.allProjectInfos[i], priorities[i]])
          }
        }

        packed.sort((a, b) => a[1] > b[1])
        
        this.projectInfos = packed.map(e => e[0])
      }
    }
  }
}
</script>

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
  color: var(--theme-color);
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

.sheet_block {
  height: 60px;
  padding: 10px 20px;
  margin: 10px 20px;

  border-radius: 20px;
  border: 2px var(--theme-color) solid;
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
  font-size: 16px;
  text-align: right;
  overflow: hidden;
}
</style>