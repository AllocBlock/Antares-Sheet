<template>
  <div id="chord_panel" class="panel" :env="getEnv()" v-if="show">
    <div id="chord_container">
      <div id="attached_block">
        <div class="title">已选择的和弦</div>
        <div
          v-if="localAttachedChords.length == 0"
          class="chord_list_empty flex_center"
        >
          暂未添加任何和弦
        </div>
        <div
          id="attached_chord_list"
          :style="
            'display: ' + (localAttachedChords.length == 0 ? 'none' : 'flex')
          "
        >
          <Chord
            v-for="(chord, index) in localAttachedChords"
            :key="chord.name ?? chord ?? index"
            :chord="typeof(chord) == 'string' ? null : chord"
            :placeholder="typeof(chord) == 'string' ? chord : chord.name"
            :styles="chordStyle"
            class="prefab_chord chord_drag_sort"
            :type="index == _DraggingChordIndex ? 'fake' : ''"
            @mousedown="dragSortStart($event, index)"
            @touchstart="dragSortStart($event, index)"
            @mouseover="dragSortOver(index)"
          />
        </div>
        <div
          id="attached_chord_trashcan"
          class="flex_center"
          @click="clickTrashcan"
          @mouseup="dropTrashcan"
          @touchend="dropTrashcan"
        >
          🗑️
        </div>
        <div class="flex_center">
          <div class="button" @click="finish">完成</div>
          <div class="button" @click="cancel">取消</div>
        </div>
      </div>
      <div class="v_split"></div>
      <div id="library_block">
        <div class="title">推荐和弦</div>
        <div id="recommend_chord_list">
          <div v-if="recommendChords.length == 0" class="flex_center">
            暂无推荐和弦
          </div>
          <div
            v-for="type in recommendChords"
            :key="type.title"
            class="flex_center"
          >
            <div class="recommend_type flex_center">
              {{ type.title }}
            </div>
            <div class="recommend_sub_list">
              <Chord
                v-for="(chord, index) in type.list"
                :key="chord.name ?? chord ?? index"
                :chord="typeof(chord) == 'string' ? null : chord"
                :placeholder="typeof(chord) == 'string' ? chord : chord.name"
                :class="
                  'prefab_chord ' +
                  (isAttached(chord) ? 'chord_already_attached' : 'chord_add')
                "
                :styles="chordStyle"
                @click="addAttachedChord(chord)"
              />
            </div>
          </div>
        </div>
        <div class="flex_center">
          <div class="title">搜索和弦</div>
          <input
            type="text"
            id="search_text_input"
            class="title"
            v-model="searchText"
            placeholder="输入要搜索的和弦"
          />
        </div>
        <div id="search_chord_list">
          <Chord
            v-for="chord in searchChords"
            :key="chord.name ?? chord ?? index"
            :chord="typeof(chord) == 'string' ? null : chord"
            :placeholder="typeof(chord) == 'string' ? chord : chord.name"
            :class="
              'prefab_chord ' +
              (isAttached(chord) ? 'chord_already_attached' : 'chord_add')
            "
            :styles="chordStyle"
            @click="addAttachedChord(chord)"
          />
        </div>
      </div>
    </div>
    <div v-if="_isDraggingChord" id="chord_sort_drag_mark">
      <Chord
        :chord="_DraggingChord"
        class="prefab_chord"
        :styles="chordStyle"
      />
    </div>
  </div>
</template>

<script>
import ChordManager from "@/utils/chordManager.js";
import Chord from "@/components/chord/index.vue";
import { clone, getCursorClientPos, getEnv } from "@/utils/common.js";

const g_RecommendChordInCMajor = {
  常用: ["C", "Dm", "Em", "F", "G", "Am", "E"],
  修饰音: ["C7", "G7", "E7", "Csus4", "Gsus4", "Gsus2"],
  其他: ["D", "A", "Fm", "Gm"],
};

