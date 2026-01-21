'use strict';

/**
 * @module handlers
 * @description Event handlers and user interaction logic for the Mini SCADA HMI Dashboard.
 * Contains form handlers, UI toggles, and user-triggered actions.
 * @requires config/constants
 * @requires data
 * @requires utils
 * @requires templates
 * @author Mini SCADA HMI Team
 * @license MIT
 */

// ============================================================================
// FORM HANDLERS
// ============================================================================

/**
 * Handles downtime form submission for a machine.
 * @param {Event} formEvent - The form submit event
 * @param {number} machineId - The machine ID to add downtime for
 * @sideeffect Adds downtime entry, resets form, re-renders view
 */
function addDowntime(formEvent, machineId) {
    formEvent.preventDefault();
    const form = formEvent.target;
    const reason = form.reason.value;
    const notes = form.notes.value;
    const start = form.start.value;
    const end = form.end.value;
    addDowntimeEntry(machineId, reason, notes, start, end);
    form.reset();
    renderCurrentView();
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

/**
 * Filters the runbook list based on search input.
 * Matches against runbook code or title (case-insensitive).
 * Uses templateRunbookCard from templates.js.
 * @sideeffect Re-renders the runbook list in the DOM
 */
function filterRunbooks() {
    const searchQuery = document.getElementById('runbook-search').value.toLowerCase();
    const listContainer = document.getElementById('runbook-list');
    
    const filteredRunbooks = runbooks.filter(runbook => 
        runbook.code.toLowerCase().includes(searchQuery) || 
        runbook.title.toLowerCase().includes(searchQuery)
    );
    
    listContainer.innerHTML = filteredRunbooks.map(templateRunbookCard).join('');
}

// ============================================================================
// CHECKLIST HANDLERS
// ============================================================================

/**
 * Toggles a checklist item's checked state and persists to localStorage.
 * @param {string} section - The checklist section name (e.g., 'Safety')
 * @param {string} itemName - The checklist item text to toggle
 * @sideeffect Modifies commissioningChecklist, persists to localStorage
 */
function toggleChecklist(section, itemName) {
    const checklistItem = commissioningChecklist[section].find(
        targetItem => targetItem.item === itemName
    );
    if (checklistItem) {
        checklistItem.checked = !checklistItem.checked;
        saveChecklistToLocalStorage();
    }
}

// ============================================================================
// UI HANDLERS
// ============================================================================

/**
 * Dark mode toggle button handler.
 * Toggles the 'dark' class on the document root and updates button icon.
 */
document.getElementById('dark-mode-toggle').addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    const toggleButton = document.getElementById('dark-mode-toggle');
    toggleButton.textContent = document.documentElement.classList.contains('dark') ? '☀️' : '🌙';
});
