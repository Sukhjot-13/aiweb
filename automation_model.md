# AUTOMATION_MODEL.md – Core Automation Domain Model

This document defines the **core domain model** for AI web automation.

It is **implementation‑agnostic** and must remain stable even if:
- UI changes
- Providers change
- Storage changes
- Frameworks change

> If this model breaks, the system breaks.

---

## Design Principles

- Deterministic over probabilistic
- Serializable over implicit
- Replayable over ephemeral
- Declarative over imperative

The AI **plans**.
The system **executes**.

---

## 1. Automation Action

### Definition

An **Action** is the smallest executable unit.

### Characteristics

- Atomic
- Side‑effect aware
- Serializable
- Testable in isolation

### Examples

- NavigateToUrl
- ClickElement
- TypeIntoField
- ExtractText
- ExtractAttribute
- UploadFile
- WaitForSelector

### Rules

- One action = one responsibility
- No branching logic
- No retries

---

## 2. Automation Step

### Definition

A **Step** wraps exactly one Action with context.

### Contains

- Action
- Input parameters
- Expected output schema
- Failure conditions

### Example

"Search marketplace for product"

### Rules

- One step = one intent
- No provider logic
- No orchestration logic

---

## 3. Automation Strategy

### Definition

A **Strategy** defines *how* a Step is executed.

### Strategy Order (Default)

1. API Strategy
2. Scraper Strategy
3. Browser Strategy

### Rules

- Exactly one strategy per execution
- Strategy selection is external to Step

---

## 4. Providers

### Definition

Providers execute Actions using a specific medium.

### Required Providers

- ApiProvider
- ScraperProvider
- BrowserProvider

### Provider Rules

- Implement a shared interface
- No business logic
- No task awareness
- No retries

---

## 5. Task

### Definition

A **Task** is a user‑level goal.

### Contains

- Task ID
- Goal description
- Ordered Steps
- Execution state
- Final result

### Rules

- Tasks are resumable
- Tasks are replayable

---

## 6. Execution State Model

### States

- PENDING
- RUNNING
- PAUSED
- WAITING_FOR_INPUT
- FAILED
- COMPLETED

### Rules

- State transitions are explicit
- No implicit state mutation

---

## 7. Human‑in‑the‑Loop Input Request

### Definition

A structured request emitted when automation lacks required data.

### Contains

- Required fields
- Validation rules
- Sensitivity flags

### Rules

- Task pauses safely
- Execution resumes deterministically

---

## 8. Replay & Determinism

### Requirement

Given:
- Same task
- Same inputs
- Same providers

The result **must be identical**.

---

## Forbidden Patterns

- Provider‑specific steps
- Prompt‑only execution
- Hidden state in providers
- UI‑driven logic

---

## Final Contract

> This model is the backbone of the system.
> All future features must adapt to it — not change it.

