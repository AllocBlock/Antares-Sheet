<template>
  <tab-box ref="tabBox" :style="globalCssVar" :state="tabState">
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
import { SheetNode } from "@/utils/sheetNode.js";
import { parseTab } from "./tabParser.js";
import TabRow from "./row.vue";

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
        "--bar-split-width": "1px",
        "--row-height": "60px",
        "--row-margin-top": "30px",
        "--stem-margin": "70px",
      },
      tabRows: [],
      tabConfig: null,
      tabResizeObserver: null,
    };
  },
  props: {
    node: {
      type: SheetNode,
      required: true,
      default: function () {
        let node = new SheetNode(ENodeType.Text);
        node.content = "未知节点";
        node.valid = true;
        return node;
      },
    },
  },
  computed: {
    tabState: function() {
      return this.node.valid ? "valid" : "invalid";
    }
  },
  mounted() {
    this.tab = parseTab(this.node.content)
    this.updateTabLayout()

    let timer = null
    const delay = 200
    this.tabResizeObserver = new ResizeObserver(entries => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        this.updateTabLayout()
      }, delay)
    })
    this.tabResizeObserver.observe(this.$refs['tabBox'])
  },
  beforeDestroy() {
    this.tabResizeObserver.disconnect()
  },
  methods: {
    updateTabLayout() {
      if (!this.$refs['tabBox']) return
      this.tabRows = []
      this.tabConfig = this.tab.config

      let width = this.$refs['tabBox'].clientWidth
      const BarEspectWidth = 300
      let BarNum = Math.max(1, Math.round(width / BarEspectWidth))

      for (let i = 0; i < this.tab.bars.length; i += BarNum) {
        let row = []
        for(let k = i; k < i + BarNum && k < this.tab.bars.length; ++k) {
          let bar = this.tab.bars[k] // TODO: 自定义class如何拷贝？
          bar.number = k + 1
          row.push(bar)
        }
        this.tabRows.push(row)
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
    src: url(./fonts/Aruvarb.ttf);
}

tab-box {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 300px;
  /* color: white; */
  color: black;
  user-select: none;
}

tab-box[state="invalid"] > * {
  filter: blur(4px);
}

tab-box[state="invalid"]::before {
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

tab-box[state="invalid"]:after {
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
  text-align: center;
}
</style>