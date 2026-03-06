# Mini SCADA HMI Dashboard

[![No Build Required](https://img.shields.io/badge/build-no_build_required-brightgreen?style=flat-square)](https://github.com/chf3198/mini-scada-hmi-dashboard)
[![Works Offline](https://img.shields.io/badge/works-offline-purple?style=flat-square)](https://github.com/chf3198/mini-scada-hmi-dashboard)
[![License: PolyForm NC](https://img.shields.io/badge/License-PolyForm%20NC%201.0-blue?style=flat-square)](LICENSE)
[![JavaScript ES6+](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=flat-square&logo=javascript&logoColor=white)](https://github.com/chf3198/mini-scada-hmi-dashboard)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://github.com/chf3198/mini-scada-hmi-dashboard)
[![~800 Lines](https://img.shields.io/badge/codebase-~800_lines-informational?style=flat-square)](https://github.com/chf3198/mini-scada-hmi-dashboard)

**Mini SCADA HMI Dashboard** is a zero-build, browser-ready simulation of an industrial Human-Machine Interface (HMI) for factory floor monitoring. It demonstrates SCADA concepts — alarm management, runbooks (SOPs), commissioning checklists (FAT/SAT), and real-time machine status — in a safe, offline-capable sandbox. Built for students learning industrial automation, developers exploring HMI/SCADA UI patterns, and trainers who need a demo environment without enterprise SCADA software. Runs directly from `index.html` with no server, no npm, and no bundler — all dependencies load via CDN.

[Quick Start](#quick-start) · [Features](#features) · [Screenshots](#screenshots) · [Tech Stack](#technology-stack) · [Glossary](#glossary) · [Contributing](CONTRIBUTING.md)

---

![Overview Dashboard](docs/screenshots/overview.png)

---

## What Is This?

Mini SCADA HMI Dashboard is a **learning-friendly demonstration** of how industrial monitoring systems work. Designed for:

- **Students** learning about industrial automation and SCADA systems
- **Developers** exploring HMI/SCADA UI patterns without enterprise software
- **Engineers** prototyping dashboard layouts before committing to expensive tools
- **Trainers** demonstrating operator interfaces in a safe sandbox

This is a **simulated demo** — no real industrial equipment is controlled or harmed.

> **SCADA** = Supervisory Control and Data Acquisition
> **HMI** = Human-Machine Interface

---

## Quick Start

Getting started takes less than 30 seconds.

**Option 1: Download and open (recommended)**

1. Click the green **"Code"** button → **"Download ZIP"**
2. Unzip anywhere on your computer
3. Double-click `index.html` — that's it

**Option 2: Clone with Git**

```bash
git clone https://github.com/chf3198/mini-scada-hmi-dashboard.git
cd mini-scada-hmi-dashboard
open index.html        # macOS
xdg-open index.html    # Linux
start index.html       # Windows
```

Works via `file://` protocol — no web server required.

---

## Features

| Feature | Description |
|---------|-------------|
| **Real-Time Dashboard** | Live machine status cards with health scores. Color-coded severity (🔴 Critical → 🟢 OK). Animated charts for downtime and events. Automatic refresh during simulation. |
| **Alarm Management** | Severity-based event logging. One-click acknowledgment. Timestamp tracking with relative time display. Filter events by machine. |
| **Runbooks (SOPs)** | Searchable troubleshooting guides. Accordion-style expandable sections. Step-by-step procedures for common issues. Ready for custom procedures. |
| **Commissioning Checklists** | FAT/SAT-style validation checklists. Progress bars per section and overall. LocalStorage persistence (survives page refresh). JSON export/import for sharing. |
| **Simulation Mode** | Start/stop realistic event generation. Random alarm triggers and machine status changes. Visual indicators show when simulation is active. |
| **Operator-Friendly UI** | Dark mode for night shifts. Responsive design for tablets. Tooltips explain SCADA terminology. Built-in Help/User Manual page. |

---

## Screenshots

**Overview Dashboard** — Real-time machine status, KPIs, severity charts, and event log

![Overview Dashboard](docs/screenshots/overview.png)

**Machine Detail** — Drill-down view with metrics, alerts, and quick actions

![Machine Detail](docs/screenshots/machine-detail.png)

**Runbooks (SOPs)** — Searchable troubleshooting guides with step-by-step procedures

![Runbooks](docs/screenshots/runbooks.png)

**Commissioning Checklists** — FAT/SAT validation with progress tracking and persistence

![Commissioning](docs/screenshots/commissioning.png)

**Help and User Manual** — Built-in documentation with SCADA terminology and app guidance

![Help Page](docs/screenshots/help.png)

---

## Project Structure

```
mini-scada-hmi-dashboard/
├── index.html         # Entry point — just open this
├── assets/
│   ├── app.js         # Main app logic, routing, views
│   ├── data.js        # Seed data (machines, events, runbooks)
│   ├── utils.js       # Helpers, simulation, persistence
│   ├── styles.css     # Minimal custom styles
│   └── tests.js       # Self-tests (run with ?test=1)
├── docs/
│   └── *.png          # Screenshots
├── LICENSE
├── README.md
└── CONTRIBUTING.md
```

Total codebase: ~800 lines — small enough to read in an afternoon.

---

## Technology Stack

All dependencies load via CDN — no npm, no webpack, no bundlers.

| Library | Purpose | Why It Was Chosen |
|---------|---------|-------------------|
| [Tailwind CSS](https://tailwindcss.com/) | Styling | Utility-first, no build required |
| [Chart.js](https://www.chartjs.org/) | Charts | Simple, beautiful, well-documented |
| [Lucide Icons](https://lucide.dev/) | Icons | Clean, open-source icon set |
| [Tippy.js](https://atomiks.github.io/tippyjs/) | Tooltips | Accessible, customizable |
| [Alpine.js](https://alpinejs.dev/) | Reactivity | Minimal declarative JS framework |

---

## Running Tests

The project includes lightweight self-tests. Open in your browser with the test flag:

```
index.html?test=1
```

Check the browser console for results. All tests should pass.

---

## Customization

| Customization | Difficulty | File to Edit |
|---------------|------------|--------------|
| Add more machines | ⭐ Easy | `assets/data.js` |
| Create new runbooks | ⭐ Easy | `assets/data.js` |
| Change color scheme | ⭐ Easy | Tailwind classes in `app.js` |
| Add new dashboard views | ⭐⭐ Medium | `assets/app.js` |
| Connect to real MQTT broker | ⭐⭐⭐ Advanced | New integration needed |
| Add OPC-UA data source | ⭐⭐⭐ Advanced | Backend required |

---

## From Demo to Production

This project is educational only. For real industrial deployments, you would need:

| Requirement | Description |
|-------------|-------------|
| **OPC-UA / MQTT** | Real protocol connections for live PLC data |
| **Authentication** | User login and role-based access (operators vs. admins) |
| **Historian database** | Store events and downtime in SQL/NoSQL for analysis |
| **WebSockets** | Push updates instead of polling |
| **Backend API** | Node.js or Python for data processing |
| **Redundancy** | High-availability architecture for critical systems |

---

## Contributing

Contributions are welcome:

- Bug reports
- Feature suggestions
- Documentation improvements
- UI/UX enhancements

Read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a pull request.

---

## License

**[PolyForm Noncommercial 1.0.0](LICENSE)** — free for personal, educational, and non-commercial use. Commercial use requires a paid license. See [COMMERCIAL-LICENSE.md](COMMERCIAL-LICENSE.md) or contact [curtisfranks@gmail.com](mailto:curtisfranks@gmail.com).

© 2026 Curtis Franks

---

## Glossary

New to SCADA? Here are the key terms:

| Term | Definition |
|------|------------|
| **SCADA** | Supervisory Control and Data Acquisition — systems that monitor and control industrial processes |
| **HMI** | Human-Machine Interface — the screen operators use to interact with machines |
| **PLC** | Programmable Logic Controller — industrial computer that controls machinery |
| **OPC-UA** | Open Platform Communications Unified Architecture — industrial data exchange standard |
| **FAT** | Factory Acceptance Test — validation performed before shipping equipment |
| **SAT** | Site Acceptance Test — validation performed after installation on-site |

---

*Built with ❤️ for the industrial automation community*
