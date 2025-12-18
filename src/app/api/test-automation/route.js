import { NextResponse } from 'next/server';
import { getAIProvider, getProviderInfo } from '../../../ai/AIProviderFactory.js';
import TaskOrchestrator from '../../../services/TaskOrchestrator.js';
import { TaskExecutor } from '../../../services/TaskExecutor.js';
import { ProviderRegistry } from '../../../data/providers/ProviderRegistry.js';
import { MockBrowserProvider } from '../../../data/providers/MockBrowserProvider.js';
import { MockScraperProvider } from '../../../data/providers/MockScraperProvider.js';
import { MockApiProvider } from '../../../data/providers/MockApiProvider.js';
import { PuppeteerBrowserProvider } from '../../../data/providers/PuppeteerBrowserProvider.js';
import { StrategyType } from '../../../models/AutomationStrategy.js';


export async function POST(request) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    console.log('Processing query:', query);

    // Get AI provider
    const aiProvider = getAIProvider();
    const providerInfo = getProviderInfo();

    console.log('AI Provider:', providerInfo.type);

    // Register execution providers
    const registry = ProviderRegistry.getInstance();
    const useRealBrowser = process.env.USE_REAL_BROWSER === 'true';

    if (useRealBrowser) {
      console.log('🌐 Using REAL browser (Puppeteer)');
      registry.register(new PuppeteerBrowserProvider({ headless: true }), StrategyType.BROWSER);
    } else {
      console.log('🎭 Using MOCK providers');
      registry.register(new MockBrowserProvider({ simulatedLatency: 500 }), StrategyType.BROWSER);
    }
    
    registry.register(new MockApiProvider({ simulatedLatency: 100 }), StrategyType.API);
    registry.register(new MockScraperProvider({ simulatedLatency: 200 }), StrategyType.SCRAPER);

    // Create executor and orchestrator
    // TaskExecutor creates its own StrategySelector internally
    const executor = new TaskExecutor();
    const orchestrator = new TaskOrchestrator({
      aiProvider,
      executor,
    });


    // Track events
    const events = [];
    orchestrator.on('*', (event) => {
      events.push({
        type: event.type,
        timestamp: event.timestamp,
        data: event.data,
      });
    });

    // Execute the query with strategy forcing if real browser
    const startTime = Date.now();
    const executionOptions = {};
    
    // FORCE BROWSER strategy when real browser is enabled
    if (useRealBrowser) {
      executionOptions.criteria = {
        excludeStrategies: ['API', 'SCRAPER'], // Force BROWSER only
      };
    }
    
    const result = await orchestrator.planAndExecute(query, executionOptions);
    const executionTime = Date.now() - startTime;

    console.log('Execution completed:', result.status);

    // Get statistics
    const aiStats = orchestrator.getAIStats();
    const cacheStats = orchestrator.getCacheStats();

    // Format response
    // Extract data from successful steps
    const extractedData = result.result?.successfulSteps?.map(step => ({
      step: step.stepDescription,
      data: step.data
    })) || [];

    return NextResponse.json({
      success: result.status === 'COMPLETED',
      status: result.status,
      executionTime,
      task: {
        id: result.id,
        goal: result.goal,
        steps: result.steps?.map((step) => ({
          description: step.description || step.action?.type,
          status: step.status,
        })),
      },
      result: result.result,
      extractedData,
      error: (result.status === 'FAILURE' || result.status === 'FAILED') ? {
        message: result.error || 'Task execution failed',
        details: result.executionState?.error || null,
        failedStep: result.executionState?.failedSteps?.[0] || null,
      } : null,
      steps: result.executionState?.completedSteps?.map((step) => ({
        description: step.description,
        status: 'completed',
      })) || [],
      aiProvider: {
        type: providerInfo.type,
        model: providerInfo.config?.gemini?.model || null,
      },
      statistics: {
        ai: aiStats,
        cache: cacheStats,
      },
      events: events.map((e) => ({
        type: e.type,
        timestamp: e.timestamp,
      })),
    });
  } catch (error) {
    console.error('API Error:', error);

    // Provide helpful error messages
    let errorMessage = error.message;
    let errorHint = null;

    if (error.message.includes('API key')) {
      errorHint = 'Make sure to set GEMINI_API_KEY in your .env file if using Gemini AI';
    } else if (error.message.includes('provider')) {
      errorHint = 'Check your AI_PROVIDER setting in .env file';
    }

    return NextResponse.json(
      {
        error: errorMessage,
        hint: errorHint,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
