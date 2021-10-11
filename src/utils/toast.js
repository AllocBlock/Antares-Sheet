import $ from 'jquery'

let $toast = $("<div>");
$toast.css({
  position: "fixed",
  left: "50%",
  top: "20px",
  transform: "translateX(-50%)",
  display: "flex",
  height: "30px",
  "min-width": "60px",
  "background-color": "#511",
  "border-radius": "25px",
  padding: "5px 30px",
  opacity: 0,
})

/* 显示气泡提示 */
function show(text, duration = 1.0) {
  console.warn(text)
  $toast.stop(true, true);
  $toast.text(text);
  $toast.animate({ opacity: 1 }, 50);
  $toast.animate({ "null": 1 }, duration * 1000); // 无意义动画，避免使用delay无法取消的问题
  $toast.animate({ opacity: 0 }, 300);
}

export default {
  show
}