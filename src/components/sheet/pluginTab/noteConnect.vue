<template>
  <span>
    +
  </span>
</template>

<script>
export default {
  name: "TabNoteConnect",
  props: {
    note: {
      type: Object,
      required: true,
    },
    globalConfig: {
      type: Object,
      required: true,
    }
  },
};
</script>

<style scoped>
.note {
  position: relative;
  width: 100%;
  height: 100%;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
}
.note_element {
  position: relative;
  width: 100%;
  height: 0;
  flex-shrink: 1;

  display: flex;
  justify-content: center;
  align-items: center;
}
.note_element > * {
  position: absolute;
}
.note_fret {
  display: flex;
  justify-content: center;
  align-items: center;

  font-size: var(--fret-font-size);
  width: fit-content;
  padding: 0 2px;
  height: 3px;
  /* background-color: rgb(0, 6, 40); */
  background-color: white;
}
.note_fret_empty {
  width: 12px;
}
.note_fret_stem {
  position: relative;
  height: calc(1 / (var(--string-num) - 1) * var(--row-height));
  width: 12px;
}
.note_fret_stem:after {
  position: absolute;
  content: "";
  top: 0;
  left: calc(50% - 1px);
  height: 100%;
  width: 2px;
  /* background-color: #fff; */
  background-color: black;
  border-radius: 2px;
}
.note_fret_stem[type="end"]:after {
  height: calc(50% + var(--stem-margin));
}
.note_stum {
  position: absolute;
  width: 10px;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.note_stum[direction="up"] {
  transform: scaleY(-1);
}
.note_stum svg {
  width: 100%;
}
.note_link {
  position: absolute;
  width: 100%;
  left: 50%;
  transform: translateY(-100%);

  display: flex;
  justify-content: center;
  align-items: center;
}
.note_link svg {
  width: 100%;
  height: calc(1 / (var(--string-num) - 1) * var(--row-height) * 0.4);
}

.note_link-text {
  position: absolute;
  font-size: 12px;
  transform: translateY(-100%);
}
.note_stem {
  position: absolute;
  /* background-color: #fff; */
  background-color: black;
  width: 2px;
  border-radius: 2px;
}
.note_stem[type="complete"] {
  height: 42px;
  bottom: calc(-1 * var(--stem-margin));
}
.note_stem[type="half"] {
  height: 20px;
  width: 2px;
  bottom: calc(-1 * var(--stem-margin));
}
.note_stem,
.note_stem[type="none"] {
}
.note_flag {
  position: absolute;
  width: 100%;
  bottom: calc(-1 * var(--stem-margin));
  height: calc(var(--stem-margin) - 5px);
  padding-top: 5px;

  display: flex;
  flex-direction: column-reverse;
}
.note_flag-connect {
  height: 4px;
  margin-top: 5px;
  /* background-color: #fff; */
  background-color: black;
}
.note_flag-connect,
.note_flag-connect[type="none"] {
  width: 0;
}
.note_flag-connect[type="left"] {
  width: 50%;
  align-self: flex-start;
}
.note_flag-connect[type="right"] {
  width: 50%;
  align-self: flex-end;
}
.note_flag-connect[type="both"] {
  width: 100%;
  align-self: center;
}
.note_chord {
  position: absolute;
  bottom: calc(100% + 20px);

  display: flex;
  justify-content: center;
  align-items: center;
}
.note_chord_name {
  font-size: 24px;
  /* color: white; */
  color: black;
}
.note_chord_graph {
  margin-bottom: 5px;
  height: calc(var(--row-height) * 1.5);
  width: calc(var(--row-height) * 1.5 * 0.75);
  color: black;
}
.note_stum_arrow {
  position: absolute;
  top: 0;
  transform: translateY(calc(-85% - 6px));
}

.note_stum_head {
  position: absolute;
  top: 0;
  height: 6px;
  transform: translateY(-100%);
}

.note_stum_body {
  top: 0;
  flex-grow: 1;
}

.note_stum_tail {
  position: absolute;
  bottom: 0;
  height: 10px;
  transform: translateY(100%);
}
</style>