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

    // Test validateChecklistJSON function
    console.assert(typeof validateChecklistJSON === 'function', 'validateChecklistJSON should be a function');
    
    // Test valid structure
    const validData = {
        Safety: [{ item: 'Test', checked: true }],
        IO: [{ item: 'Test', checked: false }],
        Network: [{ item: 'Test', checked: true }],
        Sensors: [{ item: 'Test', checked: false }],
        Throughput: [{ item: 'Test', checked: true }],
        Handoff: [{ item: 'Test', checked: false }]
    };
    const validResult = validateChecklistJSON(validData);
    console.assert(validResult.valid === true, 'Valid checklist should pass validation');
    
    // Test invalid: not an object
    const invalidNotObject = validateChecklistJSON('string');
    console.assert(invalidNotObject.valid === false, 'String should fail validation');
    
    // Test invalid: missing section
    const invalidMissing = validateChecklistJSON({ Safety: [] });
    console.assert(invalidMissing.valid === false, 'Missing sections should fail');
    
    // Test invalid: wrong item structure
    const invalidItem = validateChecklistJSON({
        Safety: [{ item: 'Test', checked: 'yes' }], // checked should be boolean
        IO: [], Network: [], Sensors: [], Throughput: [], Handoff: []
    });
    console.assert(invalidItem.valid === false, 'Invalid item structure should fail');

    console.log('Self-tests completed.');
}