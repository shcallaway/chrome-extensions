// Credit: https://gist.github.com/dperini/729294
const URL_REGEX = /^(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i;

class ListView {
  constructor(model) {
    this.model = model;
    this.element = document.getElementsByClassName("list")[0];
    // Renders on instantiation
    this.render();
  }

  render() {
    this._clear();
    this.model.items.forEach(item => {
      const node = this._createNode(item);
      this.element.appendChild(node);
    });
  }

  // PRIVATE

  _clear() {
    while (this.element.firstChild) {
      this.element.removeChild(this.element.firstChild);
    }
  }

  _handleItemClick(event) {
    event.preventDefault();
    const value = event.target.innerHTML;
    this.model.remove(value);
  }

  _createNode(item) {
    const node = document.createElement("div");
    node.addEventListener("click", this._handleItemClick.bind(this));
    node.className += "item";
    node.innerHTML = item;
    return node;
  }
}

class ListModel {
  constructor(items, toast) {
    this.items = items || [];
    this.toast = toast;
    this.view = new ListView(this);
  }

  add(value) {
    this.items.push(value);
    this.view.render();
    Storage.write(this.items);
    this.toast.success(`${value} was added to your blacklist.`);
  }

  remove(value) {
    const index = this.items.indexOf(value);
    if (index > -1) this.items.splice(index, 1);
    this.view.render();
    Storage.write(this.items);
  }
}

class Storage {
  static read() {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get("blacklist", data => {
        resolve(data.blacklist);
      });
    });
  }

  static write(blacklist) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set(
        {
          blacklist
        },
        resolve
      );
    });
  }
}

class Toast {
  constructor() {
    this.element = document.getElementsByClassName("toast")[0];
  }

  success(message) {
    this.element.style.color = "green";
    this.element.textContent = message;
  }

  failure(message) {
    this.element.style.color = "red";
    this.element.textContent = message;
  }

  clear() {
    this.element.textContent = null;
  }
}

function isValidDomain(value) {
  return URL_REGEX.test(value);
}

function isEnterKeyPress(keyCode) {
  return keyCode === 13;
}

document.addEventListener("DOMContentLoaded", async () => {
  const blacklist = await Storage.read();
  const toast = new Toast();
  const list = new ListModel(blacklist, toast);

  const input = document.querySelectorAll("input[type=text]")[0];
  input.addEventListener("keydown", event => {
    // Only check input when 'enter' is pressed
    if (!isEnterKeyPress(event.keyCode)) {
      toast.clear();
      return;
    }

    event.preventDefault();
    const value = input.value;

    if (!isValidDomain(value)) {
      toast.failure(`${value} does not appear to be a valid URL.`);
      return;
    }

    toast.clear();
    list.add(value);
    input.value = "";
  });
});
