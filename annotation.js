// Lightweight activator for on-page annotation mode
// This script is injected into the page to request toggling the draw-on-page overlay.
(function () {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.tabs) {
      // If we have tabs API (unlikely in content), fallback to runtime message
      chrome.runtime.sendMessage({ action: 'toggleDrawOnPageForActive' });
    } else if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ action: 'toggleDrawOnPageForActive' });
    } else {
      // As a fallback, dispatch a custom event that draw-on-page.js can listen to (if present)
      window.dispatchEvent(new CustomEvent('uw_toggle_draw_on_page'));
    }
  } catch (e) {
    // noop
  }
})();


