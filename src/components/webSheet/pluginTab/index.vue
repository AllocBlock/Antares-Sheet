<template>
  <tab-box :style="globalCssVar">
    <TabRow
      v-for="(row, rowIndex) in tabRows"
      :key="row"
      :bars="row"
      :row-number="rowIndex + 1"
      :first-bar-number="row[0].number"
      :global-config="tabConfig"
    />
  </tab-box>
</template>

<script>
import { SheetNode } from "@/utils/sheetNode";
import { parseTab } from "./tabParser";
import TabRow from "./row";

export default {
  name: "Tab",
  components: {
    TabRow,
  },
  data() {
    return {
      globalCssVar: {
        "--string-num": "4",
        "--fret-font-size": "16px",
        "--row-split-width": "3px",
        "--bar_split-width": "1px",
        "--row-height": "60px",
        "--row-margin-top": "30px",
        "--stem-margin": "70px",
      },
      tabRows: [],
      tabConfig: null,
    };
  },
  props: {
    node: {
      type: SheetNode,
      required: true,
      default: function () {
        let node = new SheetNode(ENodeType.Text);
        node.content = "未知节点";
        return node;
      },
    },
  },
  created() {
    let tab = parseTab(this.node.content);
    this.createTabLayout(tab);
  },
  methods: {
    createTabLayout(tab) {
      this.tab = tab

      this.tabRows = []
      this.tabConfig = tab.config
      let row = []
      for (let i = 0; i < tab.bars.length; ++i) {
        let bar = tab.bars[i] // TODO: 自定义class如何拷贝？
        bar.number = i + 1
        row.push(bar)
        if (
          ((i - 1) % 2 == 0) ||
          (i == tab.bars.length - 1 && row.length > 0)
        ) {
          this.tabRows.push(row)
          row = []
        }
      }
    },
    isBarNumberVisible(bar) {
      let globalConfig = this.tab.config.getBool("showBarNumber");
      let localConfig = bar.config.getBool("showBarNumber");
      return globalConfig && localConfig;
    },
    hasSplitLine(bar) {
      let lastBarHasEndRepeat =
        bar.number > 1
          ? this.tab.bars[bar.number - 2].config.getStr("repeat") == "end"
          : false;
      return bar.number != 1 && lastBarHasEndRepeat;
    },
    hasTimeSignature(bar) {
      return !!bar.config.getStr("ts");
    },
    getTimeSignature(bar) {
      let timeSignatureStr = bar.config.getStr("ts");
      if (!timeSignatureStr) return null;
      const reTimeSignature = /(\d+)\/(\d+)/;
      let res = timeSignatureStr.match(reTimeSignature);
      if (!res) throw `指法谱：拍号配置项有误[ts:{timeSignature}]`;
      let tapPerBar = res[1];
      let notePerTap = res[2];
      return [notePerTap, tapPerBar];
    },
    hasRepeat(bar, type) {
      return bar.config.getStr("repeat") == type;
    },
  },
};
</script>

<style scoped>
@font-face {
    font-family: MusicNotation;
    src: url(~@/assets/fonts/Aruvarb.ttf);
}

tab-box {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  /* color: white; */
  color: black;
  user-select: none;
}

tab-box[state="disabled"] > * {
  filter: blur(4px);
}

tab-box[state="disabled"]:before {
  content: "";
  position: absolute;
  left: -8px;
  right: -8px;
  top: -8px;
  bottom: -8px;
  background: rgba(255, 255, 255, 0.603);
  filter: blur(4px);
  z-index: 2;
}

tab-box[state="disabled"]:after {
  content: "指法谱不可用";
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  color: rgb(243, 53, 132);
  font-size: 60px;

  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  z-index: 3;
}
</style>