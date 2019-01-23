// Credit: https://gist.github.com/dperini/729294
const URL_REGEX = /^(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i;

// UTILS

class Storage {
  static read(key) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(key, data => {
        resolve(data[key]);
      });
    });
  }

  static write(key, value) {
    return new Promise((resolve, reject) => {
      const data = new Object();
      data[key] = value;
      chrome.storage.sync.set(data, resolve);
    });
  }
}

class EventEmitter {
  constructor() {
    this.subscriptions = [];
  }

  emit(value) {
    this.subscriptions.forEach(subscription => {
      const [object, callback] = subscription;
      object[callback].apply(object, [value]);
    });
  }

  subscribe(object, callback) {
    this.subscriptions.push([object, callback]);
  }
}

// VIEWS

class ListView {
  constructor(model) {
    this.model = model;
    this.element = document.getElementsByClassName("list")[0];
    this.render();
  }

  render(animate = false) {
    this._clear();

    // Puts the most recent items on top
    const items = this.model.items;
    for (let i = items.length - 1; i >= 0; i--) {
      const node = this._createNode(items[i]);

      if (i === items.length - 1 && animate) {
        node.style.animation = `slide 0.3s ease-in`;
      }

      this.element.appendChild(node);
    }
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

class InputView {
  constructor(model) {
    this.model = model;
    this.elements = {
      input: document.querySelectorAll("input[type=text]")[0],
      error: document.getElementsByClassName("toast")[0]
    };
    this.elements.input.addEventListener("keydown", event => {
      this.model._handleKeyPress(event);
    });
  }

  render() {
    this.elements.input.value = this.model.value;
    this.elements.error.textContent = this.model.error;
  }
}

// MODELS

class ListModel {
  constructor(items) {
    this.items = items || [];
    this.view = new ListView(this);
  }

  add(value) {
    this.items.push(value);
    Storage.write("blacklist", this.items);
    this.view.render(true);
  }

  remove(value) {
    const index = this.items.indexOf(value);
    if (index > -1) this.items.splice(index, 1);
    Storage.write("blacklist", this.items);
    this.view.render();
  }
}

class InputModel extends EventEmitter {
  constructor() {
    super();
    this.value = "";
    this.error = null;
    this.view = new InputView(this);
    this.view.render();
  }

  update(value) {
    this.value = value;
    this.error = null;
    this.view.render();
  }

  _reset() {
    console.log("resetting");
    this.value = "";
    this.error = null;
    this.view.render();
  }

  _handleKeyPress(event) {
    const value = this.view.elements.input.value;
    this.update(value);

    const isEnterKeyPress = this._isEnterKeyPress(event.keyCode);
    if (isEnterKeyPress) this._handleEnterKeyPress();
  }

  _handleEnterKeyPress() {
    const value = this.view.elements.input.value;
    const isValidDomain = this._isValidDomain(value);

    if (isValidDomain) {
      console.log("it's a valid domain");
      this.emit(this.value);
      this._reset();
      return;
    }

    this.error = "Not a valid URL.";
    this.view.render();
  }

  _isEnterKeyPress(keyCode) {
    return keyCode === 13;
  }

  _isValidDomain(value) {
    return URL_REGEX.test(value);
  }
}

// MAIN

document.addEventListener("DOMContentLoaded", async () => {
  const items = await Storage.read("blacklist");
  const input = new InputModel();
  const list = new ListModel(items);
  input.subscribe(list, "add");
});
