<template>
  <div class="focusable_container"
    tabindex="0"
    @focus="updateFocusState(true)" 
    @blur="updateFocusState(false)" 
    :focused="this.isFocused"
  >
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: "Focusable",
  props: {
    isFocused: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    updateFocusState(state) {
      this.$emit("update:isFocused", state)
    },
  }
};

</script>

<style scoped lang="scss">
.focusable_container {
  transition: opacity 0.3s ease-out;

  &[focused=true] {
    opacity: 1.0;
  }
  &[focused=false] {
    opacity: 0.8;
    &:hover {
      opacity: 0.9;
    }
  }
}
</style>