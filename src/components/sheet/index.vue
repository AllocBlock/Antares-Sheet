<template>
  <div class="container" ref="container" :style="globalCssVar">
    <span v-if="sheetHtml" v-html="sheetHtml" ref="sheet" />
    <span v-else>曲谱加载中...</span>
  </div>
</template>

<script>
import $ from "jquery";
import Chord from "@/components/chord"
import WebTab from "@/utils/webTab"

export default {
  name: "Sheet",
  components: {
    Chord,
  },
  data() {
    return {
      sheetHtml: "",
      globalCssVar: {
        // "--sheet-theme-color": "black",
        "--sheet-theme-color": "#e9266a",
        "--sheet-font-size": "30px",
        "--sheet-underline-color": "var(--sheet-theme-color)",
        "--sheet-line-height": "calc(var(--sheet-font-size) + 20px)",
        "--sheet-line-thickness": "calc(var(--sheet-font-size) * 0.05)" /* 各种下划线的粗细 */
      }
    };
  },
  props: {
    sheetText: {
      type: String,
      required: true,
      default: "",
    },
  },
  mounted() {
    this.parseSheet();
  },
  methods: {
    parseSheet() {
      this.sheetHtml = "";
      let str = this.sheetText;
      if (!str) return;
      // 解析标签信息，标签信息具有通用性，可以自定义标签
      // 如果标签可以是一个值或是数组，数组中的每个值用空格隔开
      // 如果值中有空格则使用""将值括起来，如果值中有"则在前面加一个反斜杠变成\"
      let index = 0,
        line;
      while (true) {
        [line, index] = this.getLine(str, index);
        if (line === null)
          break
        if (line.match(/^\s*$/))
          continue
        else if (line[0] == "$") {
          let splitResult = line.match(/\$([^\s]*)\s(.*)/);
          if (!splitResult) throw "解析标签失败";
          let [key, valueStr] = [splitResult[1], splitResult[2]];
          let matchResult = valueStr.match(/("([^\\]|\\.)*?")|([^\s]+)/g);
          let value;
          if (matchResult) {
            value = matchResult.map((e) => {
              if (!e) return "";
              else {
                let raw;
                if (e[0] == '"') raw = e.substr(1, e.length - 2);
                else raw = e;
                raw = raw.replace(/\\(.)/, "$1"); // 反转义
                return raw;
              }
            });
          } else {
            value = "";
          }

          if (value.length == 1) value = value[0];

          this[key] = value;
        } else break;
      }

      // 解析插件信息，目前只有指法谱插件，后续可能有别的（插入图片，快捷工具啥的？）
      const RePlugin = /\*\[(.*)\]/;
      let pluginElements = [];
      let res;
      let pluginIndex = 0;
      while ((res = str.match(RePlugin))) {
        const type = res[1];
        const startIndex = str.indexOf(res[0]);
        const pluginInfo = this.getPlugin(str, startIndex);
        let pluginPlaceholderHTML = '<span>不支持的插件</span>'
        switch (pluginInfo.type) {
          case "tab": {
            let tab = new WebTab();
            let $tab = tab.create(pluginInfo.content);
            pluginElements.push($tab);
            pluginPlaceholderHTML = `<sheet-plugin index="${pluginIndex}"></sheet-plugin>`;
            ++pluginIndex;
            break;
          }
          default:
            console.error(`不支持的插件类型：${type}`);
        }
        str = str.replace(pluginInfo.plugin, pluginPlaceholderHTML);
      }

      const UnderlineTagName = {
        normal: "underline",
        pure: "underline_pure",
      };

      // isStart 是否是起始标签，为真是起始标签，为假则是结束标签
      // str 要替换的文本
      // tag 替换成的标签
      // pos 替换起始位置
      // length 替换的长度
      // 返回被替换的字符串，以及新的索引（位于替换字符串的末尾）
      function replaceBracket(isStart, str, tag, pos, length = 1) {
        let replacement = "<" + (isStart ? "" : "/") + tag + ">";
        str = str.slice(0, pos) + replacement + str.slice(pos + length);
        let newPos = pos + replacement.length - 1;
        return [str, newPos];
      }

      let newlineMatchRes = str.substr(0, index).match(/\n/g);
      let sheetBody = str.substr(index);
      index = 0;
      let typeStack = [];
      let curDepth = -1;
      let curLine = 1 + (newlineMatchRes ? newlineMatchRes.length : 0);
      let curPos = 0;
      while (index < sheetBody.length) {
        if (sheetBody[index] == "{") {
          curDepth++;
          if (index > 0 && sheetBody[index - 1] == "!") {
            typeStack.push("pure");
            [sheetBody, index] = replaceBracket(
              true,
              sheetBody,
              UnderlineTagName["pure"],
              index - 1,
              2
            );
          } else {
            typeStack.push("normal");
            [sheetBody, index] = replaceBracket(
              true,
              sheetBody,
              UnderlineTagName["normal"],
              index,
              1
            );
          }
        } else if (sheetBody[index] == "}") {
          if (typeStack.length == 0) {
            console.error(`解析曲谱：不应出现}，位于${curLine}行:${curPos}列`);
            return null;
          }
          let type = typeStack.pop();
          if (type == "pure" || type == "normal") {
            [sheetBody, index] = replaceBracket(
              false,
              sheetBody,
              UnderlineTagName[type],
              index,
              1
            );
          } else {
            console.error("解析曲谱：未知类型错误");
            return null;
          }
          curDepth--;
        } else if (sheetBody[index] == "\n") {
          curLine++;
          curPos = 0;
        }
        curPos++;
        index++;
      }
      if (curDepth >= 0) {
        console.error("解析曲谱：下划线{}没有成对");
        return null;
      }
      sheetBody = sheetBody.replace(
        /\!\{([^\}]*)\}/g,
        "<underline_pure>$1</underline_pure>"
      );
      sheetBody = sheetBody.replace(
        /\{([^\}]*)\}/g,
        "<underline>$1</underline>"
      );
      sheetBody = sheetBody.replace(/\!\(([^\)]*)\)/g, "<info>$1</info>"); // !(xxx)
      sheetBody = sheetBody.replace(
        /\!\[([^\]]*)\]/g,
        "<chord_pure>$1</chord_pure>"
      ); // ![xxx]
      sheetBody = sheetBody.replace(
        /\[([^\]]*)\]\(\_\)/g,
        "<chord><placeholder /><chord_name>$1</chord_name></chord>"
      ); // [xxx](_)
      sheetBody = sheetBody.replace(
        /\[([^\]]*)\]\_/g,
        "<chord><placeholder /><chord_name>$1</chord_name></chord>"
      ); // [xxx]_
      sheetBody = sheetBody.replace(
        /\[([^\]]*)\]\(([^\)]*)\)/g,
        "<chord>$2<chord_name>$1</chord_name></chord>"
      ); // [xxx](yyy)
      sheetBody = sheetBody.replace(
        /\[([^\]]*)\](.)/g,
        "<chord>$2<chord_name>$1</chord_name></chord>"
      ); // [xxx]y
      sheetBody = sheetBody.replace(/(\r\n)|(\n)/g, "<newline></newline>"); // newline

      // 生成元素
      this.sheetHtml = sheetBody;
      console.log(sheetBody)

      // 替换插件
      this.$nextTick(() => {
        let $sheet = $(this.$refs['sheet'])
        $sheet.find("sheet-plugin").each((i, e) => {
          let $plugin = $(e)
          let index = parseInt($plugin.attr("index"))
          if (isNaN(index)) throw "解析遇到未知错误"
          $plugin.replaceWith(pluginElements[index][0])
        })
      })
    },
    getLine(str, offset) {
      if (offset > str) return [null, offset]
      let start = offset;
      let end = offset;
      while (end < str.length && str[end] != "\n") end++;
      return [str.substr(start, end), end + 1];
    },
    getPlugin(str, startIndex) {
      let pluginInfo = {};

      let i = startIndex;
      if (str[i] != "*") throw "插件格式有误";
      ++i;
      if (str[i] != "[") throw "插件格式有误";
      ++i;

      let typeStartIndex = i;
      while (true) {
        if (i >= str.length) throw "插件格式有误，未找到插件类型的结束符号]";
        else if (str[i] == "]") {
          pluginInfo.type = str.slice(typeStartIndex, i);
          ++i;
          break;
        }
        ++i;
      }

      if (str[i] != "{") throw "插件格式有误";
      ++i;
      let contentStartIndex = i;
      let depth = 0;
      while (true) {
        if (i >= str.length)
          throw "插件格式有误，未找到插件内容的结束符号}或符号不匹配";

        if (str[i] == "{") ++depth;
        else if (str[i] == "}") {
          if (depth == 0) {
            pluginInfo.content = str.slice(contentStartIndex, i);
            break;
          } else --depth;
        }
        ++i;
      }

      let endIndex = i + 1;
      pluginInfo.plugin = str.slice(startIndex, endIndex);

      return pluginInfo;
    },
  },
  watch: {
    sheetText: function () {
      this.$nextTick(() => {
        this.parseSheet();
      });
    },
  },
};
</script>

