const DEFAULT_BLACKLIST = [
  "https://www.facebook.com",
  "https://www.instagram.com"
];

const SCROLL_GUARD =
  'const page=document.getElementsByTagName("body")[0];let scrollCount=0;window.onscroll=function(){setBlur(page,scrollCount/30);scrollCount++};function setBlur(element,px){element.style.filter=`blur(${px}px)`}';

// UTILS

function isBlacklisted(url, blacklist) {
  return blacklist.some(blacklisted => {
    console.log(`Comparing: ${url} vs. ${blacklisted}`);
    // Supports partial urls, e.g. missing protocol
    return url.includes(blacklisted);
  });
}

function activateScrollGuard(tabId) {
  chrome.tabs.executeScript(tabId, {
    code: SCROLL_GUARD
  });
}

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

// MAIN

(async function() {
  // This initializes the blacklist upon installation
  let blacklist = await Storage.read("blacklist");
  if (blacklist === undefined) {
    await Storage.write("blacklist", DEFAULT_BLACKLIST);
    blacklist = DEFAULT_BLACKLIST;
  }

  chrome.webNavigation.onCompleted.addListener(async event => {
    // This filters out subframe navigation events
    if (event.frameId !== 0) return;
    console.log(`Navigating: ${event.url}`);
    // Get up-to-date blacklist from storage
    blacklist = await Storage.read("blacklist");
    if (isBlacklisted(event.url, blacklist)) {
      console.log("URL is blacklisted.");
      activateScrollGuard(event.tabId);
    } else {
      console.log("URL is not blacklisted.");
    }
  });
})();
