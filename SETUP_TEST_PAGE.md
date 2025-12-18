# Quick Setup Guide for /test Page

## 🚀 Your Test Page is Ready!

The AI automation test page is now running at: **http://localhost:3000/test**

---

## ⚡ Quick Start (3 Steps)

### 1. Set Up Environment Variables

Create `.env.local` in the project root (if not exists):

```bash
# Option 1: Use Mock AI (No API key needed - Recommended for Testing)
AI_PROVIDER=mock

# Option 2: Use Gemini AI (Requires API key)
# AI_PROVIDER=gemini
# GEMINI_API_KEY=your_api_key_here
# GEMINI_MODEL=gemini-flash-latest
```

### 2. Server is Already Running ✅

The dev server is running on:

- Local: http://localhost:3000
- Network: http://192.168.2.154:3000

### 3. Open Test Page

Navigate to: **http://localhost:3000/test**

---

## 🎯 Try These Queries

Click on any example or type your own:

1. **"Find the best price for iPhone 14"**
2. **"Give me a list of prices for Samsung Galaxy S23"**
3. **"What is the cheapest MacBook Air available?"**
4. **"Compare prices for AirPods Pro across stores"**

---

## 🎨 What You'll See

The test page features:

✨ **Beautiful glassmorphic UI** with gradient backgrounds  
📝 **Input field** for natural language queries  
🔘 **Example query buttons** for quick testing  
⏳ **Real-time loading states** with animations  
📊 **Comprehensive results display**:

- Task information (goal, steps, duration)
- AI provider details (type, model)
- Step-by-step execution breakdown
- Actual results from automation
- Full event timeline
- AI usage statistics

---

## 🏗️ Architecture

```
User Input (Natural Language)
    ↓
React UI (/test page)
    ↓
POST /api/test-automation
    ↓
TaskOrchestrator.planAndExecute()
    ↓
AI Provider (Mock/Gemini)
    ↓
Task Plan Generated
    ↓
Steps Executed
    ↓
Results → JSON Response → UI Display
```

---

## 🔧 Using Mock vs Gemini

### Mock Provider (Default - Free, No API Key)

**Pros**:

- ✅ No API key needed
- ✅ Fast (~100ms)
- ✅ Free
- ✅ Perfect for testing

**Cons**:

- ❌ Template-based (limited flexibility)
- ❌ 3 templates only

### Gemini Provider (Production - Requires API Key)

**Pros**:

- ✅ Real AI intelligence
- ✅ Understands any query
- ✅ Adaptive planning

**Cons**:

- ❌ Requires API key
- ❌ Slower (~800-1500ms)
- ❌ Costs ~$0.0001 per query

---

## 📱 Screenshots

**Input Screen:**

```
┌────────────────────────────────────────┐
│  🤖 AI Automation Test                 │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ e.g., Find best price for...    │ │
│  └──────────────────────────────────┘ │
│                                        │
│  [Run AI Automation]                  │
│                                        │
│  Try these examples:                  │
│  [Find best price] [Get price list]  │
└────────────────────────────────────────┘
```

**Results Screen:**

```
✅ completed (425ms)

📋 Task Information
Goal: Find the best price for iPhone 14
Steps: 3
Duration: 425ms

🤖 AI Provider
Type: mock
Model: -

⚡ Steps Executed
1. Initialize price comparison ✓
2. Search for product ✓
3. Extract product prices ✓

📡 Events (17 events)
[21:59:40] TASK_STARTED
[21:59:40] TASK_PLANNING
...
```

---

## 🐛 Troubleshooting

### Issue: Page shows 404

**Solution**: Make sure you're navigating to `/test` (lowercase):

```
✅ http://localhost:3000/test
❌ http://localhost:3000/Test
```

### Issue: "AI Provider error"

**Solution**: Check your `.env.local`:

```bash
# Make sure AI_PROVIDER is set
AI_PROVIDER=mock
```

### Issue: Slow response

**Cause**: Using Gemini provider (~800-1500ms per request)

**Solution**: Switch to Mock for faster testing:

```bash
AI_PROVIDER=mock
```

### Issue: CORS or Module errors

**Solution**: Restart the dev server:

```bash
# Stop the server (Ctrl+C)
npm run dev
```

---

## 🎓 Next Steps

After testing the page:

1. ✅ Test with Mock provider (no API key)
2. ⏳ Get Gemini API key and test with real AI
3. ⏳ Begin Phase 3 implementation (Human-in-the-Loop)
4. ⏳ Begin Phase 4 implementation (Persistence & Replay)

---

## 💡 Pro Tips

1. **Use Mock for rapid testing** - No API costs, instant results
2. **Check browser console** - See detailed logs and events
3. **Try different queries** - Test the AI's understanding
4. **Monitor execution time** - See performance metrics
5. **Expand event details** - Click to see full event timeline

---

**Have fun testing the AI automation! 🚀**

Open http://localhost:3000/test in your browser now!
