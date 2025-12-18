# PLAN.md – Full Project Execution Plan (Core‑First)

This document defines the **complete, end‑to‑end execution plan** for the project, with an explicit rule:

> **Core functionality first. Configuration second. UI last.**

No UI, auth, billing, or polish work is allowed until the core engine is correct, reusable, and proven.

This plan strictly follows the architectural rules defined in `README.md`.

---

## Global Priority Order (Immutable)

1. **Core automation engine (headless, no UI)**
2. Deterministic task orchestration
3. Provider abstraction & switching
4. Temporary persistence & replayability
5. Permission & policy layer
6. Logging & observability
7. Authentication & accounts
8. UI / UX
9. Production hardening

If a feature does not directly support items 1–3, it is postponed.

---

## Phase Breakdown (Detailed)

---

## Phase 0 – Project Foundation (Minimal, Enforcing Rules)

### Objective

Create a structure that **prevents bad decisions later**.

### What We Build

- Next.js project (already initialized)
- Folder structure matching architecture layers
- Empty placeholders (no logic):

  - controllers/
  - services/
  - repositories/
  - providers/
  - dal/
  - logger/
  - config/

- Linting rules to prevent cross‑layer imports

### What We Do NOT Build

- UI pages
- Auth
- DB connections
- Business logic

### Exit Criteria

- Project compiles
- Import boundaries enforced
- No logic exists yet

---

## Phase 1 – AI Web Automation Core (FOUNDATION)

> **This phase determines the success of the entire project.**

### Objective

Build a **headless, UI‑less, deterministic automation engine** capable of browsing the web and extracting data.

### Core Capabilities

- Navigate to URLs
- Follow links
- Perform searches
- Extract structured data
- Handle pagination

### Design Constraints

- No site‑specific hardcoding
- No UI
- No auth
- No permissions
- No real DB

### Key Deliverables

- Automation Action model
- Automation Step model
- Strategy selection (API → Scraper → Browser)
- Provider interfaces
- Mock providers

### Exit Criteria

- Cheapest‑phone demo works headlessly
- Providers are swappable
- Execution is replayable

---

## Phase 2 – Task Orchestration Engine

### Objective

Convert **user intent** into **executable steps** with retries and fallbacks.

### Core Concepts

- Task = high‑level goal
- Step = atomic action
- Strategy = execution method

### Capabilities

- Step sequencing
- Failure isolation
- Strategy fallback
- Progress events

### What Still Does NOT Exist

- UI
- Permissions
- Auth

### Exit Criteria

- Tasks can pause, retry, and resume
- Orchestrator is independent of providers

---

## Phase 3 – Human‑in‑the‑Loop Interaction

### Objective

Allow automation to **ask for missing information without failing**.

### Capabilities

- Pause task execution
- Emit structured input requests
- Resume task safely

### Examples

- Login required
- Missing form field
- Manual confirmation

### Still Excluded

- Saving user data long‑term
- Role‑based access

### Exit Criteria

- Task lifecycle supports pause → resume
- No UI coupling (events only)

---

## Phase 4 – Temporary Persistence & Replay

### Objective

Make automation **inspectable, debuggable, and replayable**.

### Temporary Storage

- In‑memory stores
- Local JSON files

### Stored Entities

- Tasks
- Steps
- Results
- Events

### Rules

- Repositories only
- No service touches storage directly

### Exit Criteria

- Tasks can be replayed from stored state
- Storage can be swapped later

---

## Phase 5 – Permissions & Policy Layer

### Objective

Control **what actions are allowed**, independent of implementation.

### Capabilities

- Permission constants
- Role mappings
- Per‑user overrides
- Environment flags

### Examples

- Who can use browser automation
- Who can log in to external sites
- Who can upload files

### Important Rule

> Permissions wrap behavior – they do not implement it.

### Exit Criteria

- Features can be enabled/disabled without code changes

---

## Phase 6 – Logging, Audit & Observability

### Objective

Understand **what the system did and why**.

### Capabilities

- Central logger
- Task‑level audit logs
- Error categorization

### Implementation

- Temporary logger (console + file)
- One‑file replacement later

### Exit Criteria

- Every task action is traceable
- Sensitive data is redacted

---

## Phase 7 – Authentication & Accounts

### Objective

Introduce users **without breaking core logic**.

### Capabilities

- User accounts
- Session management
- Ownership of tasks

### Rule

> Auth decorates existing functionality. It never changes it.

### Exit Criteria

- Multi‑user support
- Task isolation per user

---

## Phase 8 – UI / UX (LAST)

### Objective

Expose existing capabilities to humans.

### UI Principles

- UI calls APIs only
- No logic in components
- UI reflects task state, not controls it

### Screens

- Task builder
- Live progress view
- History & replay

### Exit Criteria

- UI can be replaced without touching core logic

---

## Phase 9 – Production Hardening

### Objective

Make the system safe, scalable, and compliant.

### Capabilities

- Rate limiting
- Queue isolation
- Provider throttling
- Vault integration

---

## Explicit Anti‑Goals

- Prompt‑only automation
- UI‑driven logic
- Tight coupling to Puppeteer/Playwright
- Hardcoded site flows

---

## Final Reminder

> If UI work starts before Phase 8, the plan is being violated.
