<template>
  <div id="main">
    <div id="title" class="flex_hv_center">项目列表</div>
    <div class="flex_hv_center">
      <Button @clicked="exportProjectInfo">导出</Button>
    </div>
    <div id="project_list" class="flex">
      <ProjectCard v-for="(projectInfo, index) in projectInfos" :key="projectInfo.pid" :projectInfo="projectInfo"
        @delete="deleteProject(index)" @click="openProject(index)" class="project_card" />
      <div id="add_project_card" class="project_card flex_hv_center" @click="addProject">
        <div id="add_project_card_text">新建项目</div>
        <div id="add_project_card_icon">➕</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { gProjectManager, ProjectInfo } from '@/utils/project';
import { createDownloadTextFile } from '@/utils/common'
import addToast from '@/utils/toast';
import { parseSheet } from '@/utils/sheetParser';

import ProjectCard from "@/components/projectCard.vue";
import Button from "@/components/button.vue";

const projectInfos = ref<Array<ProjectInfo>>([])

console.log(projectInfos)
  
onMounted(() => {
  projectInfos.value = gProjectManager.getAll()
})

function addProject() {
  gProjectManager.create()
  projectInfos.value = gProjectManager.getAll()
}

function deleteProject(index) {
  gProjectManager.remove(projectInfos.value[index].pid)
  projectInfos.value = gProjectManager.getAll()
}

function openProject(index) {
  let info = projectInfos.value[index]
  let pid = info.pid
  window.location.href = `/editor?pid=${pid}`
}

function exportProjectInfo() {
  let data = JSON.stringify(projectInfos.value, null, 4)
  let fileName = 'projects.json'
  createDownloadTextFile(data, fileName)
}

</script>

<style scoped lang="scss">
#main {
  width: 100%;
  height: 100%;
}

#title {
  height: 50px;
  font-size: 30px;
}

#project_list {
  border: 2px var(--theme-color) solid;
  padding: 20px;
  box-sizing: content-box;
  flex-wrap: wrap;

  .project_card {
    width: 150px;
    margin: 10px;
  }
}

#add_project_card {
  outline: var(--theme-color) 3px dashed;
  border-radius: 10px;
  flex-direction: column;
  user-select: none;
  cursor: pointer;
  padding: 10px 20px;

  #add_project_card_text {
    font-size: 20px;
  }

  #add_project_card_icon {
    font-size: 30px;
  }
}
</style>
