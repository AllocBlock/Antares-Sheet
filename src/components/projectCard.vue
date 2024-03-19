<template>
  <div class="project_card">
    <div class="project_card_title">{{projectInfo.sheetMeta.title}}</div>
    <div class="project_card_singer">{{projectInfo.sheetMeta.singer}}</div>
    <div class="project_card_create_time">创建：{{timestampToString(projectInfo.createTime)}}</div>
    <div class="project_card_update_time">更新：{{timestampToString(projectInfo.updateTime)}}</div>
    <div class="project_card_pid">{{projectInfo.pid}}</div>
    <div class="project_card_delete flex_hv_center" @click.stop="deleteProject">×</div>
  </div>
</template>

<script>
import { ProjectInfo } from "@/utils/project"

export default {
  name: "ProjectCard",
  props: {
    projectInfo: {
      type: ProjectInfo,
      required: true,
    },
  },
  methods: {
    timestampToString(tick) {
      let timestamp = new Date(tick)
      return timestamp.toLocaleDateString() + " " + timestamp.toLocaleTimeString()
    },
    deleteProject() {
      if (confirm(`确定要删除项目「${this.projectInfo.sheetMeta.title}」吗？删除后无法恢复！`))
        this.$emit("delete")
    }
  }
};
</script>

<style scoped lang="scss">
.project_card {
  position: relative;
  background: var(--theme-color);
  border-radius: 20px;
  padding: 10px 30px 10px 20px;
  display: flex;
  flex-direction: column;
  user-select: none;
  cursor: pointer;

  .project_card_title {
    color: var(--background-color);
    font-size: 20px;
    width: 100%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .project_card_singer {
    color: var(--background-color);
    font-size: 12px;
  }
  .project_card_create_time, .project_card_update_time {
    color: rgba(var(--background-color-rgb), 0.5);
    font-size: 10px;
  }
  .project_card_pid {
    color: grey;
    font-size: 10px;
  }
  .project_card_delete {
    width: 30px;
    height: 30px;
    color: white;
    position: absolute;
    font-size: 30px;
    right: 4px;
    top: 4px;
    transform: rotate(0deg) scale(1.0);

    transition: transform 0.3s ease-out;

    &:hover {
      transform: rotate(15deg) scale(1.2);;
    }
  }
}
</style>
