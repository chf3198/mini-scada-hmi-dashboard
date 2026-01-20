// Self-tests for key functions
// Run with ?test=1 in URL

if (window.location.search.includes('test=1')) {
    console.log('Running self-tests...');

    // Test event generation
    const initialEvents = events.length;
    generateEvent(1, 'INFO', 'Test event');
    console.assert(events.length === initialEvents + 1, 'Event generation failed');
    console.assert(events[0].message === 'Test event', 'Event message incorrect');

    // Test downtime calculation
    const initialDowntime = downtimeMinutesToday;
    addDowntimeEntry(1, 'Test', 'Notes', Date.now() - 60000, Date.now());
    updateMetrics();
    console.assert(downtimeMinutesToday > initialDowntime, 'Downtime calculation failed');

    // Test checklist persistence
    const originalChecked = commissioningChecklist.Safety[0].checked;
    commissioningChecklist.Safety[0].checked = !originalChecked;
    saveChecklistToLocalStorage();
    loadChecklistFromLocalStorage();
    console.assert(commissioningChecklist.Safety[0].checked === !originalChecked, 'Checklist persistence failed');

    // Test simulation start/stop
    console.assert(typeof startSimulation === 'function', 'startSimulation should be a function');
    console.assert(typeof stopSimulation === 'function', 'stopSimulation should be a function');

    // Test renderHelp function exists and returns content
    console.assert(typeof renderHelp === 'function', 'renderHelp should be a function');
    const helpContent = renderHelp();
    console.assert(helpContent.includes('User Manual'), 'renderHelp should include User Manual title');
    console.assert(helpContent.includes('SCADA'), 'renderHelp should explain SCADA terminology');

    console.log('Self-tests completed.');
}