import $ from "jquery"

export const ELoadState = {
  Loading: 0,
  Loaded: 1,
  Failed: 2,
  Empty: 3,
}

export function getPos(element) {
  // *raw dom implementation
  // var rect = element.getBoundingClientRect();
  // return {
  //   top: (rect.top + (document.documentElement.scrollTop || document.body.scrollTop)) - window.pageYOffset,
  //   left: rect.left - window.pageXOffset,
  // };

  // *jq implementation
  return $(element).offset()
}

export function setPos(element, left, top) {
  // update pos by vue is too slow, so use jquery to update directly
  $(element).css({ left, top })
}