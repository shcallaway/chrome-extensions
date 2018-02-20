console.log("Loaded blur.js");

const body = document.getElementsByTagName("body")[0];

let scrollCount = 0;
window.onscroll = function() {
  setBlur(body, calculateBlur(scrollCount))
  scrollCount++;
}

function calculateBlur(num) {
  return num / 30;
}

function setBlur(element, px) {
  element.style.filter = "blur(" + px + "px)";
}
