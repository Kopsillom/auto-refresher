async function updateStatusIcon(tabId, isActive) {
  if (!tabId) return;
  
  const iconPath = isActive ? 'icon_on.png' : 'icon_off.png';
  const badgeColor = isActive ? '#22c55e' : '#ef4444';

  // Update the icon for this specific tab
  chrome.action.setIcon({
    tabId: tabId,
    path: {
      "128": iconPath
    }
  });

  // Update the badge text and color for this specific tab
  chrome.action.setBadgeText({ tabId: tabId, text: isActive ? 'ON' : 'OFF' });
  chrome.action.setBadgeBackgroundColor({ tabId: tabId, color: badgeColor });
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
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPDATE_STATUS') {
    updateStatusIcon(message.tabId, message.isActive);
  }
});

// Initialize icon on startup (global default)
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({ text: 'OFF' });
  chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
});
