# Gemini AI Integration Guide

## Overview

This project integrates Google's Gemini AI for intelligent task planning, selector generation, and error recovery in web automation workflows.

**Key Architectural Principle**: All AI configuration is centralized, allowing you to **change the AI provider or model with a single environment variable change**.

---

## Quick Start

### 1. Get Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API Key"
4. Copy your API key

### 2. Configure Environment

Create a `.env` file in the project root:

```bash
# AI Provider Selection
AI_PROVIDER=gemini

# Gemini Configuration
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-flash-latest
```

### 3. Run the Demo

```bash
node src/examples/geminiPlanningDemo.js
```

---

## Architecture

### Centralized Configuration Principle

**Goal**: Change AI provider or model in **ONE PLACE ONLY**

```
Environment Variable (.env)
    ↓
aiConfig.js (Single source of truth)
    ↓
GeminiClient.js (Client initialization)
    ↓
GeminiAIProvider.js (Provider implementation)
    ↓
AIProviderFactory.js (Provider selection)
    ↓
Application Code
```

### File Structure

```
src/
├── config/
│   └── aiConfig.js          # ⭐ CHANGE MODEL HERE
├── ai/
│   ├── clients/
│   │   └── GeminiClient.js  # Gemini SDK initialization
│   ├── BaseAIProvider.js    # Abstract interface
│   ├── MockAIProvider.js    # Mock for testing (no API key)
│   ├── GeminiAIProvider.js  # Production Gemini implementation
│   └── AIProviderFactory.js # Provider selection
└── examples/
    └── geminiPlanningDemo.js # Demo
```

---

## How to Change Configuration

### Switch AI Provider

**To use Mock (no API key needed)**:

```bash
AI_PROVIDER=mock
```

**To use Gemini**:

```bash
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
```

**To use OpenAI (future)**:

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=your_key_here
```

### Change Gemini Model

Edit `.env`:

```bash
# Fast and cheap (recommended for most tasks)
GEMINI_MODEL=gemini-flash-latest

# More capable, higher quality
GEMINI_MODEL=gemini-pro

# Supports images (future use)
GEMINI_MODEL=gemini-pro-vision
```

**That's it!** No code changes needed.

---

## API Reference

### Getting AI Provider

```javascript
import { getAIProvider } from "./ai/AIProviderFactory.js";

// Get provider based on .env configuration
const aiProvider = getAIProvider();

// Force specific provider (for testing)
const mockProvider = getAIProvider({ provider: "mock" });
```

### Using AI Provider

```javascript
// Generate task plan from natural language
const plan = await aiProvider.generatePlan(
  "Find the cheapest iPhone 14 across Amazon and eBay"
);

// Suggest CSS selectors for data extraction
const selectors = await aiProvider.suggestSelectors(
  html,
  "extract product prices"
);

// Get error recovery suggestions
const recovery = await aiProvider.recoverFromError(error, {
  action: "CLICK",
  step: "Submit form",
});

// Get usage statistics
const stats = aiProvider.getStats();
console.log(stats);
// {
//   requestCount: 5,
//   successCount: 4,
//   failureCount: 1,
//   totalTokens: 1250
// }
```

---

## Advanced Configuration

### Generation Parameters

Control AI behavior in `.env`:

```bash
# Temperature: 0.0 (deterministic) to 1.0 (creative)
AI_TEMPERATURE=0.7

# Top-K sampling
AI_TOP_K=40

# Top-P (nucleus sampling)
AI_TOP_P=0.95

# Maximum output tokens
AI_MAX_TOKENS=8192
```

### Rate Limiting

Prevent hitting API quotas:

```bash
AI_MAX_REQUESTS_PER_MIN=60
AI_MAX_TOKENS_PER_MIN=1000000
```

### Retry Configuration

Automatic retry on transient errors:

```bash
AI_MAX_RETRIES=3
AI_RETRY_DELAY_MS=1000
AI_MAX_RETRY_DELAY_MS=10000
AI_BACKOFF_MULTIPLIER=2.0
```

---

## Usage Examples

### Example 1: Task Planning

```javascript
import { getAIProvider } from "./ai/AIProviderFactory.js";
import TaskOrchestrator from "./services/TaskOrchestrator.js";

const aiProvider = getAIProvider();
const orchestrator = new TaskOrchestrator({ aiProvider });

// Natural language goal → Executable task
const result = await orchestrator.planAndExecute(
  "Find the cheapest iPhone 14 on Amazon"
);

