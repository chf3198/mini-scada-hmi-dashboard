// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Curtis Franks <curtisfranks@gmail.com>

'use strict';

/**
 * @file Event handlers and user interaction logic for the Mini SCADA HMI Dashboard.
 * @module handlers
 * @description Contains form handlers, UI toggles, and user-triggered actions.
 * Includes error handling, input validation, and accessibility support.
 * @requires config/constants
 * @requires data
 * @requires utils
 * @requires templates
 * @requires security
 * @author Curtis Franks <curtisfranks@gmail.com>
 * @copyright 2026 Curtis Franks
 * @license MIT
 * @see {@link https://github.com/chf3198/mini-scada-hmi-dashboard}
 */

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

/** @type {number|null} Debounce timer ID for search input */
let searchDebounceTimer = null;

/**
 * Debounces a function call by the specified delay.
 * @param {Function} func - The function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// ============================================================================
// FORM HANDLERS
// ============================================================================

/**
 * Handles downtime form submission for a machine.
 * Includes input validation and error handling.
 * @param {Event} formEvent - The form submit event
 * @param {number} machineId - The machine ID to add downtime for
 * @sideeffect Adds downtime entry, resets form, re-renders view
 */
function addDowntime(formEvent, machineId) {
    try {
        formEvent.preventDefault();
        
        // Validate machine ID
        const validMachineId = validateMachineId(machineId);
        if (validMachineId === null) {
            console.error('Invalid machine ID:', machineId);
            alert('Error: Invalid machine ID');
            return;
        }
        
        const form = formEvent.target;
        const reason = sanitizeInput(form.reason.value);
        const notes = sanitizeInput(form.notes.value);
        const start = form.start.value;
        const end = form.end.value;
        
        // Validate date range
        const startTime = new Date(start).getTime();
        const endTime = new Date(end).getTime();
        
        if (isNaN(startTime) || isNaN(endTime)) {
            alert('Error: Please enter valid start and end dates');
            return;
        }
        
        if (endTime <= startTime) {
            alert('Error: End time must be after start time');
            return;
        }
        
        addDowntimeEntry(validMachineId, reason, notes, start, end);
        form.reset();
        renderCurrentView();
        
        // Announce to screen readers
        announceToScreenReader('Downtime entry added successfully');
        
    } catch (error) {
        console.error('Error adding downtime:', error);
        alert('An error occurred while adding downtime. Please try again.');
    }
}

// ============================================================================
// RUNBOOK HANDLERS
// ============================================================================

/**
 * Toggles visibility of a runbook's procedure steps.
 * Closes all other open runbooks for accordion behavior.
 * @param {string} runbookCode - The runbook code to toggle (e.g., 'ALRM-001')
 * @sideeffect Modifies DOM classes for visibility
 */
function showRunbook(runbookCode) {
    const runbook = runbooks.find(targetRunbook => targetRunbook.code === runbookCode);
    if (!runbook) return;
    
    // Close all other open runbooks (accordion behavior)
    runbooks.forEach(otherRunbook => {
        if (otherRunbook.code !== runbookCode) {
            const otherDetail = document.getElementById(`detail-${otherRunbook.code}`);
            const otherChevron = document.getElementById(`chevron-${otherRunbook.code}`);
            if (otherDetail) otherDetail.classList.add('hidden');
            if (otherChevron) otherChevron.textContent = '▶';
        }
    });
    
    // Toggle the clicked runbook
    const detailElement = document.getElementById(`detail-${runbookCode}`);
    const chevronElement = document.getElementById(`chevron-${runbookCode}`);
    if (detailElement.classList.contains('hidden')) {
        detailElement.classList.remove('hidden');
        chevronElement.textContent = '▼';
    } else {
        detailElement.classList.add('hidden');
        chevronElement.textContent = '▶';
    }
}

// ============================================================================
// COMMISSIONING SECTION HANDLERS (Accordion Pattern)
// ============================================================================

/**
 * Determines the new expanded state for a section (pure function).
 * @param {boolean} currentlyExpanded - Whether section is currently expanded
 * @returns {boolean} New expanded state
 * @pure
 */
function getNextExpandedState(currentlyExpanded) {
    return !currentlyExpanded;
}

/**
 * Determines visibility state for section elements (pure function).
 * @param {boolean} expanded - Whether section should be expanded
 * @returns {{detailHidden: boolean, chevronText: string}}
 * @pure
 */
function getSectionVisibilityState(expanded) {
    return {
        detailHidden: !expanded,
        chevronText: expanded ? '▼' : '▶'
    };
}

/**
 * Toggles a commissioning section's expanded/collapsed state.
 * Implements accordion behavior - only one section open at a time.
 * @param {string} sectionName - The section name to toggle
 * @sideeffect Modifies DOM classes for visibility
 */