export default {
  name: "SheetEditorPanelChordSelector",
  components: {
    Chord,
  },
  props: {
    show: {
      type: Boolean,
      required: true,
      default: false,
    },
    attachedChords: {
      type: Array,
      required: true,
    },
    tonic: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      localAttachedChords: [],
      recommendChords: [],
      searchChords: [],
      searchText: "",

      _isDraggingChord: false,
      _DraggingChord: null,
      _DraggingChordIndex: null,
      chordStyle: {
        titleRatio: 0.16,
        colorMain: "white",
        colorMarkText: "black",
        colorRootString: "red",
      },
    };
  },
  mounted() {
    this.localAttachedChords = clone(this.attachedChords)
    this.updateRecommendChords();
    document.addEventListener("mousemove", this.dragSortMove);
    document.addEventListener("touchmove", this.dragSortMove);
    document.addEventListener("mouseup", this.dragSortEnd);
    document.addEventListener("touchend", this.dragSortEnd);
  },
  methods: {
    getEnv,
    close() {
      this.$emit("update:show", false);
    },
    finish() {
      this.$emit("update:attachedChords", this.localAttachedChords);
      this.close();
    },
    cancel() {
      let confirmed = confirm("确认放弃修改的和弦？");
      if (!confirmed) return;
      this.localAttachedChords = clone(this.attachedChords)
      this.close();
    },
    updateRecommendChords() {
      console.log("update", this.tonic)
      let recommendChords = [];
      if (this.tonic) {
        for (let type in g_RecommendChordInCMajor) {
          let list = [];
          for (let chordName of g_RecommendChordInCMajor[type]) {
            let newChordName = ChordManager.shiftKey(
              chordName,
              "C",
              this.tonic
            );
            let newChord = ChordManager.getChord(newChordName) ?? {name: newChordName};
            list.push(newChord);
          }
          recommendChords.push({
            title: type,
            list: list,
          });
        }
      } else {
        recommendChords.push({
          title: "请先指定选调",
          list: [],
        });
      }
      this.recommendChords = recommendChords;
    },
    updateSearchChords() {
      let text = this.searchText;
      let searchResult = [];
      text = text.replace(/\s/g, "");

      if (text != "") {
        ChordManager.traverse((chord) => {
          let chordName = chord.name;
          if (text == chordName) {
            // 完全匹配，优先级最大
            searchResult.push({ chord, priority: 1 });
          } else if (ChordManager.isAlias(text, chordName)) {
            // 别名
            searchResult.push({ chord, priority: 2 });
          } else if (
            chordName.toLowerCase().indexOf(text.toLowerCase()) != -1
          ) {
            // 大小写不敏感，和弦包含文字
            searchResult.push({ chord, priority: 3 });
          } else if (
            text.toLowerCase().indexOf(chordName.toLowerCase()) != -1
          ) {
            // 大小写不敏感，文字包含和弦
            searchResult.push({ chord, priority: 4 });
          }
        });
      }

      searchResult.sort((a, b) => {
        if (a.priority != b.priority) return a.priority - b.priority;
        else return a.chord.name.localeCompare(b);
      });

      this.searchChords = searchResult.map(entry => entry.chord);
    },

    isAttached(chord) {
      return this.localAttachedChords.find(e => e.name == chord.name) != undefined;
    },

    addAttachedChord(chord) {
      if (this.isAttached(chord)) {
        alert(`和弦${chord.name}已存在`);
        return;
      }
      this.localAttachedChords.push(chord);
    },

    deleteAttachedChord(index) {
      this.localAttachedChords.splice(index, 1);
    },

    dragSortStart(e, index) {
      this._isDraggingChord = true;
      this._DraggingChord = this.localAttachedChords[index];
      this._DraggingChordIndex = index;
      this.dragSortMove(e);
    },

    dragSortMove(e) {
      if (!this._isDraggingChord) return;

      let [x, y] = getCursorClientPos(e);
      let $e = "#chord_sort_drag_mark"
      $e.css({
        left: x,
        top: y
      })
      // TODO: 对触屏需要判断元素，手动触发over事件
    },

    dragSortOver(index) {
      if (!this._isDraggingChord) return;

      let curChord = this.localAttachedChords[index];
      let lastIndex = this._DraggingChordIndex;
      let lastChord = this._DraggingChord;
      if (lastChord == curChord) return;
      this.localAttachedChords.splice(lastIndex, 1);
      let newIndex = this.localAttachedChords.indexOf(curChord)
      if (lastIndex < index) newIndex++
      this.localAttachedChords.splice(newIndex, 0, lastChord);
      this._DraggingChordIndex = newIndex
    },

    dragSortEnd() {
      this._isDraggingChord = false;
      this._DraggingChord = null;
      this._DraggingChordIndex = null;
    },

    clickTrashcan() {
      let confirmed = confirm(
        "确认删除所有和弦？\n（可以把和弦拖到这里删除哦~）"
      );
      if (!confirmed) return;
      this.localAttachedChords = [];
    },

    dropTrashcan() {
      if (!this._isDraggingChord) return;
      this._isDraggingChord = false;
      this._DraggingChord = null;
      this.localAttachedChords.splice(this._DraggingChordIndex, 1);
    },
  },
  watch: {
    show: function () {
      if (this.show)
        this.localAttachedChords = clone(this.attachedChords)
    },
    tonic: function () {
      this.updateRecommendChords();
    },
    searchText: function () {
      this.updateSearchChords();
    },
    attachedChords: function () {
      this.localAttachedChords = clone(this.attachedChords)
    },
  },
};
</script>

