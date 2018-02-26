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
    this.view = new ListView(this);
    this.toast = toast;
  }

  add(value) {
    this.items.push(value);
    this.view.render();
    Storage.write(Storage.keys.sites, this.items);
    this.toast.display(`Added '${value}'.`);
  }

  remove(value) {
    const index = this.items.indexOf(value);
    if (index > -1) this.items.splice(index, 1);
    this.view.render();
    Storage.write(Storage.keys.sites, this.items);
    this.toast.display(`Removed '${value}'.`);
  }
}

class Storage {
  static get keys() {
    return {
      sites: "sites"
    };
  }

  static read(key) {
    Storage._verifyStorageKey(key);

    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(key, data => {
        resolve(data[key]);
      });
    });
  }

  static write(key, value) {
    Storage._verifyStorageKey(key);

    // Chrome storage API expects an object
    const data = Storage._makeObjectFromParams(key, value);
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set(data, resolve);
    });
  }

  // PRIVATE

  static _verifyStorageKey(key) {
    if (!Storage._isValidKey(key)) {
      throw new Error(`'${key}' is not a valid storage key.`);
    }
  }

  static _makeObjectFromParams(key, value) {
    const object = new Object();
    object[key] = value;
    return object;
  }

  static _isValidKey(key) {
    return !!Storage.keys[key];
  }
}

class Toast {
  constructor() {
    this.element = document.getElementsByClassName("toast")[0];
    this.messages = [];
    this.active = false;
  }

  display(message) {
    this.messages.push(message);

    if (!this.active) {
      this._activate();
      this._next();
    }
  }

  // PRIVATE

  _deactivate() {
    this.element.style.opacity = 0;
    this.active = false;
  }

  _activate() {
    this.element.style.opacity = 1;
    this.active = true;
  }

  _next() {
    if (this.messages.length) {
      this.element.textContent = this.messages.shift();
      setTimeout(this._next.bind(this), 3000);
    } else {
      this._deactivate();
    }
  }
}

function isValidDomain(value) {
  return URL_REGEX.test(value);
}

function isEnterKeyPress(keyCode) {
  return keyCode === 13;
}

function setDefaultBlacklist() {
  const sites = ["https://www.facebook.com"];
  sites.forEach(site => {
    list;
  });
  list.add();
}

async function main() {
  const sites = await Storage.read(Storage.keys.sites);
  const toast = new Toast();
  const list = new ListModel(sites, toast);

  const input = document.querySelectorAll("input[type=text]")[0];
  input.addEventListener("keydown", event => {
    // Only check input when 'enter' is pressed
    if (!isEnterKeyPress(event.keyCode)) return;

    event.preventDefault();
    const value = input.value;

    if (!isValidDomain(value)) {
      toast.display(`'${value}' does not appear to be a valid URL.`);
      return;
    }

    list.add(value);
    input.value = "";
  });
}

document.addEventListener("DOMContentLoaded", main);
