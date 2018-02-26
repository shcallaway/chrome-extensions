// TODO: Move to separate file
const DEFAULT_BLACKLIST = [
  "https://www.facebook.com",
  "https://www.instagram.com"
];

function handleNavigation(event) {
  console.log("Loading blur script.");
  chrome.tabs.executeScript(event.tabId, {
    file: "js/blur.js"
  });
}

function storeDefaultBlacklist() {
  console.log("Using default blacklist.");
  chrome.storage.sync.set(
    {
      sites: DEFAULT_BLACKLIST
    },
    () => console.log("Saved default blacklist to storage.")
  );
}

function createFilterFromBlacklist(sites) {
  const filter = {
    url: []
  };

  sites.forEach(site => {
    filter.url.push({
      urlContains: site
    });
  });

  return filter;
}

// TODO: Use Storage code from options.js?
chrome.storage.sync.get("sites", data => {
  let sites = data.sites;

  if (sites === undefined) {
    storeDefaultBlacklist();
    sites = DEFAULT_BLACKLIST;
  }

  chrome.webNavigation.onCompleted.addListener(event => {
    console.log("Web navigation detected.");
    handleNavigation(event);
  }, createFilterFromBlacklist(sites));
});
