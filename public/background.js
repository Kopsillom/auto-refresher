// Background script to handle alarms and refresh tabs
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith('refresh_tab_')) {
    const tabId = parseInt(alarm.name.replace('refresh_tab_', ''), 10);
    chrome.tabs.reload(tabId);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.alarms.clear(`refresh_tab_${tabId}`);
});
