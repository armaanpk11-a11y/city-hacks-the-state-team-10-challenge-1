# Challenge 01 — 100 Trinity Place Work Order Dashboard

**The City Hacks The State · NYC Tech Week 2026**

> A building operator dashboard that pulls live work orders from CriticalAsset's GraphQL API and turns them into clear Monday-morning decisions.

---

## 🎯 Target User

**Building Operations Manager** responsible for 100 Trinity Place (M833), a 7-floor school building in lower Manhattan. They need to see what's urgent, what's overdue, and what to schedule first — every Monday morning.

## 🏗️ Problem Statement

Building operators juggle dozens of work orders across HVAC, electrical, fire safety, and plumbing systems. Without a single prioritized view, critical inspections get missed, deadlines slip, and safety compliance gaps grow. This dashboard transforms raw API data into **signal → action**.

## 📡 Data Sources

| Source | Scope | Purpose |
|--------|-------|---------|
| CriticalAsset GraphQL API | `workorders.read` | Pull live work orders with severity, due dates, stage |
| CriticalAsset GraphQL API | `assets.read` | Join assets to work orders (category, status) |
| CriticalAsset GraphQL API | `locations.read` | Building profile, floor layout, coordinates |

## 🤖 AI Tools Used

- **Amazon Quick** — Code generation, dashboard design, API exploration, and documentation
- **Highcharts** — Chart rendering (pie chart, bar chart)

## 🏃 How to Run

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables (copy .env.example)
cp .env.example .env
# Edit .env with your Client ID and Secret from CriticalAsset Developer Console

# 3. Start the server
npm start

# 4. Open browser
open http://localhost:3000
```

## 📁 Architecture

```
challenge1/
├── server.js          # Express backend — OAuth2 token exchange + GraphQL proxy
├── public/
│   └── index.html     # Frontend dashboard — calls OUR backend, not CriticalAsset
├── .env               # Secrets (never committed)
├── .env.example       # Template for secrets
├── .gitignore         # Protects .env and node_modules
├── package.json       # Dependencies
└── README.md          # This file
```

**Key design decisions:**
- Frontend NEVER calls CriticalAsset directly (no CORS issues, no secret leakage)
- Backend caches access token with 60s buffer before expiry
- On 401, backend auto-refreshes token and retries
- Student signals stored client-side (localStorage) for demo; production would use a database

## ✅ Challenge Requirements Checklist

| # | Step | Status |
|---|------|--------|
| 01 | Review CriticalAsset API Guide | ✅ |
| 02 | Connect to CriticalAsset Developer Console | ✅ |
| 03 | Create application + get credentials | ✅ |
| 04 | Save secrets securely (.env, not in code) | ✅ |
| 05 | Exchange credentials for access token (server-side) | ✅ |
| 06 | Pull work orders via GraphQL | ✅ |
| 07 | Build the dashboard | ✅ |

## ⭐ Bonus Points

| Bonus | Status | Details |
|-------|--------|---------|
| Join work orders to assets | ✅ | Each WO shows linked assets with category/status |
| Map by building | ✅ | Building profile with coordinates + floor breakdown |
| Student signal | ✅ | Submit observation → auto-linked to nearest open WO |

## ⚠️ Limitations & Safety Statement

1. **Prototype only** — Not production-ready, safety-certified, or suitable for live deployment.
2. **Staging data** — Connected to CriticalAsset staging environment, not production systems.
3. **Student signals** — Stored in browser localStorage for demo. Production requires moderation, authentication, and a persistent database.
4. **No emergency reliance** — This dashboard must not be used for emergency response or life-safety decisions.
5. **Before real-world use:** Security audit, proper RBAC, input validation, rate limiting, penetration testing, data retention policy, and city stakeholder review required.

## 🎤 3-Minute Pitch Notes

**0:00–0:30 — Problem & User:**
"A building operator at 100 Trinity Place opens their laptop Monday morning. 100 assets, 7 floors, 3 open work orders — one is already overdue. They need to know: what do I handle first?"

**0:30–1:45 — Dashboard Demo:**
- KPI row: instant status (open, critical, overdue)
- Decision box: prioritized action list based on due dates + severity
- Work order table: click any row for full detail + linked assets
- Student signal: anyone can flag an observation and it auto-links to the nearest work order

**1:45–2:30 — Evidence & Reasoning:**
- All data pulled live from CriticalAsset GraphQL API
- OAuth2 Client Credentials flow, server-side only
- Severity × due date = priority ranking (Critical+Overdue > High+Upcoming > Medium)

**2:30–3:00 — Limitations & Next Steps:**
- Staging data, not production
- Would need moderation for student signals, proper auth, and database
- Next: integrate NYC open data (311 complaints, DOB violations) for triangulation

---

*Built at The City Hacks The State · NYC Tech Week 2026*
