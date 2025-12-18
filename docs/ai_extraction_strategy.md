# AI Automation Strategy - Architectural Decision

**Date**: December 17, 2025  
**Status**: Approved (Pivot)  
**Decision**: Implement **Full AI-Powered Automation**

---

## Context

The platform is moving away from brittle, manual CSS selectors. Instead of using predefined paths, the system will leverage AI to perceive web pages and make runtime decisions.

### Previous Approach: Hybrid (Option 2)

- Use selectors first, fallback to AI.
- **Status**: Discarded as secondary step.

### New Approach: Full AI Perception & Decision-Making (APPROVED ✅)

- **Model**: AI sees the raw HTML/Structure and decides what to extract and how to proceed.
- **No Selectors**: No manual `.price` or `#product` selectors are allowed in core tasks.
- **AI Role**: Planning + Perception + Extraction + Runtime Decisions.
- **Pros**: Zero maintenance for UI changes, handles dynamic content automatically, truly universal.
- **Cons**: higher token usage, requires high-quality models (GPT-4o, Claude 3.5 Sonnet, etc.).

---

## Decision: Full AI Core

**Implementation Strategy**:

1.  **Direct AI Perception**: Instead of search/extract actions needing selectors, they will take a "Natural Language Intent".
2.  **Action Evaluation**: After every action, the AI will evaluate the current page state to decide the next step.
3.  **Universal Providers**: Providers will focus on feeding raw, cleaned data (Markdown/Text/Accessibility Tree) to the AI.

```javascript
// New Execution Flow
const html = await provider.getPageContent();
const decision = await aiProvider.processPage(html, {
  goal: "Find the cheapest iPhone 14",
  history: task.history,
});

// decision = {
//   data: [{ product: "iPhone 14", price: "$899" }],
//   nextAction: "SCROLL_DOWN"
// }
```

---

## Implementation Phases

### Phase 2.5 (Next - AI Extraction & Reasoning)

- Create `AIAutomationProvider` (replacing the manual selector logic).
- Implement "Page Cleaning" utilities to reduce tokens (HTML → Markdown).
- **USER DECISION REQUIRED**: Which high-end AI model to use?
  - OpenAI GPT-4o
  - Anthropic Claude 3.5 Sonnet
  - Google Gemini 1.5 Pro

### Phase 3 (User Interaction Loop)

- Human-in-the-loop when AI reaches a crossroad or needs confirmation.

---

## Technical Requirements (Revised)

1.  **AIAutomationProvider**:
    - `processPage(content, context)`: Returns both data and next action.
    - Integrated with orchestration to update task plans on the fly.
2.  **Content Optimizer**:
    - Convert bloated HTML to semantic Markdown or cleaned Text to save tokens.
3.  **Dynamic Step Injection**:
    - The task model must allow AI to inject new steps mid-execution.

---

## User Decision Point

> **CHECKPOINT**: Before building the core AI automation layer:
>
> 1.  Confirm model: **OpenAI GPT-4o** or **Anthropic Claude 3.5 Sonnet**?
> 2.  Confirm budget: Constant AI calls per step is the new standard.

---

## Approval

**Approved by**: User  
**Date**: December 17, 2025  
**Notes**: No selectors. AI decides everything. Start Phase 2.5 with this logic.