<style>
/* 占位标记 */
placeholder {
  display: inline-block;
  border-bottom: var(--sheet-line-thickness) solid var(--sheet-theme-color);
  width: var(--sheet-font-size);
}

/* 和弦 */
chord {
  color: var(--sheet-theme-color);
  user-select: none;
  position: relative;
  cursor: default;
  text-shadow: 0 0 0.5px rgba(0, 0, 0, 0.3);
  white-space: pre;
}
chord:before {
  content: " ";
  position: relative;
  display: inline-block;
  margin-top: var(--sheet-line-height);
  height: 0;
  width: 0;
}
chord::after {
  content: "";
  position: absolute;
  left: -10px;
  top: calc(-8px - var(--sheet-font-size));
  right: -10px;
  bottom: -2px;
  border: 2px solid transparent;
  transition: 0.3s ease-out;
  border-radius: 5px;
  z-index: 1;
  pointer-events: none;
}

chord:hover::after,
chord_pure:hover::after {
  border: 2px solid var(--sheet-theme-color);
  box-shadow: 0 0 5px 2px black;
}

/* 和弦名称 */
chord_name {
  color: var(--sheet-theme-color);
  position: absolute;
  user-select: none;
  transition: 0.5s ease-out;
  text-align: center;
  text-shadow: none;
  width: fit-content;

  left: 50%;
  transform: translateX(-50%);

  display: flex;
  justify-content: center;
  align-items: center;
  bottom: 100%;
}

