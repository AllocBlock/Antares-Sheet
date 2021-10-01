<template>
  <span class="time_signature">
    <div>{{ tapPerBar }}</div>
    <div>{{ notePerTap }}</div>
  </span>
</template>

<script>
export default {
  name: "TabTimeSignature",
  data() {
    return {
      tapPerBar: 4,
      notePerTap: 4,
    }
  },
  props: {
    timeSignature: {
      type: String,
      required: true,
    },
  },
  created() {
    [this.tapPerBar, this.notePerTap] = this.parseTimeSignature()
  },
  methods: {
    parseTimeSignature() {
      let timeSignatureStr = this.timeSignature
      if (!timeSignatureStr) return null
      const reTimeSignature = /(\d+)\/(\d+)/
      let res = timeSignatureStr.match(reTimeSignature)
      if (!res) throw `指法谱：拍号配置项有误[ts:{timeSignature}]`
      return [parseInt(res[1]), parseInt(res[2])]
    },
  }
};
</script>

<style scoped>
.time_signature {
  font-family: MusicNotation, Arial, Helvetica, sans-serif;
  margin: 0 8px;
  width: 30px;
  height: 80%;

  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
}
.time_signature div {
  display: flex;
  justify-content: center;
  align-items: center;

  width: 100%;
  height: 0;
  flex-shrink: 1;
  font-size: 30px;
}
</style>