const filter = {
  url: [
    {
      hostContains: "facebook.com"
    }
  ]
};

chrome.webNavigation.onCommitted.addListener(
  function(event) {
    blur(event.tabId);
  },
  filter
);

function blur(tabId) {
  chrome.tabs.executeScript(tabId, {
    file: "blur.js"
  });
}

// OTHER IDEAS

// function redirect(url, tabId) {
//   const updateProperties = { url: url };
//   chrome.tabs.update(tabId, updateProperties);
// }

// function stop(tabId) {
//   chrome.tabs.executeScript(tabId, {
//     runAt: "document_start",
//     code: "window.stop();"
//   });
// }

// chrome.webNavigation.onBeforeNavigate.addListener(function(event) {
//   alert("Get back to work.");
//   if (window.confirm("Are you sure?")) {
//     redirect("www.google.com", event.tabId);
//   }
// }, filter);

// chrome.webNavigation.onCommitted.addListener(function(event) {
//   stop(event.tabId);
// }, filter);
