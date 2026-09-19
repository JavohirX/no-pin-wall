(function () {
  'use strict';

  const SELECTORS_TO_REMOVE = [
    'div[role="dialog"][aria-label="modal"]',
    'div[data-test-id="login-modal-redesign"]',
    'div[data-test-id="full-page-signup-modal"]',
    'div[data-test-id="signup-modal-inspired"]',
    'div[data-test-id="fullPageSignupModal"]',
    'div[data-test-id="unauth-banner"]',
    'div[data-test-id="sheet-container"]',
    'div[data-test-id="giftwrap"]',
    'div[data-test-id="giftWrap"]',
    'div[data-test-id="mobile-signup-mask"]',
    'div[data-test-id="mobile-modal-mask-overlay"]',
    'div[data-test-id*="backdrop"]'
  ];

  function isSafeToRemove(container) {
    if (!container || container === document.body || container === document.documentElement) {
      return false;
    }
    if (container.id === 'desktopWrapper' || container.id === 'root' || container.id === '__next') {
      return false;
    }
    if (container.querySelector('#desktopWrapper') || container.querySelector('header') || container.querySelector('nav')) {
      return false;
    }
    return true;
  }

  function restoreInteractions() {
    if (document.body) {
      document.body.style.setProperty('overflow', 'auto', 'important');
      document.body.style.setProperty('position', 'static', 'important');
      document.body.style.setProperty('height', 'auto', 'important');
      document.body.style.setProperty('pointer-events', 'auto', 'important');
    }
    if (document.documentElement) {
      document.documentElement.style.setProperty('overflow', 'auto', 'important');
      document.documentElement.style.setProperty('position', 'static', 'important');
      document.documentElement.style.setProperty('height', 'auto', 'important');
      document.documentElement.style.setProperty('pointer-events', 'auto', 'important');
    }

    // Restore inert elements (browser API that blocks clicks on background content)
    const inertElements = document.querySelectorAll('[inert]');
    inertElements.forEach((el) => {
      el.removeAttribute('inert');
      try {
        el.inert = false;
      } catch (e) {}
    });

    // Ensure desktopWrapper allows interactions and scrolling
    const desktopWrapper = document.getElementById('desktopWrapper');
    if (desktopWrapper) {
      desktopWrapper.style.setProperty('position', 'relative', 'important');
      desktopWrapper.style.setProperty('overflow', 'visible', 'important');
      desktopWrapper.style.setProperty('height', 'auto', 'important');
      desktopWrapper.style.setProperty('pointer-events', 'auto', 'important');
      if (desktopWrapper.getAttribute('aria-hidden') === 'true') {
        desktopWrapper.removeAttribute('aria-hidden');
      }
    }

    // Restore any main containers that might have been disabled
    const mainContainers = document.querySelectorAll('main, div[role="main"], #root');
    mainContainers.forEach((el) => {
      if (el.style.pointerEvents === 'none') {
        el.style.removeProperty('pointer-events');
      }
      if (el.getAttribute('aria-hidden') === 'true') {
        el.removeAttribute('aria-hidden');
      }
    });
  }

  function removeModals() {
    let removed = false;

    // 1. Remove targeted modal dialogs and outer fixed containers
    for (const selector of SELECTORS_TO_REMOVE) {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        const fixedContainer = el.closest('div[style*="position: fixed"], div[style*="position:fixed"]');
        const dialogContainer = el.closest('[role="dialog"]');

        let target = el;
        if (fixedContainer && isSafeToRemove(fixedContainer)) {
          target = fixedContainer;
        } else if (dialogContainer && isSafeToRemove(dialogContainer)) {
          target = dialogContainer;
        }

        target.remove();
        removed = true;
      });
    }

    // 2. Remove darkened backdrop / overlay elements
    const backdropCandidates = document.querySelectorAll(`
      div[style*="rgba(0, 0, 0"],
      div[style*="rgba(0,0,0"],
      div[style*="rgb(0 0 0 /"],
      div[style*="z-index: 10001"],
      div[style*="z-index:10001"],
      div[style*="z-index: 10000"],
      div[style*="z-index:10000"],
      div[style*="z-index: 9999"],
      div[style*="z-index:9999"]
    `);

    backdropCandidates.forEach((el) => {
      const style = el.getAttribute('style') || '';
      const hasDarkBg = /background(-color)?:\s*rgba?\(\s*0\s*,\s*0\s*,\s*0/.test(style);
      const hasHighZ = /z-index:\s*(1000[0-9]|100[1-9][0-9]|999[0-9]|[1-9][0-9]{4,})/.test(style);

      if ((hasDarkBg && hasHighZ) || (hasDarkBg && !el.children.length) || (hasHighZ && !el.children.length)) {
        if (isSafeToRemove(el) && !el.querySelector('article') && !el.querySelector('img')) {
          el.remove();
          removed = true;
        }
      }
    });

    restoreInteractions();
    return removed;
  }

  // Set up MutationObserver to catch dynamically injected modals
  function setupObserver() {
    const target = document.documentElement || document.body;
    if (!target) return;

    const observer = new MutationObserver(() => {
      removeModals();
    });

    observer.observe(target, {
      childList: true,
      subtree: true
    });
  }

  // Initial runs
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      removeModals();
      setupObserver();
    });
  } else {
    removeModals();
    setupObserver();
  }

  // Ensure scroll and interactions are restored once page fully loads
  window.addEventListener('load', () => {
    removeModals();
  });

  // Listen for messages from popup if user clicks "Force Clean Page"
  chrome.runtime?.onMessage?.addListener((message, sender, sendResponse) => {
    if (message.action === 'clean_page') {
      removeModals();
      sendResponse({ status: 'cleaned' });
    }
  });
})();
