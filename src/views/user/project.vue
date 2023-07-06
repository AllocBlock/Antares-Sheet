<template>
  <div id="main">
    <div id="title" class="flex_hv_center">项目列表</div>
    <div class="flex_hv_center">
      <Button @clicked="exportProjectInfo">导出</Button>
      <Button v-if="userStore.isLogged" @clicked="sync" :disabled="isSyncing" :loading="isSyncing">同步</Button>
    </div>
    <div id="project_list" class="flex">
      <ProjectCard v-for="(projectInfo, index) in projectInfos" :key="projectInfo.id" :projectInfo="projectInfo"
        @delete="deleteProject(index)" @click="openProject(index)" class="project_card" />
      <div id="add_project_card" class="project_card flex_hv_center" @click="addProject">
        <div id="add_project_card_text">新建项目</div>
        <div id="add_project_card_icon">➕</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { gProjectManager, ProjectInfo } from '@/utils/project';
import Sync from '@/utils/sync';
import { createDownloadTextFile } from '@/utils/common'
import useUserStore from '@/store/user'
import addToast from '@/utils/toast';
import { parseSheet } from '@/utils/sheetParser';

import ProjectCard from "@/components/projectCard.vue";
import Button from "@/components/button.vue";

const userStore = useUserStore()
const projectInfos = ref([])
const isSyncing = ref(false)

onMounted(() => {
  console.log(userStore)
  projectInfos.value = gProjectManager.getAll()
})

function addProject() {
  gProjectManager.create()
  projectInfos.value = gProjectManager.getAll()
}

function deleteProject(index) {
  gProjectManager.remove(this.projectInfos.value[index].pid)
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

function sync() {
  if (isSyncing.value) return;
  isSyncing.value = true
  Sync.get_owned_project()
  .then(result => {
    console.log(result)
    if (!result.success) {
      addToast(result.message)
      return
    }
    for (let project of result.data.projects) {
      if (gProjectManager.has(project.pid)) {
        let projectInfo = gProjectManager.get(project.pid)
        if (project.updateTime > projectInfo.updateTime) {
          let sheetMeta, _ = parseSheet(project.sheet)
          gProjectManager.set(project.pid, sheetMeta, project.sheet, project.sync, project.isPublic)
        }
      } else {
        let newProjectInfo = ProjectInfo()
        newProjectInfo.pid = project.pid
        newProjectInfo.createTime = project.createTime
        newProjectInfo.updateTime = project.updateTime
        let sheetMeta, _ = parseSheet(project.sheet)
        newProjectInfo.sheetMeta = sheetMeta
        newProjectInfo.sheetData = project.sheet
        gProjectManager.add(newProjectInfo)
      }
    }
    addToast("已同步！")
  })
  .finally(() => {
    projectInfos.value = gProjectManager.getAll()
    isSyncing.value = false
  })
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
