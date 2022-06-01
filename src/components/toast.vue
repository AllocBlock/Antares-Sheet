<template>
  <transition name="trans_fade">
    <div class="toast" v-show="show">{{text}}</div>
  </transition>
</template>

<script>
export default {
  name: "Toast",
  data() {
    return {
      show: false,
      timer: null,
    }
  },
  props: {
    text: {
      type: String,
      default: "",
    },
    duration: {
      type: Number,
      default: 2,
    },
    callbackDestroy: {
      type: Function,
      default: null,
      required: true
    }
  },
  mounted() {
    this.timer = setTimeout(this.hide, this.duration * 1000)
    this.show = true
  },
  methods: {
    hide() {
      this.show = false
      if (this.callbackDestroy) {
        const fadeOutTime = 1.0;
        setTimeout(this.callbackDestroy, fadeOutTime * 1000)
      }
    }
  }
};
</script>


<style scoped lang="scss">
.toast {
  position: fixed;
  z-index: 1000;

  left: 50%;
  top: 20px;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  align-items: center;
  height: 30px;
  min-width: 60px;
  background-color: #974b4baa;
  border-radius: 25px;
  padding: 5px 30px;
  color: white;

  transition: background-color 0.2s ease-out;

  &:hover {
    background-color: #974b4bff;
  }
}

.trans_fade-enter-from, 
.trans_fade-leave-to{
	opacity: 0;
}
.trans_fade-enter-active{
	transition: opacity 0.1s;
}
.trans_fade-leave-active{
	transition: opacity 0.3s;
}
</style>