console.log(result);
```

### Example 2: Selector Generation

```javascript
const aiProvider = getAIProvider();

const html = `
  <div class="product">
    <h2 class="title">iPhone 14</h2>
    <span class="price">$799</span>
  </div>
`;

const suggestions = await aiProvider.suggestSelectors(
  html,
  "extract product title and price"
);

console.log(suggestions.selectors);
// ['.title', '.price', 'h2', 'span.price']
```

### Example 3: Error Recovery

```javascript
const aiProvider = getAIProvider();

try {
  // Some automation step fails
  await clickElement(".submit-button");
} catch (error) {
  // Ask AI for recovery suggestion
  const recovery = await aiProvider.recoverFromError(error, {
    action: "CLICK",
    selector: ".submit-button",
    attemptCount: 1,
  });

  console.log(recovery);
  // {
  //   recoverable: true,
  //   suggestions: [
  //     {
  //       action: 'RETRY_WITH_WAIT',
  //       params: { delayMs: 2000 },
  //       reasoning: 'Button might be loading'
  //     }
  //   ]
  // }
}
```

---

## Testing

### Mock Provider for Testing

For testing without API costs:

```javascript
import { getAIProvider } from "./ai/AIProviderFactory.js";

// Force mock provider
const mockProvider = getAIProvider({ provider: "mock" });

// Works identically, but uses predefined templates
const plan = await mockProvider.generatePlan("Find cheapest iPhone");
```

### Provider Switching in Tests

```javascript
import AIConfig from "./config/aiConfig.js";

// Before tests
const original = process.env.AI_PROVIDER;
process.env.AI_PROVIDER = "mock";

// ... run tests ...

// After tests
process.env.AI_PROVIDER = original;
```

---

## Cost Optimization

### Tips for Reducing API Costs

1. **Use Flash model for most tasks**:

   ```bash
   GEMINI_MODEL=gemini-flash-latest  # Cheaper, faster
   ```

2. **Enable plan caching**:

   - TaskOrchestrator automatically caches plans
   - Identical goals reuse cached plans (no API call)

3. **Start with Mock, switch to Gemini when needed**:

   ```bash
   # Development
   AI_PROVIDER=mock

   # Production
   AI_PROVIDER=gemini
   ```

### Token Usage Monitoring

```javascript
const aiProvider = getAIProvider();

// Generate plan
await aiProvider.generatePlan(goal);

// Check token usage
const stats = aiProvider.getStats();
console.log(`Tokens used: ${stats.totalTokens}`);
```

---

## Troubleshooting

### Error: "GEMINI_API_KEY environment variable is required"

**Solution**: Add API key to `.env`:

```bash
GEMINI_API_KEY=your_api_key_here
```

### Error: "Gemini API failed after 3 retries"

**Possible causes**:

1. Invalid API key
2. Network issues
3. Rate limit exceeded
4. API outage

**Solutions**:

- Verify API key is correct
- Check rate limits in console
- Wait and retry
- Use Mock provider temporarily

### Slow Response Times

**Solutions**:

1. Switch to Flash model:

   ```bash
   GEMINI_MODEL=gemini-flash-latest
   ```

2. Reduce context size (truncate HTML/prompts)

3. Decrease `AI_MAX_TOKENS`:
   ```bash
   AI_MAX_TOKENS=4096
   ```

---

## Migration from MockAIProvider

If you're currently using MockAIProvider:

1. Get Gemini API key
2. Update `.env`:
   ```bash
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your_key
   ```
3. No code changes needed!

The factory pattern ensures zero code changes when switching providers.

---

## Future: Adding More Providers

To add OpenAI or other providers:

1. Create `src/ai/OpenAIProvider.js` implementing `BaseAIProvider`
2. Add to `AIProviderFactory.js`:
   ```javascript
   case AIProviderType.OPENAI:
     return new OpenAIProvider();
   ```
3. Update `.env`:
   ```bash
   AI_PROVIDER=openai
   OPENAI_API_KEY=your_key
   ```

No changes to application code!

---

## Summary

✅ **One place to configure**: `aiConfig.js` + `.env`  
✅ **Easy provider switching**: Change `AI_PROVIDER` env var  
✅ **Easy model switching**: Change `GEMINI_MODEL` env var  
✅ **Cost optimization**: Use Mock for dev, Flash for prod  
✅ **Future-proof**: Add new providers without code changes

**Next**: See `/docs/phases/phase_3_human_in_loop.md` for Phase 3 features
