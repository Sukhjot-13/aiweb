# PHASES_2_TO_9_DETAILED.md – Detailed Plans (Post‑Automation)

This document expands **all remaining phases** after Phase 1 (AI Web Automation Core).

These phases **wrap, protect, and expose** the core — they must never redefine it.

---

## Phase 2 – Task Orchestration Engine

### Purpose

Translate high‑level goals into executable steps.

### Core Responsibilities

- Step sequencing
- Strategy selection
- Retry & fallback handling
- Progress emission

### Explicit Non‑Responsibilities

- UI handling
- Permission checks
- Provider logic

### Exit Criteria

- Tasks can fail without crashing
- Steps are isolated

---

## Phase 3 – Human‑in‑the‑Loop Interaction

### Purpose

Prevent task failure when human input is required.

### Capabilities

- Pause execution
- Request structured input
- Resume safely

### Rules

- No UI assumptions
- Input requests are pure data

---

## Phase 4 – Temporary Persistence & Replay

### Purpose

Enable debugging and inspection.

### Stored Entities

- Tasks
- Steps
- Execution state
- Results

### Rules

- Repository abstraction only
- No service‑level storage logic

---

## Phase 5 – Permissions & Policy Layer

### Purpose

Control *who can do what*.

### Capabilities

- Permission constants
- Role mappings
- Per‑user overrides
- Feature flags

### Rule

> Permissions guard behavior — they do not implement it.

---

## Phase 6 – Logging, Audit & Observability

### Purpose

Explain system behavior after the fact.

### Capabilities

- Central logger
- Audit trails
- Error categorization

### Rule

- Logs must never affect execution

---

## Phase 7 – Authentication & Accounts

### Purpose

Add identity without modifying core logic.

### Capabilities

- User sessions
- Task ownership
- Credential vault access

---

## Phase 8 – UI / UX Layer (LAST)

### Purpose

Expose existing capabilities.

### UI Rules

- UI is stateless
- UI never controls logic
- UI reflects system state

---

## Phase 9 – Production Hardening

### Purpose

Make the system reliable at scale.

### Capabilities

- Rate limiting
- Job isolation
- Vault integration
- Compliance controls

---

## Global Anti‑Patterns

- UI‑driven orchestration
- Provider‑specific business logic
- Hardcoded site flows
- Prompt‑only automation

---

## Final Reminder

> The core automation engine is the product.
> Everything else is infrastructure.

