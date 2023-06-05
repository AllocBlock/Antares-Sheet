<template>
  <div class="project_card">
    <div class="project_card_title">{{projectInfo.title}}</div>
    <div class="project_card_song_title">{{projectInfo.sheetMeta.title}}</div>
    <div class="project_card_song_singer">{{projectInfo.sheetMeta.singer}}</div>
    <div class="project_card_create_time">{{timestampToString(projectInfo.createTime)}}</div>
    <div class="project_card_update_time">{{timestampToString(projectInfo.updateTime)}}</div>
    <div class="project_card_pid">{{projectInfo.pid}}</div>
    <div class="project_card_delete flex_hv_center" @click="deleteProject">×</div>
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
  padding: 10px 20px;
  display: flex;
  flex-direction: column;
  user-select: none;
  cursor: pointer;

  .project_card_title {
    color: white;
    font-size: 20px;
    width: 100%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .project_card_song_title {
    color: white;
    font-size: 14px;
  }
  .project_card_song_singer {
    color: grey;
    font-size: 12px;
  }
  .project_card_create_time, .project_card_update_time {
    color: black;
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
    right: 8px;
    bottom: 0px;
    transform: rotate(0deg) scale(1.0);

    transition: transform 0.3s ease-out;

    &:hover {
      transform: rotate(15deg) scale(1.2);;
    }
  }
}
</style>
