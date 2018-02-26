// TODO: Does this have to be in a separate file?
const page = document.getElementsByTagName("body")[0];

let scrollCount = 0;
window.onscroll = function() {
  setBlur(page, scrollCount / 30);
  scrollCount++;
};

function setBlur(element, px) {
  element.style.filter = `blur(${px}px)`;
}