/* 同行和弦 */
chord_pure {
  color: var(--sheet-theme-color);
  user-select: none;
  position: relative;
  cursor: default;
  transition: 0.5s ease-out;
}
chord_pure::after {
  content: "";
  position: absolute;
  left: -10px;
  top: -2px;
  right: -10px;
  bottom: -2px;
  border: 2px solid transparent;
  transition: 0.3s ease-out;
  border-radius: 5px;
  z-index: 1;
  pointer-events: none;
}

/* 标记信息 */
info {
  padding: 3px 8px;
  border-radius: 5px;
  background-color: var(--sheet-theme-color);
  color: white;
  user-select: none;
  margin: 10px 5px;
  line-height: calc(var(--sheet-font-size) * 2);
}

/* 下划线 */
underline {
  border-top: var(--sheet-line-thickness) solid var(--sheet-underline-color);
}

underline > underline {
  border-top: var(--sheet-line-thickness) solid var(--sheet-underline-color);
  padding-top: calc(var(--sheet-line-thickness) * 3);
}

underline > underline > underline {
  border-top: var(--sheet-line-thickness) solid var(--sheet-underline-color);
  padding-top: calc(var(--sheet-line-thickness) * 6);
}

underline > underline > underline > underline {
  border-top: none;
}

/* 同行下划线 */
underline_pure {
  border-bottom: var(--sheet-line-thickness) solid var(--sheet-underline-color);
}

underline_pure > underline_pure {
  border-bottom: var(--sheet-line-thickness) solid var(--sheet-underline-color);
  padding-bottom: calc(var(--sheet-line-thickness) * 3);
}

underline_pure > underline_pure > underline_pure {
  border-bottom: var(--sheet-line-thickness) solid var(--sheet-underline-color);
  padding-bottom: calc(var(--sheet-line-thickness) * 6);
}

underline_pure > underline_pure > underline_pure > underline_pure {
  border-bottom: none;
}

newline::after {
  content: "\D\A";
}

.container {
  word-wrap: break-word;
  user-select: none;
  letter-spacing: 1px;
  white-space: pre-wrap;
  white-space: break-spaces; /* 优先，如果不支持则退回pre-wrap */
  position: relative;

  font-family: Tahoma, Verdana, Arial, Microsoft YaHei, sans-serif;
}

.container chord {
  letter-spacing: 1px;
}

.container chord_name {
  letter-spacing: 0px;
}

.container chord_pure {
  letter-spacing: 0px;
}
</style>
<style src="@/utils/webTab.css"></style>