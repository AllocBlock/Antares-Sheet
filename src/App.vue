<template>
  <Chord style="width: 300px; height: 400px" :chord="chord" />
  <Metronome />
  <WebSheet style="width: 100%; height: 600px" :sheet-text="sheetText" />
</template>

<script>
import Chord from "@/components/chord";
import WebSheet from "@/components/webSheet";
import Metronome from "@/components/metronome";
import ChordManager from "@/utils/webChordManager";

const g_ChordManager = new ChordManager();

export default {
  name: "App",
  components: {
    Chord, WebSheet, Metronome
  },
  data() {
    return {
      chord: {
        name: "Test",
      },
      sheetText: `
$title 诺亚方舟
$singer 五月天
$by 锦瑟
$originalKey D
$sheetKey D
$chords D E Gm

!(前奏)
*[tab]{
$
[stringNum:4]
[showBarNumber:true]
[showStumFret:false]
$
[ts:4/4] [repeat:start] (0222)[chordGraph:D][a:d]4 (××--)4 (xx--)4 {(-x--)16 (-3--)16 (-4--)8} |
(2544)[chordGraph:Esus4][a:d]4 (xx--)4 (xx--)[chordGraph:E]4 {(xx--)16 (-2--)16 (-0--)8} |
(1320)[chordGraph:Gm][a:d]4 (××--)4 (××--)4 (××--)4 |
(0222)[chordGraph:D][a:d]4 (××--)4 (××--)4 (××--)4 [repeat:end]|
}

再[D]见 草莓甜[E]甜圈 街角咖[Gm]啡店 落下雨[D]_点
再[D]见 黑白老[E]照片 回忆电[Gm]影院 埋进地[D]_面
再[D]见 我们初识[E]的那个公园 那天[Gm]是谁先吻了谁 被谁遗忘[D]的秋千
再[D]见 那么多名[E]车名表名鞋 最后[Gm]我们只能带走 名为回忆[D]的花园

如果要告[D]别 如果今夜[E]就要和一切告别
如果你只[Gm]能打一通电话 你会[D]拨给谁

!(间奏) ![D] !{![Esus4] ![E]} ![Gm] ![D]

晚[D]安 鹦鹉和[E]孔雀 花豹和[Gm]人类 望着海[D]_面
晚[D]安 底片和[E]唱片 沉浮在[Gm]浪间 就像诗[D]_篇
晚[D]安 自由女神[E]漂到华尔街 我们[Gm]在甲板上摸到 杜拜塔顶[D]的塔尖
晚[D]安 海豚跃出[E]西藏的屋檐 原来[Gm]幻想中的这天 会比幻想[D]更唯美

还是要告[D]别 还是放弃[E]海拔以下的世界
你会装进[Gm]什么回忆纪念 在行[D]李里面
终于要告[D]别 终于没有[E]更多的明天要追
你有什么[Gm]遗憾依然残缺 还没[D]有完美

{[Gm]_当彗星燃[bB]_}烧天边 陨[D]石像雨点 {[Gm]_当辐射比[bB]阳}光还要炽[D]烈
{[Gm]_让爱变得[bB]_}浓烈 当每段{{[D]命运 [A]_更加壮[Bm]烈   [#Fm]_}}
当永远[G]变成一种遥远 当句点[A]变成一种观点 让人类[A]终于变成同类

勇敢的告[D]别 勇敢地向[E]过去和未来告别
告别每段[Gm]血缘身分地位 聪明[D]或愚昧
最后的告[D]别 最后一个[E]心愿是学会高飞
飞在不存在[Gm]的高山草原 星空[D]和蓝天
[D]让 诺亚[E]方舟 航向[Gm]了 海平[D]线  [D]让 诺亚[E]方舟 航向[Gm]了 换日[D]线
[D]让 诺亚[E]方舟 航向[Gm]了 天际[D]线  [D]让 诺亚[E]方舟 航向[Gm]了 无[D]限

!(尾奏) ![D] !{![Esus4] ![E]} ![Gm] ![D]`,
    };
  },
  mounted() {
    // this.chord = g_ChordManager.getChord("#Cm")
    this.chord = {
      name: "Fm",
      stringNum: 6,
      startFret: 1,
      fretNum: 4,
      rootString: null,
      disabledStrings: [5, 4],
      fingerings: [
        {
          finger: 1,
          fret: 1,
          startString: 1,
          endString: 6,
        },
        {
          finger: 3,
          fret: 3,
          startString: 5,
          endString: null,
        },
        {
          finger: 4,
          fret: 3,
          startString: 4,
          endString: null,
        },
      ],
    };

    console.log(this.chord);
  },
};
</script>