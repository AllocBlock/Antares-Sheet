<template>
  <div id="main" class="flex_hv_center">
    <template v-if="isLogged == null">
      <div id="title" class="flex_hv_center">加载中...</div>
    </template>
    <template v-else-if="isLogged == true">
      <div id="title" class="flex_hv_center" style="font-size: 50px;">欢迎！「{{ this.userName }}」</div>
      <div id="subtitle" class="flex_hv_center">你已登录，可以同步和发布曲谱了</div>
      <div class="flex_hv_center">
        <div id="normal_button" class="button" @click="gotoStartPage">转到主页</div>
        <div id="normal_button" class="button" @click="logout">退出登录</div>
      </div>
    </template>
    <template v-else="isLogged == true">
      <div id="title" class="flex_hv_center">登录</div>
      <div id="subtitle" class="flex_hv_center">登录以同步和发布曲谱</div>
      <div class="flex input_field">
        用户名
        <input type="text" v-model="userName">
      </div>
      <div class="flex input_field">
        密码
        <input type="password" v-model="password">
      </div>
      <div id="register_button" class="button" @click="login">登录/注册</div>
    </template>
  </div>
</template>

<script>
import Sync from '@/utils/sync'
import addToast from '@/utils/toast';

export default {
  name: "UserLogin",
  data() {
    return {
      userName: "",
      password: "",
      isLogging: false,
      isLogged: null
    };
  },
  computed: {
    loginButtonColor() {
      return this.isLogging ?  'grey' : 'var(--theme-color)'
    }
  },
  mounted() {
    this.validate()
  },
  methods: {
    validate() {
      Sync.validateUser().then(result => {
        this.isLogged = result.success
        if (result.success) {
          this.userName = result.data.name
        }
      })
    },
    login() {
      if (!this.userName) {
        addToast("请输入用户名")
        return
      }
      if (!this.password) {
        addToast("请输入密码")
        return
      }

      if (this.isLogging) return;
      
      this.isLogging = true
      Sync.login(this.userName, this.password).then(result => {
        addToast(result.message, 5)
        if (result.success) {
          this.isLogged = true
        }

      }).finally(() => {
        this.isLogging = false
      })
    },
    logout() {
      Sync.logout()
      this.isLogged = false
    },
    gotoStartPage() {
      window.location.href = `/`
    }
  },
};
</script>

<style scoped lang="scss">
#main {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(to top right, #89e0ff, #ff42ba);
  flex-direction: column;
}

#title {
  font-size: 100px;
  color: white;
  margin: 5px;
  font-family: "得意黑", SmileySans;
  letter-spacing: 20px;
  text-shadow: white 1px 0 2px;
}

#subtitle {
  font-size: 20px;
  color: white;
  margin: 5px;
}

#register_button {
  background: v-bind(loginButtonColor);
  color: white;
}

#normal_button {
  background: var(--theme-color);
  color: white;
}

.input_field {
  color: white;
  margin: 5px;
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
</style>
