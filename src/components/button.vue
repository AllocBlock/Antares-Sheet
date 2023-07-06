<template>
  <div :class="buttonClasses" @click="onClick">
    <slot></slot>
    <Transition name="fade">
      <div v-if="loading" class="loading"></div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, defineEmits, ref } from "vue"

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  },
  loading:  {
    type: Boolean,
    default: false
  },
})

const emit = defineEmits(['clicked'])

const buttonClasses = computed(() => {
  let classes = ['button', 'flex_hv_center']
  if (props.disabled)
    classes.push('disabled_button');
  else
    classes.push('standard_button');
  return classes.join(' ')
})

function onClick() {
  if (props.disabled) return;
  emit('clicked')
}

</script>

<style scoped lang="scss">
.button {
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

  transition: background 0.2s ease-out, all 0.2s ease-out;

  &:active {
    transform: scale(0.98);
    box-shadow: 0px 0px 2px 2px rgba(0, 0, 0, 0.24);
  }
}
.standard_button {
  background: #e9266a;
  color: white;

  &:hover {
    background: #e15e8c;
  }
}

.disabled_button {
  background: rgb(135, 135, 135);
  color: white;
}

.loading {
  position: relative;
  margin-left: 4px;
  width: 14px;
  height: 14px;
  border: 2px solid #000;
  border-top-color: rgba(0, 0, 0, 0.2);
  border-right-color: rgba(0, 0, 0, 0.2);
  border-bottom-color: rgba(0, 0, 0, 0.2);
  border-radius: 100%;

  animation: circle infinite 0.75s linear;
}

@keyframes circle {
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(360deg);
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease-out, width 0.2s ease-out, height 0.2s ease-out, margin-left 0.2s ease-out;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0.0;
  width: 0px;
  height: 0px;
  margin-left: 0px;
}
</style>
