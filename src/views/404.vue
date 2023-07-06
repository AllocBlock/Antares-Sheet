<template>
  <div id="main">
    <div id="title">星河曲谱</div>
    <div id="sub_title">未找到该页面</div>
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
</style>
