/**
 * @fileoverview Dynamic Automation API - AI-driven autonomous navigation
 */

import { NextResponse } from 'next/server';
import { getAIProvider } from '../../../ai/AIProviderFactory.js';
import DynamicTaskExecutor from '../../../services/DynamicTaskExecutor.js';
import { ProviderRegistry } from '../../../data/providers/ProviderRegistry.js';
import { MockBrowserProvider } from '../../../data/providers/MockBrowserProvider.js';
import { MockScraperProvider } from '../../../data/providers/MockScraperProvider.js';
import { MockApiProvider } from '../../../data/providers/MockApiProvider.js';
import { PuppeteerBrowserProvider } from '../../../data/providers/PuppeteerBrowserProvider.js';
import { StrategyType } from '../../../models/AutomationStrategy.js';

export async function POST(request) {
  try {
    const { goal, options = {} } = await request.json();

    if (!goal || typeof goal !== 'string') {
      return NextResponse.json(
        { error: 'Goal is required and must be a string' },
        { status: 400 }
      );
    }

    console.log('Dynamic automation started:', goal);

    // Register providers
    const registry = ProviderRegistry.getInstance();
    const useRealBrowser = process.env.USE_REAL_BROWSER === 'true';

    if (useRealBrowser) {
      console.log('🌐 Using REAL browser for dynamic execution');
      registry.register(new PuppeteerBrowserProvider({ headless: true }), StrategyType.BROWSER);
    } else {
      console.log('🎭 Using MOCK browser for dynamic execution');
      registry.register(new MockBrowserProvider({ simulatedLatency: 500 }), StrategyType.BROWSER);
    }

    registry.register(new MockApiProvider({ simulatedLatency: 100 }), StrategyType.API);
    registry.register(new MockScraperProvider({ simulatedLatency: 200 }), StrategyType.SCRAPER);

    // Get AI provider
    const aiProvider = getAIProvider();

    // Create dynamic executor
    const executorOptions = {
      maxIterations: options.maxIterations || 20,
      timeout: options.timeout || 180000, // 3 min
    };
    
    // FORCE BROWSER strategy when real browser is enabled
    if (useRealBrowser) {
      executorOptions.criteria = {
        excludeStrategies: ['API', 'SCRAPER'], // Force BROWSER only
      };
    }
    
    const executor = new DynamicTaskExecutor(aiProvider, executorOptions);

    // Track events
    const events = [];
    executor.on('*', (event) => {
      events.push(event);
      console.log(`[${event.type}]`, event.data);
    });

    // Execute with feedback loop
    const startTime = Date.now();
    const result = await executor.executeWithFeedback(goal, options);
    const executionTime = Date.now() - startTime;

    console.log('Dynamic execution completed:', result.success ? 'SUCCESS' : 'FAILURE');

    return NextResponse.json({
      success: result.success,
      goal,
      goalAchieved: result.success,
      collectedData: result.collectedData,
      summary: result.summary,
      executionTime,
      events: events.map(e => ({
        type: e.type,
        timestamp: e.timestamp,
        data: e.data,
      })),
      aiProvider: {
        type: aiProvider.name,
      },
    });
  } catch (error) {
    console.error('Dynamic automation error:', error);

    return NextResponse.json(
      { error: error.message || 'Automation failed' },
      { status: 500 }
    );
  }
}
