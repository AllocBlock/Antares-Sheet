<template>
  <div id="main">
    <div id="title">星河曲谱</div>
    <div id="sub_title">- 和弦谱查看与编辑 -</div>
    <div id="button_list" class="flex">
      <router-link class="button" to="/sheet?sheet=诺亚方舟">查看曲谱Demo</router-link>
      <router-link class="button" to="/user/space">曲谱列表</router-link>
      <router-link class="button" to="/user/project">曲谱编辑器</router-link>

      <a href="https://github.com/AllocBlock/AntaresSheet">
        <img src="/icons/github-mark-white.svg" id="github_mark"/>
      </a>
    </div>
  </div>
</template>

<style scoped lang="scss">

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
