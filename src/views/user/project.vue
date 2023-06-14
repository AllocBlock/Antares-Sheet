<template>
  <div id="main">
    <div id="title" class="flex_hv_center">项目列表</div>
    <div class="flex_hv_center">
      <div class="button" @click="exportProjectInfo">导出</div>
    </div>
    <div id="project_list" class="flex">
      <ProjectCard v-for="(projectInfo, index) in projectInfos" :key="projectInfo.id" 
        :projectInfo="projectInfo" 
        @delete="deleteProject(index)"
        @click="openProject(index)"
        class="project_card" 
      />
      <div id="add_project_card" class="project_card flex_hv_center" @click="addProject">
        <div id="add_project_card_text">新建项目</div>
        <div id="add_project_card_icon">➕</div>
      </div>
    </div>
  </div>
</template>

<script>
import ProjectCard from "@/components/projectCard.vue";
import { Project, ProjectInfo } from '@/utils/project';
import { createDownloadTextFile } from '@/utils/common'

export default {
  name: "UserProject",
  components: {
    ProjectCard
  },
  data() {
    return {
      projectInfos: [],
    };
  },
  mounted() {
    this.projectInfos = Project.getAll()
  },
  methods: {
    addProject() {
      Project.create()
      this.projectInfos = Project.getAll()
    },
    deleteProject(index) {
      Project.remove(this.projectInfos[index].pid)
      this.projectInfos = Project.getAll()
    },
    openProject(index) {
      let info = this.projectInfos[index]
      let pid = info.pid
      window.location.href = `/editor?pid=${pid}`
    },
    exportProjectInfo() {
      let data = JSON.stringify(this.projectInfos, null, 4)
      let fileName = 'projects.json'
      createDownloadTextFile(data, fileName)
    }
  },
};
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

.button {
  background: rgb(184, 184, 184);
  color: black;
  padding: 10px 20px;
  margin: 10px 20px;
  border-radius: 20px;
  align-self: center;
  user-select: none;
  cursor: pointer;

  display: flex;
  justify-content: center;
  align-items: center;

  white-space: nowrap;
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
