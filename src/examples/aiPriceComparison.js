/**
 * @fileoverview AI-Powered Price Comparison Example
 * Demonstrates Phase 2 orchestration with natural language goal and progress tracking.
 */

const { TaskOrchestrator } = require('../services/TaskOrchestrator');
const { MockAIProvider } = require('../ai/MockAIProvider');
const { ProviderRegistry } = require('../data/providers/ProviderRegistry');
const { MockApiProvider } = require('../data/providers/MockApiProvider');
const { MockScraperProvider } = require('../data/providers/MockScraperProvider');
const { MockBrowserProvider } = require('../data/providers/MockBrowserProvider');
const { StrategyType } = require('../models/AutomationStrategy');
const { ProgressEventType } = require('../models/ProgressEvent');

/**
 * Main execution function
 */
async function main() {
  console.log('='.repeat(70));
  console.log('Phase 2 Demo: AI-Powered Task Orchestration');
  console.log('='.repeat(70));
  console.log();

  // 1. Initialize Providers
  console.log('📋 Step 1: Initializing Providers...');
  const registry = ProviderRegistry.getInstance();
  
  const apiProvider = new MockApiProvider({ simulatedLatency: 100 });
  const scraperProvider = new MockScraperProvider({ simulatedLatency: 200 });
  const browserProvider = new MockBrowserProvider({ simulatedLatency: 500 });

  registry.register(apiProvider, StrategyType.API);
  registry.register(scraperProvider, StrategyType.SCRAPER);
  registry.register(browserProvider, StrategyType.BROWSER);
  console.log('   ✓ Registered 3 providers');
  console.log();

  // 2. Initialize AI Provider
  console.log('🤖 Step 2: Initializing AI Provider...');
  const aiProvider = new MockAIProvider();
  console.log('   ✓ Mock AI Provider ready');
  console.log();

  // 3. Create Task Orchestrator
  console.log('🎯 Step 3: Creating Task Orchestrator...');
  const orchestrator = new TaskOrchestrator({ aiProvider });
  console.log('   ✓ Task Orchestrator initialized');
  console.log();

  // 4. Subscribe to Progress Events
  console.log('📡 Step 4: Setting up Progress Tracking...');
  let eventCount = 0;

  orchestrator.onAny((event) => {
    eventCount++;
    const timestamp = new Date().toISOString().substr(11, 12);
    const type = event.type || event.data?.type;
    const data = event.data || event;
    
    switch (type) {
      case ProgressEventType.TASK_STARTED:
        console.log(`   [${timestamp}] 🚀 Task Started: ${data.goal || ''}`);
        break;
      case ProgressEventType.TASK_PLANNING:
        console.log(`   [${timestamp}] 🧠 AI Planning...`);
        break;
      case ProgressEventType.TASK_PLAN_READY:
        console.log(`   [${timestamp}] ✅ Plan Ready (${data.totalSteps || 0} steps)`);
        break;
      case ProgressEventType.STEP_STARTED:
        console.log(`   [${timestamp}] ▶️  Step ${(data.stepIndex || 0) + 1}/${data.totalSteps || 0}: ${data.stepDescription || ''}`);
        break;
      case ProgressEventType.STEP_COMPLETED:
        console.log(`   [${timestamp}] ✓ Step ${(data.stepIndex || 0) + 1} completed (${data.duration || 0}ms)`);
        break;
      case ProgressEventType.STEP_FAILED:
        console.log(`   [${timestamp}] ✗ Step ${(data.stepIndex || 0) + 1} failed: ${data.error || ''}`);
        break;
      case ProgressEventType.PROGRESS_UPDATE:
        console.log(`   [${timestamp}] 📊 Progress: ${data.percentage || 0}%`);
        break;
      case ProgressEventType.TASK_COMPLETED:
        console.log(`   [${timestamp}] 🎉 Task Completed (${data.duration || 0}ms)`);
        break;
      case ProgressEventType.TASK_FAILED:
        console.log(`   [${timestamp}] ❌ Task Failed: ${data.error || ''}`);
        break;
      default:
        console.log(`   [${timestamp}] 📢 ${type}`);
    }
  });

  console.log('   ✓ Event listeners registered');
  console.log();

  // 5. Execute with Natural Language Goal
  console.log('🎬 Step 5: Executing AI-Powered Task...');
  console.log('-'.repeat(70));
  console.log();

  const goal = "Find the cheapest iPhone 14 across multiple marketplaces";
  console.log(`💬 Goal: "${goal}"`);
  console.log();

  const startTime = Date.now();
  
  try {
    const result = await orchestrator.planAndExecute(goal);
    const duration = Date.now() - startTime;

    console.log();
    console.log('-'.repeat(70));
    console.log('📊 Results:');
    console.log(`   Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`   Total Duration: ${duration}ms`);
    console.log(`   Steps Completed: ${result.getMetadata('completedSteps')}`);
    console.log(`   Steps Failed: ${result.getMetadata('failedSteps')}`);
    console.log(`   Total Events: ${eventCount}`);
    console.log();

    // Get AI stats
    const aiStats = orchestrator.getAIStats();
    console.log('🤖 AI Provider Stats:');
    console.log(`   Total Requests: ${aiStats.requestCount}`);
    console.log(`   Successful: ${aiStats.successCount}`);
    console.log(`   Failed: ${aiStats.failureCount}`);
    console.log();

    // Get cache stats
    const cacheStats = orchestrator.getCacheStats();
    console.log('💾 Cache Stats:');
    console.log(`   Cached Plans: ${cacheStats.size}`);
    console.log(`   Cache Enabled: ${cacheStats.enabled}`);
    console.log();

  } catch (error) {
    console.error();
    console.error('❌ Execution Error:', error.message);
  }

  console.log('='.repeat(70));
  console.log('Phase 2 Demo Complete!');
  console.log('='.repeat(70));
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal Error:', error);
    process.exit(1);
  });
}

module.exports = { main };