function toggleCommissioningSection(sectionName) {
    const sections = Object.keys(commissioningChecklist);
    
    // Close all other sections (accordion behavior)
    sections.forEach(section => {
        if (section !== sectionName) {
            const otherDetail = document.getElementById(`detail-section-${section}`);
            const otherChevron = document.getElementById(`chevron-section-${section}`);
            if (otherDetail) otherDetail.classList.add('hidden');
            if (otherChevron) otherChevron.textContent = '▶';
        }
    });
    
    // Toggle the clicked section
    const detailElement = document.getElementById(`detail-section-${sectionName}`);
    const chevronElement = document.getElementById(`chevron-section-${sectionName}`);
    
    if (!detailElement || !chevronElement) {
        console.error(`Section elements not found for: ${sectionName}`);
        return;
    }
    
    const currentlyExpanded = !detailElement.classList.contains('hidden');
    const newState = getSectionVisibilityState(getNextExpandedState(currentlyExpanded));
    
    if (newState.detailHidden) {
        detailElement.classList.add('hidden');
    } else {
        detailElement.classList.remove('hidden');
    }
    chevronElement.textContent = newState.chevronText;
}

/**
 * Expands all commissioning sections.
 * @sideeffect Modifies DOM classes for visibility
 */
function expandAllSections() {
    const sections = Object.keys(commissioningChecklist);
    const expandedState = getSectionVisibilityState(true);
    
    sections.forEach(section => {
        const detailElement = document.getElementById(`detail-section-${section}`);
        const chevronElement = document.getElementById(`chevron-section-${section}`);
        if (detailElement) detailElement.classList.remove('hidden');
        if (chevronElement) chevronElement.textContent = expandedState.chevronText;
    });
}

/**
 * Collapses all commissioning sections.
 * @sideeffect Modifies DOM classes for visibility
 */
function collapseAllSections() {
    const sections = Object.keys(commissioningChecklist);
    const collapsedState = getSectionVisibilityState(false);
    
    sections.forEach(section => {
        const detailElement = document.getElementById(`detail-section-${section}`);
        const chevronElement = document.getElementById(`chevron-section-${section}`);
        if (detailElement) detailElement.classList.add('hidden');
        if (chevronElement) chevronElement.textContent = collapsedState.chevronText;
    });
}

// ============================================================================
// HELP SECTION HANDLERS (Accordion Pattern)
// ============================================================================

/**
 * Toggles a help section's expanded/collapsed state.
 * Implements accordion behavior - only one section open at a time.
 * @param {string} sectionId - The section ID to toggle
 * @sideeffect Modifies DOM classes for visibility
 */
function toggleHelpSection(sectionId) {
    // Close all other sections (accordion behavior)
    HELP_SECTIONS.forEach(section => {
        if (section.id !== sectionId) {
            const otherDetail = document.getElementById(`detail-help-${section.id}`);
            const otherChevron = document.getElementById(`chevron-help-${section.id}`);
            if (otherDetail) otherDetail.classList.add('hidden');
            if (otherChevron) otherChevron.textContent = '▶';
        }
    });
    
    // Toggle the clicked section
    const detailElement = document.getElementById(`detail-help-${sectionId}`);
    const chevronElement = document.getElementById(`chevron-help-${sectionId}`);
    
    if (!detailElement || !chevronElement) {
        console.error(`Help section elements not found for: ${sectionId}`);
        return;
    }
    
    const currentlyExpanded = !detailElement.classList.contains('hidden');
    const newState = getSectionVisibilityState(getNextExpandedState(currentlyExpanded));
    
    if (newState.detailHidden) {
        detailElement.classList.add('hidden');
    } else {
        detailElement.classList.remove('hidden');
    }
    chevronElement.textContent = newState.chevronText;
}

/**
 * Expands all help sections.
 * @sideeffect Modifies DOM classes for visibility
 */
function expandAllHelpSections() {
    const expandedState = getSectionVisibilityState(true);
    
    HELP_SECTIONS.forEach(section => {
        const detailElement = document.getElementById(`detail-help-${section.id}`);
        const chevronElement = document.getElementById(`chevron-help-${section.id}`);
        if (detailElement) detailElement.classList.remove('hidden');
        if (chevronElement) chevronElement.textContent = expandedState.chevronText;
    });
}

/**
 * Collapses all help sections.
 * @sideeffect Modifies DOM classes for visibility
 */
function collapseAllHelpSections() {
    const collapsedState = getSectionVisibilityState(false);
    
    HELP_SECTIONS.forEach(section => {
        const detailElement = document.getElementById(`detail-help-${section.id}`);
        const chevronElement = document.getElementById(`chevron-help-${section.id}`);
        if (detailElement) detailElement.classList.add('hidden');
        if (chevronElement) chevronElement.textContent = collapsedState.chevronText;
    });
}

// ============================================================================
// RUNBOOK HANDLERS
// ============================================================================

