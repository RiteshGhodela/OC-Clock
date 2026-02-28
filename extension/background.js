// Openclaw Clock Extension — Background Service Worker
// Updates the browser action badge with current time every minute

function updateBadge() {
    const now = new Date();
    const h = now.getHours() % 12 || 12;
    const m = String(now.getMinutes()).padStart(2, '0');
    chrome.action.setBadgeText({ text: `${h}:${m}` });
    chrome.action.setBadgeBackgroundColor({ color: '#ff5722' });
}

updateBadge();
setInterval(updateBadge, 60000);
