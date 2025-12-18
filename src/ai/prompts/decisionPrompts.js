/**
 * @fileoverview GeminiAIProvider - Decision prompts for Phase 5
 * Prompt templates for dynamic decision-making.
 */

/**
 * Build decision prompt for AI
 * @param {Object} context - Execution context
 * @returns {string} Prompt
 */
export function buildDecisionPrompt(context) {
  const { goal, currentUrl, pageState, collectedData, visitedUrls, actionCount } = context;

  return `You are an autonomous web automation agent. Your goal is: "${goal}"

**CURRENT SITUATION:**
- Current URL: ${currentUrl || 'Not yet navigated'}
- Pages visited: ${visitedUrls?.length || 0}
- Actions taken: ${actionCount || 0}

**PAGE STATE:**
${pageState ? `
- Title: ${pageState.title || 'N/A'}
- Links found: ${pageState.links?.length || 0}
- Forms found: ${pageState.forms?.length || 0}
- Visible text: ${pageState.visibleText?.substring(0, 300) || 'N/A'}...
` : 'No page loaded yet'}

**DATA COLLECTED SO FAR:**
${Object.keys(collectedData || {}).length > 0 ? JSON.stringify(collectedData, null, 2) : 'None'}

**YOUR TASK:**
1. Analyze the current situation
2. Determine if the goal is already achieved with current data
3. If not, decide the SINGLE BEST next action to take

**AVAILABLE ACTIONS:**
- NAVIGATE: Navigate to a URL
  params: { "url": "https://example.com" }
- CLICK: Click an element
  params: { "selector": ".button-class" }
- TYPE: Type text into input
  params: { "selector": "#input-id", "text": "search query" }
- EXTRACT_TEXT: Extract text from elements
  params: { "selector": ".data-class", "multiple": true }
- WAIT: Wait for time or element
  params: { "duration": 1000 } OR { "selector": ".results" }
- NONE: No action needed (goal achieved)

**RESPOND IN JSON:**
{
  "goalAchieved": boolean,
  "reasoning": "your thought process",
  "nextAction": {
    "type": "ACTION_TYPE",
    "params": {...},
    "description": "what this accomplishes"
  },
  "dataToExtract": {
    "dataKey": "css_selector_or_null"
  }
}

**CRITICAL RULES:**
- Make DECISIVE choices - don't revisit same pages unnecessarily
- Extract data when you see it
- Declare goalAchieved=true when you have enough data
- Be specific with selectors
- Choose ONE action at a time
- Return ONLY valid JSON`;
}

/**
 * Build goal completion analysis prompt
 * @param {Object} context - Execution context
 * @returns {string} Prompt
 */
export function buildGoalCompletionPrompt(context) {
  const { goal, collectedData } = context;

  return `Analyze if the following goal has been achieved:

**GOAL:** "${goal}"

**DATA COLLECTED:**
${JSON.stringify(collectedData, null, 2)}

**QUESTION:** Does the collected data satisfy the goal requirements?

Respond in JSON:
{
  "goalAchieved": boolean,
  "confidence": 0-1,
  "reasoning": "detailed explanation",
  "missingData": ["what is still needed"] or null
}`;
}
