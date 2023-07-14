<template>
  <span class="clef">
    <div>T</div>
    <div>A</div>
    <div>B</div>
  </span>
</template>

<style scoped>
.clef {
  margin: 0 4px;
  width: 20px;
  height: 90%;

  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
}
.clef div {
  display: flex;
  justify-content: center;
  align-items: center;

  width: 100%;
  height: 0;
  flex-shrink: 1;
  font-size: 16px;
}
</style>