// TODO: Get rid of duplicate code
class Storage {
  static get keys() {
    return {
      blacklist: "blacklist"
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

// TODO: Move to separate file?
const DEFAULT_BLACKLIST = [
  "https://www.facebook.com",
  "https://www.instagram.com"
];

function isBlacklisted(url, blacklist) {
  return blacklist.some(blacklisted => {
    console.log(`Comparing: ${url} vs. ${blacklisted}`);
    // Supports partial urls, e.g. missing protocol
    return url.includes(blacklisted);
  });
}

function activateScrollGuard(tabId) {
  chrome.tabs.executeScript(tabId, {
    file: "js/blur.js"
  });
}

(async function() {
  // This initializes the blacklist upon installation
  let blacklist = await Storage.read(Storage.keys.blacklist);
  if (blacklist === undefined) {
    await Storage.write(Storage.keys.blacklist, DEFAULT_BLACKLIST);
    blacklist = DEFAULT_BLACKLIST;
  }

  chrome.webNavigation.onCompleted.addListener(async event => {
    console.log(`Navigating: ${event.url}`);
    // Get up-to-date blacklist from storage
    blacklist = await Storage.read(Storage.keys.blacklist);
    if (isBlacklisted(event.url, blacklist)) {
      console.log("URL is blacklisted.");
      activateScrollGuard(event.tabId);
    }
  });
})();