/**
 * Filters the runbook list based on search input.
 * Debounced to avoid excessive re-renders during typing.
 * Uses templateRunbookCard from templates.js.
 * @sideeffect Re-renders the runbook list in the DOM
 */
const filterRunbooks = debounce(function() {
    try {
        const searchInput = document.getElementById('runbook-search');
        const listContainer = document.getElementById('runbook-list');
        
        if (!searchInput || !listContainer) {
            console.error('Runbook search elements not found');
            return;
        }
        
        const searchQuery = sanitizeInput(searchInput.value).toLowerCase();
        
        const filteredRunbooks = runbooks.filter(runbook => 
            runbook.code.toLowerCase().includes(searchQuery) || 
            runbook.title.toLowerCase().includes(searchQuery)
        );
        
        listContainer.innerHTML = filteredRunbooks.map(templateRunbookCard).join('');
        
        // Update ARIA live region for screen readers
        const resultCount = filteredRunbooks.length;
        announceToScreenReader(`${resultCount} runbook${resultCount !== 1 ? 's' : ''} found`);
        
    } catch (error) {
        console.error('Error filtering runbooks:', error);
    }
}, 150);

// ============================================================================
// CHECKLIST HANDLERS (with Immutable Patterns)
// ============================================================================

/**
 * Pure function to toggle a checklist item immutably.
 * @param {Object} checklist - Current checklist object
 * @param {string} section - Section name
 * @param {string} itemName - Item name to toggle
 * @returns {Object} New checklist object with item toggled
 * @pure
 */
function toggleChecklistItemImmutable(checklist, section, itemName) {
    if (!checklist[section]) {
        return checklist;
    }
    
    return {
        ...checklist,
        [section]: checklist[section].map(item =>
            item.item === itemName
                ? { ...item, checked: !item.checked }
                : item
        )
    };
}

/**
 * Toggles a checklist item's checked state and persists to localStorage.
 * Uses immutable update pattern internally.
 * @param {string} section - The checklist section name (e.g., 'Safety')
 * @param {string} itemName - The checklist item text to toggle
 * @sideeffect Modifies commissioningChecklist, persists to localStorage
 */
function toggleChecklist(section, itemName) {
    try {
        // Validate section exists
        if (!commissioningChecklist[section]) {
            console.error('Invalid checklist section:', section);
            return;
        }
        
        const sanitizedItemName = sanitizeInput(itemName);
        
        // Get current state before toggle for announcement
        const currentItem = commissioningChecklist[section].find(
            targetItem => targetItem.item === sanitizedItemName
        );
        
        if (currentItem) {
            // Apply immutable update
            commissioningChecklist = toggleChecklistItemImmutable(
                commissioningChecklist,
                section,
                sanitizedItemName
            );
            
            saveChecklistToLocalStorage();
            
            // Announce state change to screen readers (new state is opposite of current)
            const newState = !currentItem.checked ? 'checked' : 'unchecked';
            announceToScreenReader(`${sanitizedItemName} ${newState}`);
        }
    } catch (error) {
        console.error('Error toggling checklist:', error);
    }
}

// ============================================================================
// ACCESSIBILITY UTILITIES
// ============================================================================

/**
 * Announces a message to screen readers via ARIA live region.
 * @param {string} message - The message to announce
 */
function announceToScreenReader(message) {
    const announcer = document.getElementById('sr-announcer');
    if (announcer) {
        announcer.textContent = message;
        // Clear after announcement to allow repeated announcements of same text
        setTimeout(() => { announcer.textContent = ''; }, 1000);
    }
}

/**
 * Handles keyboard navigation for interactive elements.
 * @param {KeyboardEvent} event - The keyboard event
 * @param {Function} action - The action to perform on Enter/Space
 */
function handleKeyboardActivation(event, action) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        action();
    }
}

// ============================================================================
// UI HANDLERS
// ============================================================================

/**
 * Dark mode toggle button handler.
 * Toggles the 'dark' class on the document root and updates button icon.
 * Re-renders charts to update colors for new theme.
 * Includes error handling and accessibility announcement.
 */
document.getElementById('dark-mode-toggle').addEventListener('click', () => {
    try {
        document.documentElement.classList.toggle('dark');
        const toggleButton = document.getElementById('dark-mode-toggle');
        const isDark = document.documentElement.classList.contains('dark');
        toggleButton.textContent = isDark ? '☀️' : '🌙';
        toggleButton.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
        
        // Re-render charts with updated colors for the new theme
        if (typeof renderCharts === 'function') {
            const downtimeCanvas = document.getElementById('downtimeChart');
            if (downtimeCanvas) {
                renderCharts();
            }
        }
        
        announceToScreenReader(isDark ? 'Dark mode enabled' : 'Light mode enabled');
    } catch (error) {
        console.error('Error toggling dark mode:', error);
    }
});
