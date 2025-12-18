# PHASE_1_AI_WEB_AUTOMATION.md – Core Automation Engine (Authoritative)

This document is the **single source of truth for Phase 1**.

Phase 1 builds the **core AI web automation engine**. Nothing else.

If a feature does not directly support **deterministic web automation**, it is **out of scope**.

---

## Phase 1 Goal (Very Explicit)

> Build a **headless, UI‑less, auth‑less, deterministic automation engine** capable of browsing the web and extracting structured data.

This engine must:
- Work without a UI
- Work without users
- Work without a database
- Be reusable forever

---

## What Phase 1 IS

Phase 1 is about **capability**, not product.

It establishes:
- How the system interacts with the web
- How actions are executed
- How results are produced

---

## What Phase 1 IS NOT

❌ Authentication
❌ Permissions
❌ Roles
❌ UI / UX
❌ Billing
❌ Logging frameworks
❌ Databases
❌ Form filling
❌ File uploads
❌ Captcha solving

If it’s not required to *read* the web, it does not belong here.

---

## Core Capabilities to Implement

### 1. Navigation

- Open URLs
- Follow links
- Handle redirects

### 2. Searching

- Submit search queries
- Handle pagination
- Normalize results

### 3. Data Extraction

- Extract text
- Extract attributes
- Extract structured lists

### 4. Provider Strategy

- API provider (preferred)
- Scraper provider
- Browser provider (fallback)

---

## Core Architectural Pieces (Must Exist)

### Automation Action

- Smallest executable unit
- One responsibility

### Automation Step

- Wraps exactly one action
- Defines expected output

### Strategy Selector

- Chooses provider per step
- No execution logic

### Providers

- Execute actions
- No orchestration logic

---

## Determinism Rules

- Same input → same output
- No hidden state
- No randomness
- No prompt‑only execution

---

## Temporary Implementations (MANDATORY)

Phase 1 **must** use temporary implementations.

### Allowed

- Mock API providers
- Static HTML files
- Fake browser provider

### Forbidden

- Real credentials
- Real scraping at scale
- Production APIs

---

## Example Reference Task (Acceptance Test)

### Task

"Find the cheapest price for a given phone model across multiple marketplaces."

### Required Behavior

1. Normalize user input
2. Query multiple sources
3. Extract prices
4. Normalize currency
5. Return cheapest option

If this works, Phase 1 is successful.

---

## File‑Level Expectations

Phase 1 must result in:

- Provider interfaces
- Action & step models
- Strategy selection logic
- Demo task implementation

No other files are allowed to contain logic.

---

## Testing Rules

- Unit tests for actions
- Provider tests with mocks
- Replayable task tests

---

## Exit Criteria (Non‑Negotiable)

Phase 1 is complete **only if all are true**:

- Automation works without UI
- Providers are swappable
- Execution is replayable
- No permissions exist
- No auth exists

---

## Phase 1 Final Warning

> If UI work starts before this phase exits, the architecture has already failed.

