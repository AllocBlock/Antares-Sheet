<template>
  <div>
    <select title="选择调式" :value="value.toString()" @change="onChange">
      <option disabled value="">请选择</option>
      <option value="C">C</option>
      <option value="#C">♯C</option>
      <option value="bD">♭D</option>
      <option value="D">D</option>
      <option value="#D">♯D</option>
      <option value="bE">♭E</option>
      <option value="E">E</option>
      <option value="F">F</option>
      <option value="#F">♯F</option>
      <option value="bG">♭G</option>
      <option value="G">G</option>
      <option value="#G">♯G</option>
      <option value="bA">♭A</option>
      <option value="A">A</option>
      <option value="#A">♯A</option>
      <option value="bB">♭B</option>
      <option value="B">B</option>
    </select>
  </div>
</template>

<script lang="ts">
import { Key } from '@/utils/chord';

export default {
  name: "KeySelector",
  props: {
    value: {
      type: Key,
      required: true
    }
  },
  methods: {
    onChange(event : Event) {
      let newKey = Key.createFromString((event.target as HTMLInputElement).value)
      this.$emit("update:value", newKey)
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
</style>