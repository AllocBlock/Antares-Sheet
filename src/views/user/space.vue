<template>
  <div id="main">
    <p style="font-size:40px;">曲谱们</p>
    <div id="sheet-table">
      <div v-for="project in projectInfos" class="sheet_block button" @click="openProject(project)">
        <div class="sheet_name">{{ project.sheetMeta.title }}</div>
        <div class="sheet_singer">- {{ project.sheetMeta.singer }}</div>
      </div>
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
      projectInfos: [],
    }
  },
  mounted() {
    this.projectInfos = Project.getAll()
    console.log(this.projectInfos)
  },
  methods: {
    openProject(project) {
      window.location.href = `/sheet?pid=${project.pid}`
    },
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
  width: 60%;
  padding: 0 20%;
  max-width: 600px;
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
}

.sheet_block {
  width: calc(100% - 20px);
  height: 60px;
  padding: 10px;
  margin: 10px 0;

  border-radius: 20px;
  border: 2px var(--theme-color) solid;
  overflow: hidden;
}

.sheet_block:hover {
  background-color: rgba(255, 255, 255, 0.2);
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