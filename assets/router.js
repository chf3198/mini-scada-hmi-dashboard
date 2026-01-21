'use strict';

/**
 * @module router
 * @description Hash-based SPA routing for the Mini SCADA HMI Dashboard.
 * Handles URL hash changes and view state management.
 * @requires config/constants
 * @author Mini SCADA HMI Team
 * @license MIT
 */

// ============================================================================
// ROUTING STATE
// ============================================================================

/** @type {string} Currently active view - initialized from URL hash on load */
let currentView = parseRoute(window.location.hash);

// ============================================================================
// ROUTE PARSING
// ============================================================================

/**
 * Parses the URL hash and returns the corresponding view constant.
 * @param {string} hash - The URL hash (e.g., '#/machine/1')
 * @returns {string} The view constant from VIEWS
 * @pure
 */
function parseRoute(hash) {
    if (hash.startsWith('#/machine/')) {
        return VIEWS.MACHINE;
    } else if (hash === '#/runbooks') {
        return VIEWS.RUNBOOKS;
    } else if (hash === '#/commissioning') {
        return VIEWS.COMMISSIONING;
    } else if (hash === '#/help') {
        return VIEWS.HELP;
    }
    return VIEWS.OVERVIEW;
}

/**
 * Extracts the machine ID from a machine detail route.
 * @param {string} hash - The URL hash (e.g., '#/machine/1')
 * @returns {string|null} The machine ID or null if not a machine route
 * @pure
 */
function getMachineIdFromHash(hash) {
    if (hash.startsWith('#/machine/')) {
        return hash.split('/')[2];
    }
    return null;
}

/**
 * Gets the current view state.
 * @returns {string} The current view constant
 */
function getCurrentView() {
    return currentView;
}

/**
 * Sets the current view state.
 * @param {string} view - The view constant to set
 */
function setCurrentView(view) {
    currentView = view;
}

// ============================================================================
// NAVIGATION HIGHLIGHTING
// ============================================================================

/**
 * Updates navigation link highlighting based on current view.
 * Machine detail view highlights Overview as its parent.
 * @sideeffect Modifies CSS classes on navigation elements
 */
function updateNavHighlight() {
    const navLinks = document.querySelectorAll('[data-route]');
    // Machine detail shows Overview as active (parent view)
    const activeRoute = currentView === VIEWS.MACHINE ? VIEWS.OVERVIEW : currentView;
    
    navLinks.forEach(link => {
        const route = link.getAttribute('data-route');
        if (route === activeRoute) {
            link.classList.add('bg-blue-700', 'font-bold', 'shadow-inner');
            link.classList.remove('hover:bg-blue-500');
        } else {
            link.classList.remove('bg-blue-700', 'font-bold', 'shadow-inner');
            link.classList.add('hover:bg-blue-500');
        }
    });
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

/**
 * Hash-based routing handler.
 * Parses the URL hash and updates the current view accordingly.
 */
window.addEventListener('hashchange', () => {
    currentView = parseRoute(window.location.hash);
    renderCurrentView();
});
