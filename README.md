# Mini SCADA HMI Dashboard

A tiny, zip-friendly demo of a Supervisory Control and Data Acquisition (SCADA) Human-Machine Interface (HMI) dashboard for factory monitoring.

## What this demonstrates
- **Real-time machine monitoring**: Status indicators, heartbeats, health scores.
- **Alarm and event management**: Severity-coded events, acknowledgements, downtime tracking.
- **Operational tools**: Runbooks for troubleshooting, commissioning checklists for setup.
- **Simulation and testing**: Automated event generation, rate testing for throughput validation.

## Setup
1. Download the repository as a ZIP file.
2. Unzip to a local folder.
3. Open `index.html` in any modern web browser (works via `file://` protocol).

No installation or build steps required. All dependencies are loaded via CDN.

## Key Features
- **Overview Dashboard**: Machine cards with status, key metrics (alarms, downtime), charts for downtime and events.
- **Machine Detail View**: Event log, health panel, downtime entry form, rate testing.
- **Runbooks**: Searchable list of troubleshooting guides.
- **Commissioning Checklist**: FAT/SAT-style checklist with localStorage persistence and JSON export.
- **Simulation**: Start/stop automated updates, realistic event generation.
- **Dark Mode**: Toggle for operator-friendly viewing.
- **Responsive Design**: Works on desktop and mobile.

## Architecture
- `index.html`: Entry point with CDN includes and basic layout.
- `assets/data.js`: Seed data for machines, events, runbooks, checklist.
- `assets/utils.js`: Utility functions for formatting, simulation, persistence.
- `assets/app.js`: Main app logic, routing, rendering functions.
- `assets/styles.css`: Minimal custom styles (Tailwind handles most).
- `assets/tests.js`: Lightweight self-tests (run with `?test=1` in URL).

Total codebase: ~500 lines, focused on clarity and minimalism.

## Screenshots
- [Overview Dashboard](docs/overview.png)
- [Machine Detail View](docs/machine.png)

## Next Steps for Real Factory Implementation
- **OPC-UA/MQTT Integration**: Replace simulation with real protocol connections for live data.
- **Authentication & Authorization**: Add user login, role-based access (operators vs. admins).
- **Historian Database**: Store events/downtime in SQL/NoSQL for long-term analysis.
- **Real-time Protocols**: WebSockets for push updates instead of polling.
- **Scalability**: Backend API (Node.js/Python) for data processing and alerts.
- **Advanced Analytics**: Trend analysis, predictive maintenance with ML.
- **Mobile App**: PWA or native app for on-the-go monitoring.

Built with modern web standards for easy extension and deployment.