/**
 * @fileoverview Gemini AI Planning Demo
 * 
 * Demonstrates the Gemini AI provider integration for AI-powered task planning.
 * Shows how to use natural language goals with Gemini instead of MockAIProvider.
 * 
 * To run this demo:
 * 1. Set GEMINI_API_KEY in your .env file
 * 2. Set AI_PROVIDER=gemini in your .env file  
 * 3. Run: node src/examples/geminiPlanningDemo.js
 */

import { getAIProvider, getProviderInfo } from '../ai/AIProviderFactory.js';
import TaskOrchestrator from '../services/TaskOrchestrator.js';
import TaskExecutor from '../services/TaskExecutor.js';
import { getStrategyExecutor } from '../services/StrategySelector.js';

/**
 * Main demo function
 */
async function runGeminiPlanningDemo() {
  console.log('='.repeat(80));
  console.log('🤖 Gemini AI Planning Demo');
  console.log('='.repeat(80));
  console.log('');

  // Show current AI provider configuration
  const providerInfo = getProviderInfo();
  console.log('📋 AI Provider Configuration:');
  console.log(`   Provider: ${providerInfo.type}`);
  console.log(`   Production AI: ${providerInfo.isProduction ? 'Yes' : 'No (Mock)'}`);
  console.log(`   Gemini Model: ${providerInfo.config.gemini.model}`);
  console.log(`   Has Gemini API Key: ${providerInfo.config.gemini.hasApiKey ? 'Yes' : 'No'}`);
  console.log('');

  // Validate we're using Gemini
  if (providerInfo.type !== 'gemini') {
    console.warn('⚠️  Warning: AI_PROVIDER is not set to "gemini"');
    console.warn('   Set AI_PROVIDER=gemini in your .env file to use Gemini AI');
    console.warn('   Falling back to configured provider:', providerInfo.type);
    console.warn('');
  }

  try {
    // Get AI provider (will use Gemini if configured, otherwise mock)
    const aiProvider = getAIProvider();
    console.log(`✅ AI Provider initialized: ${aiProvider.name || aiProvider.constructor.name}`);
    console.log('');

    // Create Task Orchestrator
    const executor = new TaskExecutor(getStrategyExecutor());
    const orchestrator = new TaskOrchestrator({
      aiProvider,
      executor,
    });

    // Subscribe to progress events
    console.log('📡 Subscribing to progress events...');
    console.log('');
    
    orchestrator.on('TASK_STARTED', (event) => {
      console.log(`🚀 Task Started: ${event.data.taskId}`);
    });

    orchestrator.on('TASK_PLANNING', () => {
      console.log('🧠 AI is planning the task...');
    });

    orchestrator.on('TASK_PLAN_READY', (event) => {
      console.log(`✅ Plan Ready: ${event.data.stepCount} steps generated`);
      console.log(`   Confidence: ${(event.data.confidence * 100).toFixed(0)}%`);
    });

    orchestrator.on('STEP_STARTED', (event) => {
      console.log(`   ▶️  Step ${event.data.currentStep}/${event.data.totalSteps}: ${event.data.description}`);
    });

    orchestrator.on('STEP_COMPLETED', (event) => {
      console.log(`   ✓ Step completed (${event.data.durationMs}ms)`);
    });

    orchestrator.on('TASK_COMPLETED', (event) => {
      console.log(`🎉 Task Completed! (${event.data.durationMs}ms total)`);
    });

    orchestrator.on('TASK_FAILED', (event) => {
      console.log(`❌ Task Failed: ${event.data.error}`);
    });

    console.log('─'.repeat(80));
    console.log('');

    // Example 1: Price Comparison
    console.log('📝 Example 1: Price Comparison');
    console.log('   Natural Language Goal: "Find the cheapest iPhone 14 across multiple stores"');
    console.log('');

    const goal1 = 'Find the cheapest iPhone 14 across multiple stores';
    const startTime1 = Date.now();
    
    const result1 = await orchestrator.planAndExecute(goal1);
    
    const duration1 = Date.now() - startTime1;

    console.log('');
    console.log('📊 Result Summary:');
    console.log(`   Status: ${result1.status}`);
    console.log(`   Steps Executed: ${result1.executionState.completedSteps.length}`);
    console.log(`   Total Duration: ${duration1}ms`);
    console.log('');

    // Show AI stats
    const aiStats = orchestrator.getAIStats();
    console.log('🤖 AI Provider Statistics:');
    console.log(`   Total Requests: ${aiStats.requestCount}`);
    console.log(`   Successful: ${aiStats.successCount}`);
    console.log(`   Failed: ${aiStats.failureCount}`);
    console.log(`   Tokens Used: ${aiStats.totalTokens}`);
    console.log('');

    console.log('─'.repeat(80));
    console.log('');

    // Example 2: Data Extraction
    console.log('📝 Example 2: Data Extraction');
    console.log('   Natural Language Goal: "Extract all product names and prices from https://example.com"');
    console.log('');

    const goal2 = 'Extract all product names and prices from https://example.com';
    const startTime2 = Date.now();
    
    const result2 = await orchestrator.planAndExecute(goal2);
    
    const duration2 = Date.now() - startTime2;

    console.log('');
    console.log('📊 Result Summary:');
    console.log(`   Status: ${result2.status}`);
    console.log(`   Steps Executed: ${result2.executionState.completedSteps.length}`);
    console.log(`   Total Duration: ${duration2}ms`);
    console.log('');

    // Show updated AI stats
    const aiStats2 = orchestrator.getAIStats();
    console.log('🤖 Updated AI Statistics:');
    console.log(`   Total Requests: ${aiStats2.requestCount}`);
    console.log(`   Successful: ${aiStats2.successCount}`);
    console.log(`   Failed: ${aiStats2.failureCount}`);
    console.log(`   Tokens Used: ${aiStats2.totalTokens}`);
    console.log('');

    // Show cache stats
    const cacheStats = orchestrator.getCacheStats();
    console.log('💾 Plan Cache Statistics:');
    console.log(`   Cache Size: ${cacheStats.size}`);
    console.log(`   Cache Hits: ${cacheStats.hits}`);
    console.log(`   Cache Misses: ${cacheStats.misses}`);
    console.log('');

    console.log('='.repeat(80));
    console.log('✅ Demo completed successfully!');
    console.log('='.repeat(80));

  } catch (error) {
    console.log('');
    console.log('='.repeat(80));
    console.log('❌ Demo failed with error:');
    console.log('');
    console.log(error.message);
    if (error.stack) {
      console.log('');
      console.log('Stack trace:');
      console.log(error.stack);
    }
    console.log('='.repeat(80));
    
    // Provide helpful error messages
    if (error.message.includes('API key')) {
      console.log('');
      console.log('💡 Tip: Make sure to set GEMINI_API_KEY in your .env file');
      console.log('   Get your API key from: https://makersuite.google.com/app/apikey');
    }
    
    process.exit(1);
  }
}

// Run the demo
runGeminiPlanningDemo();
