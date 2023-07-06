<template>
  <div id="main">
    <div style="font-size:40px; margin: 20px 0;">曲谱列表</div>
    <input type="text" placeholder="搜索曲谱..." v-model="searchText" @input="onSearch" />
    <div id="sheet-table">
      <div id="sheet-not-found" class="flex_hv_center" v-if="projects.length == 0">
        {{ isLoading ? "加载中" : "未找到任何曲谱..." }}
      </div>
      <template v-else>
        <div v-for="project in projects" class="sheet_block button" @click="openProject(project)">
          <div class="sheet_name">{{ project.title }}</div>
          <div class="sheet_singer">—— {{ project.singer }}</div>
          <div class="sheet_author">制谱： {{ project.by }}</div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import Sync from '@/utils/sync';

class ProjectMeta {
  pid: string
  title: string
  singer: string

  constructor(pid: string, title: string, singer: string, by: string) {
    this.pid = pid
    this.title = title
    this.singer = singer
    this.by = by
  }
}

const isLoading = ref(true)
const allProjects = reactive([])
const projects = reactive([])
const searchText = ref('')

onMounted(() => {
  Sync.get_public_projects().then(result => {
    allProjects.length = []
    for (let project of result.data.projects) {
      allProjects.push(new ProjectMeta(project.pid, project.title, project.singer, project.by))
    }
    console.log(allProjects )
    projects.push(...allProjects)
    isLoading.value = false
  })
})

function openProject(project) {
  window.location.href = `/sheet?pid=${project.pid}`
}

function onSearch() {
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

    packed.sort((a, b) => a[1] - b[1])

    this.projectInfos = packed.map(e => e[0])
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
  color: var(--theme-color);

  border-radius: 20px;
  border: 2px var(--theme-color) solid;
  overflow: hidden;
}

.sheet_block:hover {
  background-color: rgba(var(--theme-color-rgb), 0.2);
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
.sheet_author {
  font-size: 10px;
  text-align: center;
  overflow: hidden;
  opacity: 0.8;
}
</style>