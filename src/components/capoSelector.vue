<template>
  <div class="flex_hv_center">
    <div class="title">
      <slot></slot>
    </div>
    <select title="选择变调夹位置" :value="value" @change="onChange">
      <option value="0">无</option>
      <option value="1">1品</option>
      <option value="2">2品</option>
      <option value="3">3品</option>
      <option value="4">4品</option>
      <option value="5">5品</option>
      <option value="6">6品</option>
      <option value="7">7品</option>
      <option value="8">8品</option>
      <option value="9">9品</option>
      <option value="10">10品</option>
      <option value="11">11品</option>
      <option value="12">12品</option>
      <option value="13">13品</option>
      <option value="14">14品</option>
      <option value="15">15品</option>
      <option value="16">16品</option>
    </select>
  </div>
</template>

<script lang="ts">
export default {
  name: "CapoSelector",
  props: {
    value: {
      type: Number,
      default: 0,
    }
  },
  methods: {
    onChange(e : InputEvent) {
      const v = parseInt((e.target as HTMLInputElement).value)
      this.$emit("update:value", v)
    }
  }
};

</script>

<style scoped>
select {
  width: 100%;
  height: 100%;
  font-size: inherit;
}

.title {
  white-space: nowrap;
  margin-right: 5px;
}
</style>