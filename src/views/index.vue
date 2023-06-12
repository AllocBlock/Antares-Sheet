<template>
  <div id="main">
    <div id="title">星河曲谱</div>
    <div id="sub_title">- 和弦谱查看与编辑 -</div>
    <div id="button_list" class="flex">
      <router-link class="button" to="/user/space">曲谱列表</router-link>

      <a href="https://github.com/AllocBlock/AntaresSheet">
        <img src="/icons/github-mark-white.svg" id="github_mark"/>
      </a>
      
    </div>
    <div style="position:absolute; width:100%;text-align: center; bottom:0; left:0;">
        <p style="color:white; cursor: pointer;" onclick="window.open('https://beian.miit.gov.cn')">蜀ICP备2021000515号-2</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

#main {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(to top right, #89e0ff, #ff42ba);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  user-select: none;
}

@font-face {
    font-family: SmileySans;
    src: url(./fonts/SmileySans-Oblique.otf);
}

#title {
  font-size: 10vw;
  color: white;
  font-family: "得意黑", SmileySans;
  letter-spacing: 20px;
  text-shadow: white 1px 0 2px;
}

#sub_title {
  font-size: 20px;
  color: white;
}

#button_list {
  margin-top: 30px;
  justify-content: space-around;
  align-items: center;
  flex-wrap: wrap;
}

.button {
  color: white;
  background: var(--theme-color);
  border-radius: 5px;
  padding: 10px 20px;
  transition: background 0.2s ease-out;
  font-size: 28px;
  margin: 10px;

  &:hover {
    background: #ff689d;
  }
}

#github_mark {
  width: 100px;
  height: 100px;
  user-select: none;
  cursor: pointer;
}
</style>
