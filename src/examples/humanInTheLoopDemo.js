/**
 * @fileoverview Human-in-the-Loop Demo
 * Demonstrates pausing task execution to request user input.
 */

import TaskOrchestrator from '../services/TaskOrchestrator.js';
import { TaskExecutor } from '../services/TaskExecutor.js';
import { getAIProvider } from '../ai/AIProviderFactory.js';
import InputRequestManager from '../services/InputRequestManager.js';
import TaskPersistenceService from '../services/TaskPersistenceService.js';
import { ProviderRegistry } from '../data/providers/ProviderRegistry.js';
import { MockBrowserProvider } from '../data/providers/MockBrowserProvider.js';
import { MockScraperProvider } from '../data/providers/MockScraperProvider.js';
import { MockApiProvider } from '../data/providers/MockApiProvider.js';
import { StrategyType } from '../models/AutomationStrategy.js';

/**
 * Demo: Book flight with user input for dates
 */
async function demoFlightBooking() {
  console.log('=== Human-in-the-Loop Demo: Flight Booking ===\n');

  // Setup
  const registry = ProviderRegistry.getInstance();
  registry.register(new MockApiProvider(), StrategyType.API);
  registry.register(new MockScraperProvider(), StrategyType.SCRAPER);
  registry.register(new MockBrowserProvider(), StrategyType.BROWSER);

  const aiProvider = getAIProvider();
  const executor = new TaskExecutor();
  const orchestrator = new TaskOrchestrator(aiProvider, executor);
  const inputManager = new InputRequestManager();
  const persistence = new TaskPersistenceService();

  // Progress tracking
  orchestrator.on('*', (event) => {
    console.log(`[${event.type}]`, event.data);
  });

  const goal = 'Book a flight from NYC to LAX';

  // Phase 1: Start task execution
  console.log('Starting task...');
  const task = await orchestrator.planAndExecute(goal);

  // Simulate task reaching a point where it needs user input
  console.log('\n--- Task needs user input ---');
  
  // Create input request
  const request = inputManager.requestText(
    task.id,
    'What are your preferred travel dates? (e.g., 2024-03-15 to 2024-03-20)',
    { required: true }
  );

  console.log('Input request created:', request.id);
  console.log('Prompt:', request.prompt);

  // Simulate user providing input
  console.log('\n--- User provides input ---');
  const userInput = '2024-03-15 to 2024-03-20';
  const validationResult = inputManager.resolveRequest(request.id, userInput);

  if (validationResult.success) {
    console.log('✓ Input validated and accepted');
    console.log('Input:', validationResult.request.response);
  } else {
    console.log('✗ Input validation failed:', validationResult.errors);
  }

  // Save to persistence
  await persistence.saveTask(task);
  console.log('\n✓ Task saved to persistence');

  console.log('\n=== Demo Complete ===\n');
}

/**
 * Demo: Form filling with confirmation
 */
async function demoFormWithConfirmation() {
  console.log('=== Human-in-the-Loop Demo: Form Confirmation ===\n');

  const inputManager = new InputRequestManager();

  const taskId = 'task_demo_123';

  // Request confirmation
  const confirmRequest = inputManager.requestConfirmation(
    taskId,
    'About to submit form with email "user@example.com". Proceed?'
  );

  console.log('Confirmation request:', confirmRequest.prompt);

  // User confirms
  const confirmResult = inputManager.resolveRequest(confirmRequest.id, true);

  if (confirmResult.success) {
    console.log('✓ User confirmed - proceeding with form submission');
  } else {
    console.log('✗ User cancelled');
  }

  console.log('\n=== Demo Complete ===\n');
}

/**
 * Demo: Multi-choice selection
 */
async function demoMultiChoice() {
  console.log('=== Human-in-the-Loop Demo: Product Selection ===\n');

  const inputManager = new InputRequestManager();
  const taskId = 'task_demo_456';

  // Request choice
  const choiceRequest = inputManager.requestChoice(
    taskId,
    'Found 3 products. Which one would you like?',
    ['iPhone 14 Pro - $999', 'iPhone 14 - $799', 'iPhone SE - $429']
  );

  console.log('Choice request:', choiceRequest.prompt);
  console.log('Options:', choiceRequest.options.choices);

  // User selects
  const choiceResult = inputManager.resolveRequest(
    choiceRequest.id,
    'iPhone 14 - $799'
  );

  if (choiceResult.success) {
    console.log('✓ User selected:', choiceResult.request.response);
  } else {
    console.log('✗ Invalid selection:', choiceResult.errors);
  }

  console.log('\n=== Demo Complete ===\n');
}

// Run demos
async function runAll() {
  try {
    await demoFlightBooking();
    await demoFormWithConfirmation();
    await demoMultiChoice();
  } catch (error) {
    console.error('Demo error:', error);
  }
}

// Export for use
export {
  demoFlightBooking,
  demoFormWithConfirmation,
  demoMultiChoice,
  runAll,
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAll();
}
