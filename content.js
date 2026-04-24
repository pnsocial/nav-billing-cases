/**
 * GCP Billing Support Navigator - content.js
 * 
 * Objective: Inject a "Support Case" menu item into the GCP Billing Console navigation.
 */

(function() {
    'use strict';

    const SUPPORT_CASE_ID = 'gcp-billing-support-case-nav-item';
    const BILLING_ID_REGEX = /[A-F0-9]{6}-[A-F0-9]{6}-[A-F0-9]{6}/;

    /**
     * Extracts the Billing ID from the current URL.
     * @returns {string|null}
     */
    function getBillingId() {
        const match = window.location.href.match(BILLING_ID_REGEX);
        return match ? match[0] : null;
    }

    /**
     * Deeply searches for an element by text content, traversing Shadow DOM.
     * @param {Element|ShadowRoot} root 
     * @param {string} text 
     * @returns {HTMLElement|null}
     */
    function findElementByTextDeep(root, text) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null, false);
        let node;
        while (node = walker.nextNode()) {
            if (node.textContent.trim() === text) {
                return node;
            }
            if (node.shadowRoot) {
                const found = findElementByTextDeep(node.shadowRoot, text);
                if (found) return found;
            }
        }
        return null;
    }

    /**
     * Injects the "Support Case" menu item if it doesn't already exist.
     */
    function injectSupportCase() {
        const billingId = getBillingId();
        if (!billingId) return;

        // Check if already injected
        if (document.getElementById(SUPPORT_CASE_ID)) return;

        // Find the "Account management" menu item
        const targetNode = findElementByTextDeep(document.body, 'Account management');
        
        if (targetNode) {
            const targetItem = targetNode.closest('a') || targetNode.closest('.cfc-nav-item') || targetNode.closest('div[role="menuitem"]') || targetNode;
            
            if (targetItem && targetItem.parentNode) {
                const newItem = createMenuItem(billingId, targetItem);
                targetItem.parentNode.insertBefore(newItem, targetItem.nextSibling);
                console.log('GCP Support Navigator: Injected "Support Case" item.');
            }
        }
    }

    /**
     * Creates a new menu item by cloning or mimicking the target item's structure.
     * @param {string} billingId 
     * @param {HTMLElement} templateItem 
     * @returns {HTMLElement}
     */
    function createMenuItem(billingId, templateItem) {
        // Clone the template item to inherit styles and structure
        const newItem = templateItem.cloneNode(true);
        newItem.id = SUPPORT_CASE_ID;
        
        // Remove active state if cloned
        newItem.classList.remove('active', 'is-active', 'selected');
        
        // Update Link
        const link = newItem.tagName === 'A' ? newItem : newItem.querySelector('a');
        const url = `https://console.cloud.google.com/billing/${billingId}/support/cases`;
        
        if (link) {
            link.href = url;
            // Prevent default if it's an SPA navigation handler
            link.addEventListener('click', (e) => {
                // If GCP uses its own router, we might need to trigger it, 
                // but a simple href change usually works for external/new links.
                // However, since we want to stay in the SPA if possible:
                window.location.href = url;
            });
        } else {
            newItem.addEventListener('click', () => {
                window.location.href = url;
            });
            newItem.style.cursor = 'pointer';
        }

        // Update Text Label
        // Find the element containing "Account management" and change it
        const updateText = (node) => {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.includes('Account management')) {
                node.textContent = 'Support Case';
            } else if (node.childNodes) {
                node.childNodes.forEach(updateText);
            }
        };
        updateText(newItem);

        // Update Icon
        // GCP uses Material Icons or SVGs. We'll try to find the icon container and replace it.
        const iconContainer = newItem.querySelector('mat-icon, .material-icons, i, svg');
        if (iconContainer) {
            if (iconContainer.tagName === 'MAT-ICON' || iconContainer.classList.contains('material-icons')) {
                iconContainer.textContent = 'help_outline';
            } else {
                // Replace with a standard 24x24 path but ensure viewBox is set correctly
                iconContainer.setAttribute('viewBox', '0 0 24 24');
                iconContainer.setAttribute('width', '18');
                iconContainer.setAttribute('height', '18');
                iconContainer.innerHTML = `<path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>`;
            }
        }

        return newItem;
    }

    let injectionTimer = null;

    /**
     * Setup MutationObserver to handle SPA navigation and dynamic loading.
     */
    const observer = new MutationObserver((mutations) => {
        // debounce injection
        if (injectionTimer) clearTimeout(injectionTimer);
        injectionTimer = setTimeout(injectSupportCase, 500);
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Initial check
    injectSupportCase();

})();
