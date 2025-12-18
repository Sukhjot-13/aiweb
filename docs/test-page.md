# AI Test Page

## Quick Start

Navigate to `/test` in your browser:

```
http://localhost:3000/test
```

## Features

### 🎨 Beautiful UI

- Gradient backgrounds with glassmorphism effects
- Real-time loading states with animations
- Responsive design that works on all devices
- Example queries for quick testing

### 🤖 AI-Powered Automation

- Input natural language queries like:
  - "Find the best price for iPhone 14"
  - "Give me a list of prices for Samsung Galaxy"
  - "What is the cheapest MacBook Air?"
- The system will:
  1. Parse your query using GoalParser
  2. Generate a task plan using AI (Gemini or Mock)
  3. Execute the automation steps
  4. Return comprehensive results

### 📊 Detailed Results Display

The UI shows:

- **Task Information**: Goal, number of steps, execution time
- **AI Provider**: Which provider was used (mock/gemini) and model
- **Steps Executed**: Complete step-by-step breakdown
- **Results**: Actual data returned from automation
- **Events**: Full event timeline of the execution
- **Statistics**: AI usage stats and cache performance

## Setup

### 1. Environment Variables

Create `.env.local` in the project root:

```bash
# For Mock Provider (no API key needed)
AI_PROVIDER=mock

# OR for Gemini (requires API key)
AI_PROVIDER=gemini
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-flash-latest
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Open Test Page

Navigate to: `http://localhost:3000/test`

## Example Queries

Try these queries to see the system in action:

1. **Price Comparison**:

   ```
   Find the best price for iPhone 14
   ```

2. **Price List**:

   ```
   Give me a list of prices for Samsung Galaxy S23
   ```

3. **Cheapest Product**:

   ```
   What is the cheapest MacBook Air available?
   ```

4. **Multi-Store Comparison**:
   ```
   Compare prices for AirPods Pro across stores
   ```

## How It Works

```
User Input (Natural Language)
    ↓
/api/test-automation (API Route)
    ↓
TaskOrchestrator.planAndExecute()
    ↓
AI Provider (Gemini/Mock)
    ↓
Task Plan Generated
    ↓
TaskExecutor.executeTask()
    ↓
Steps Executed (Navigate, Search, Extract, etc.)
    ↓
Results Returned to UI
```

## API Route

**Endpoint**: `/api/test-automation`  
**Method**: `POST`  
**Body**:

```json
{
  "query": "Find the best price for iPhone 14"
}
```

**Response**:

```json
{
  "success": true,
  "status": "completed",
  "executionTime": 425,
  "task": {
    "id": "task_123",
    "goal": "Find the best price for iPhone 14",
    "steps": [...]
  },
  "result": {...},
  "aiProvider": {
    "type": "gemini",
    "model": "gemini-flash-latest"
  },
  "statistics": {
    "ai": {...},
    "cache": {...}
  },
  "events": [...]
}
```

## Troubleshooting

### Error: "GEMINI_API_KEY environment variable is required"

**Solution**: Set AI provider to mock for testing:

```bash
# .env.local
AI_PROVIDER=mock
```

Or add your Gemini API key:

```bash
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
```

### Error: "Cannot find module"

**Solution**: Make sure all dependencies are installed:

```bash
npm install
```

### Page shows 404

**Solution**: Make sure the dev server is running:

```bash
npm run dev
```

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Backend**: Next.js API Routes
- **AI**: Gemini AI / Mock AI Provider
- **Automation**: Phase 2 Task Orchestration Engine

## What's Next?

After testing with the /test page, the system is ready for:

- **Phase 3**: Human-in-the-Loop (pause for user input)
- **Phase 4**: Persistence & Replay (save and replay tasks)

---

**Have fun testing!** 🚀
