# PLAN.md – Full Project Execution Plan

This document maps **the entire lifecycle and execution plan** for building the AI Web Automation Platform inside a **Next.js project**.

It defines _what we build_, _in what order_, and _why_, while strictly following the architectural rules defined in `README.md`.

---

## Guiding Principle for the Plan

> **Architecture first, features second, integrations last**

We deliberately delay:

- Authentication & billing
- Production logging
- Real databases

Until the **AI Web Automation core** is stable, testable, and reusable.

---

## Phase Overview

| Phase   | Focus                  | Outcome                             |
| ------- | ---------------------- | ----------------------------------- |
| Phase 0 | Project foundation     | Clean Next.js base + rules enforced |
| Phase 1 | AI Web Automation Core | AI can browse, click, extract data  |
| Phase 2 | Task Orchestration     | Multi-step goals & retries          |
| Phase 3 | User Interaction Loop  | Pause/resume tasks with user input  |
| Phase 4 | Persistence (Temp)     | Local JSON / memory storage         |
| Phase 5 | Permissions & Roles    | Feature gating & access control     |
| Phase 6 | Logging & Audit        | Central logging layer               |
| Phase 7 | Replace Temps          | DB, Vault, Custom Logger            |

---

## Phase 0 – Project Foundation (Immediate)

### Goals

- Enforce architecture rules early
- Prevent shortcuts
- Prepare for scale

### Actions

- Initialize Next.js project
- Create base folder structure (`controllers`, `services`, `providers`, etc.)
- Add `README.md` (already done)
- Add `PLAN.md` and feature plans
- Add ESLint rules (no deep imports, no circular deps)

### Non-Goals

- No real logic
- No UI polish

---

## Phase 1 – AI Web Automation Core (FIRST MAJOR FEATURE)

> This is the **heart of the system** and must be solid before anything else.

### What "AI Web Automation" Means Here

- Navigate to websites
- Follow links & sub-links
- Extract structured data
- Perform searches
- Handle pagination
- Support both:

  - API-based access
  - Browser-based automation

### Output of Phase 1

- A reusable automation engine
- Provider-based browsing strategy
- Deterministic execution (not magic prompts)

---

## Phase 2 – Task Orchestration Engine

### Goals

- Convert user goals into executable steps
- Handle retries & fallbacks
- Track progress
- **Full AI-Powered Automation**: AI handles all data extraction and decision-making (no selectors)

### Key Concepts

- **Task**: High-level goal ("Find cheapest phone")
- **Step**: Atomic action ("Search Amazon")
- **Strategy**: **AI Extraction & Decisions** (replacing manual selectors)

### Deliverables

- TaskOrchestrator service
- Step execution model
- Progress event system
- AIExtractionProvider service (Phase 2.5)

---

## Phase 3 – User Interaction Loop

### Goals

- Do not fail tasks when data is missing
- Allow AI to ask questions mid-execution

### Examples

- Login required
- Missing form field
- Captcha / human verification

### Outcome

- Pause task
- Ask user
- Resume safely

---

## Phase 4 – Temporary Persistence Layer

### Why Temporary?

- Validate flows without DB overhead
- Faster iteration

### Storage Types

- Local JSON files
- In-memory maps

### Rule

> Repositories only. No service knows storage details.

---

## Phase 5 – Permissions & Feature Gating

### Goals

- Protect risky features
- Enable role-based access

### Implementation

- Constants-based permissions
- Middleware checks
- Feature flags

---

## Phase 6 – Logging & Audit (Later)

### Why Later?

- Core logic first
- Logs wrap behavior, not define it

### Deliverables

- Central logger
- Audit trails per task

---

## Phase 7 – Replace Temporary Components

### Swap Targets

| Temp           | Final          |
| -------------- | -------------- |
| JSON storage   | Database       |
| Console logger | Custom logger  |
| Local vault    | External vault |

> Each replacement = **one file change**

---

## What We Explicitly Avoid

- Writing logic inside API routes
- Tight coupling to Puppeteer/Playwright
- Hardcoded site logic
- Prompt-only automation without structure

---

## Success Criteria

- AI browsing works without UI
- Tasks are replayable
- Providers are swappable
- No refactors needed to scale

---

## Final Note

This plan is intentionally conservative.
Speed comes from **correct structure**, not shortcuts.
