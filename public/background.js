function updateStatusIcon(isActive) {
  const iconPath = isActive ? 'icon_on.png' : 'icon_off.png';
  const badgeColor = isActive ? '#22c55e' : '#ef4444';

  // Update the icon
  chrome.action.setIcon({
    path: {
      "128": iconPath
    }
  });

  // Update the badge text and color
  chrome.action.setBadgeText({ text: isActive ? 'ON' : 'OFF' });
  chrome.action.setBadgeBackgroundColor({ color: badgeColor });
}

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

// Listen for messages from the popup to update the icon
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'UPDATE_STATUS') {
    updateStatusIcon(message.isActive);
  }
});

// Initialize icon on startup
chrome.runtime.onInstalled.addListener(() => {
  updateStatusIcon(false);
});
