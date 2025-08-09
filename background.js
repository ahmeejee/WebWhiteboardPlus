// Background script for WebWhiteboard+ extension

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('WebWhiteboard+ v1.0 extension installed');
        
        // Set default settings
        chrome.storage.local.set({
            'whiteboard_settings': {
                defaultColor: '#000000',
                defaultStrokeWidth: 2,
                autoSave: true
            }
        });
    }
});

// Handle side panel activation
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'openSidePanel':
            // Open side panel for the current tab
            chrome.sidePanel.open({ tabId: sender.tab.id });
            sendResponse({ success: true });
            break;
        case 'toggleDrawOnPageForActive': {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const tab = tabs && tabs[0];
                if (tab) {
                    chrome.tabs.sendMessage(tab.id, { action: 'toggleDrawOnPage' });
                }
            });
            sendResponse({ success: true });
            break;
        }
            
        case 'saveBoardState':
            // Save whiteboard state to storage
            chrome.storage.local.set({
                [message.key]: message.data
            }).then(() => {
                sendResponse({ success: true });
            }).catch((error) => {
                sendResponse({ success: false, error: error.message });
            });
            return true; // Keep message channel open for async response
            
        case 'loadBoardState':
            // Load whiteboard state from storage
            chrome.storage.local.get([message.key]).then((result) => {
                sendResponse({ success: true, data: result[message.key] });
            }).catch((error) => {
                sendResponse({ success: false, error: error.message });
            });
            return true; // Keep message channel open for async response
            
        case 'clearBoardState':
            // Clear whiteboard state from storage
            chrome.storage.local.remove([message.key]).then(() => {
                sendResponse({ success: true });
            }).catch((error) => {
                sendResponse({ success: false, error: error.message });
            });
            return true; // Keep message channel open for async response
            
        default:
            sendResponse({ success: false, error: 'Unknown action' });
    }
});

// Handle tab updates to refresh draw-on-page functionality
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        // Inject scripts and CSS if needed (for dynamic content)
        chrome.scripting.insertCSS({ target: { tabId }, files: ['whiteboard.css'] }).catch(() => {});
        chrome.scripting.executeScript({ target: { tabId }, files: ['whiteboard.js'] }).catch(() => {});
        chrome.scripting.executeScript({ target: { tabId }, files: ['draw-on-page.js'] }).catch(() => {});
    }
});

// Context menu for quick access (optional)
chrome.contextMenus.create({
    id: 'openWhiteboard',
    title: 'Open WebWhiteboard+',
    contexts: ['page']
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'openWhiteboard') {
        chrome.sidePanel.open({ tabId: tab.id });
    }
});

// Handle keyboard shortcuts (if defined in manifest)
chrome.commands.onCommand.addListener((command) => {
    switch (command) {
        case 'toggle-draw-on-page':
            // Send message to content script to toggle draw-on-page mode
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleDrawOnPage' });
                }
            });
            break;
            
        case 'open-side-panel':
            // Open side panel for current tab
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    chrome.sidePanel.open({ tabId: tabs[0].id });
                }
            });
            break;
    }
});

// Clean up old storage data periodically
chrome.alarms.create('cleanupStorage', { periodInMinutes: 60 * 24 }); // Daily cleanup

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'cleanupStorage') {
        cleanupOldStorageData();
    }
});

async function cleanupOldStorageData() {
    try {
        const result = await chrome.storage.local.get();
        const keysToRemove = [];
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
        
        Object.keys(result).forEach(key => {
            if (key.includes('draw_on_page_whiteboard_data_')) {
                // Check if data is old (this is a simplified check)
                // In a real implementation, you might store timestamps
                if (Math.random() < 0.1) { // Remove 10% of old data randomly
                    keysToRemove.push(key);
                }
            }
        });
        
        if (keysToRemove.length > 0) {
            await chrome.storage.local.remove(keysToRemove);
            console.log(`WebWhiteboard+ cleaned up ${keysToRemove.length} old whiteboard data entries`);
        }
    } catch (error) {
        console.error('Error during storage cleanup:', error);
    }
}
