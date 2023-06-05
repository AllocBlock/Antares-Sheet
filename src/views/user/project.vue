<template>
  <div id="main">
    <div id="title" class="flex_hv_center">项目列表</div>
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
import Storage from "@/utils/storage.js";
import { generateRandomCode } from "@/utils/random.js"
import { ProjectInfo } from '@/utils/project';

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
    let projectInfos = JSON.parse(Storage.load("project")) ?? []
    this.projectInfos = projectInfos
    console.log(this.projectInfos)
  },
  methods: {
    addProject() {
      // generate project id
      let pid = generateRandomCode(8)
      do {
        let existed = false
        for (let projectInfo in this.projectInfos) {
          if (projectInfo.pid == pid) {
            existed = true;
            break;
          }
        }
        if (existed) pid = generateRandomCode(8);
        else break;
      } while (true);

      // add new project
      let projectInfo = new ProjectInfo(pid, "未命名项目")
      this.projectInfos.push(projectInfo)

      // save changes to storage
      this.saveProjectInfo()
    },
    deleteProject(index) {
      this.projectInfos.splice(index, 1)
      this.saveProjectInfo()
    },
    openProject(index) {
      let info = this.projectInfos[index]
      let pid = info.pid
      window.location.href = `/editor?pid=${pid}`
    },
    saveProjectInfo() {
      Storage.save("project", JSON.stringify(this.projectInfos)) ?? []
    },
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

#project_list {
  border: 2px var(--theme-color) solid;
  padding: 20px;
  box-sizing: content-box;
  flex-wrap: wrap;

  .project_card {
    width: 100px;
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
