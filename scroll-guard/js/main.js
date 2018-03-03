const DEFAULT_BLACKLIST = [
  "https://www.facebook.com",
  "https://www.instagram.com"
];

const SCROLL_GUARD =
  'const page=document.getElementsByTagName("body")[0];let scrollCount=0;window.onscroll=function(){setBlur(page,scrollCount/30);scrollCount++};function setBlur(element,px){element.style.filter=`blur(${px}px)`}';

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

(async function() {
  // This initializes the blacklist upon installation
  let blacklist = await Storage.read();
  if (blacklist === undefined) {
    await Storage.write(DEFAULT_BLACKLIST);
    blacklist = DEFAULT_BLACKLIST;
  }

  chrome.webNavigation.onCompleted.addListener(async event => {
    // This filters out subframe navigation events
    if (event.frameId !== 0) return;
    console.log(`Navigating: ${event.url}`);
    // Get up-to-date blacklist from storage
    blacklist = await Storage.read();
    if (isBlacklisted(event.url, blacklist)) {
      console.log("URL is blacklisted.");
      activateScrollGuard(event.tabId);
    } else {
      console.log("URL is not blacklisted.");
    }
  });
})();