<style scoped src="./common.css"></style>

<style scoped>
* {
  color: white;
}
*[type=fake] {
  opacity: 0.5;
}
#chord_sort_drag_mark {
  position: fixed;
  pointer-events: none;
  opacity: 0.5;
}
#chord_container {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 2%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
}
#chord_container .v_split {
  height: 100%;
}
#attached_block {
  width: 50%;
  height: 100%;

  display: flex;
  flex-direction: column;
  align-items: center;
}
.chord_list_empty {
  outline: 2px white solid;
  padding: 10px 20px;
  margin: 10px 0;
}
#attached_chord_list {
  position: relative;
  margin: 10px 0;
  width: 80%;
  min-height: 200px;
  outline: 2px white solid;
  overflow-y: auto;

  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
}
#attached_chord_trashcan {
  margin: 10px 0;
  width: 300px;
  height: 60px;
  border-radius: 20px;
  font-size: 30px;
  user-select: none;
  transition: opacity 0.2s ease-out;

  background: rgb(92, 54, 54);
  opacity: 0.5;
}
#attached_chord_trashcan:hover {
  background: rgb(179, 103, 103);
  opacity: 0.8;
}

#library_block {
  width: 50%;
  height: 100%;

  display: flex;
  flex-direction: column;
  align-items: center;
}
#recommend_chord_list {
  width: 80%;
  min-height: 200px;
  margin: 10px 0;
  outline: 2px white solid;
  overflow-y: auto;

  display: flex;
  flex-direction: column;
}
.recommend_type {
  writing-mode: tb;
  letter-spacing: 2px;
}
.recommend_sub_list {
  width: 100%;
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
}
#search_text_input {
  margin: 0 10px;
  color: black;
}
#search_chord_list {
  width: 80%;
  min-height: 200px;
  margin: 10px 0;
  outline: 2px white solid;
  overflow-y: auto;

  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
}

.prefab_chord::after {
  position: absolute;
  content: "";
  opacity: 0;
  transition: all 0.2s ease-out;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  border-radius: 5px;
  white-space: pre;

  display: flex;
  justify-content: center;
  align-items: center;
}
.prefab_chord:hover::after {
  opacity: 1;
}
.chord_drag_sort::after {
  content: "拖拽\D\A排序";
  background-color: rgba(116, 168, 120, 0.685);
}
.chord_add::after {
  content: "点击\D\A添加";
  background-color: rgba(124, 116, 168, 0.685);
}
.chord_already_attached::before {
  position: absolute;
  content: "";
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  border-radius: 5px;
  background-color: rgba(168, 116, 116, 0.685);
  opacity: 0.5;
}
.chord_already_attached::after {
  content: "和弦\D\A已存在";
  background-color: rgba(168, 116, 116, 0.685);
}
</style>