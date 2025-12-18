/**
 * @fileoverview Price Comparison Task - Reference Implementation
 * Demonstrates a complete automation task that searches multiple marketplaces
 * for a product and finds the cheapest price.
 * 
 * This is the Phase 1 acceptance test.
 */

const { Task } = require('../models/Task');
const { AutomationStep } = require('../models/AutomationStep');
const { AutomationAction } = require('../models/AutomationAction');

/**
 * Creates a price comparison task
 * @param {string} productName - Product to search for
 * @returns {Task} Configured task
 */
function createPriceComparisonTask(productName) {
  const task = new Task({
    goal: `Find the cheapest price for ${productName} across multiple marketplaces`,
    metadata: {
      productName,
      marketplaces: ['marketplace-a.com', 'marketplace-b.com'],
    },
  });

  // Step 1: Normalize product name (simulated - stores in context)
  const step1 = new AutomationStep({
    action: AutomationAction.wait({ duration: 10 }),
    description: 'Normalize product name for search',
    expectedOutput: {
      completed: 'boolean',
    },
    context: {
      normalizedProduct: productName.toLowerCase().trim(),
    },
  });

  // Step 2: Search Marketplace A
  const step2 = new AutomationStep({
    action: AutomationAction.search(productName, { maxResults: 10 }),
    description: 'Search Marketplace A for product',
    expectedOutput: {
      results: 'array',
      totalCount: 'number',
    },
  });

  // Step 3: Extract prices from Marketplace A results
  const step3 = new AutomationStep({
    action: AutomationAction.navigate(`https://marketplace-a.com/search?q=${encodeURIComponent(productName)}`),
    description: 'Navigate to Marketplace A search results',
    expectedOutput: {
      url: 'string',
      statusCode: 'number',
    },
  });

  const step4 = new AutomationStep({
    action: AutomationAction.extractText('.product-price', { multiple: true }),
    description: 'Extract product prices from Marketplace A',
    expectedOutput: {
      text: 'array',
      count: 'number',
    },
  });

  // Step 5: Search Marketplace B
  const step5 = new AutomationStep({
    action: AutomationAction.navigate(`https://marketplace-b.com/search?q=${encodeURIComponent(productName)}`),
    description: 'Navigate to Marketplace B search results',
    expectedOutput: {
      url: 'string',
      statusCode: 'number',
    },
  });

  const step6 = new AutomationStep({
    action: AutomationAction.extractText('.product-price', { multiple: true }),
    description: 'Extract product prices from Marketplace B',
    expectedOutput: {
      text: 'array',
      count: 'number',
    },
  });

  // Add all steps to task
  task.addStep(step1);
  task.addStep(step2);
  task.addStep(step3);
  task.addStep(step4);
  task.addStep(step5);
  task.addStep(step6);

  return task;
}

/**
 * Processes task results to find cheapest price
 * @param {Object} taskResult - Task execution result
 * @returns {Object} Comparison result with cheapest price
 */
function processPriceComparisonResult(taskResult) {
  if (!taskResult || !taskResult.successfulSteps) {
    return {
      success: false,
      error: 'No successful steps in task result',
    };
  }

  // Extract all prices from step results
  const allPrices = [];

  taskResult.successfulSteps.forEach(step => {
    if (step.stepDescription.includes('Extract product prices')) {
      const marketplace = step.stepDescription.includes('Marketplace A') ? 'Marketplace A' : 'Marketplace B';
      const priceTexts = Array.isArray(step.data.text) ? step.data.text : [step.data.text];

      priceTexts.forEach(priceText => {
        const price = parsePrice(priceText);
        if (price !== null) {
          allPrices.push({
            marketplace,
            price,
            formattedPrice: priceText,
          });
        }
      });
    }

    // Also check search results
    if (step.data && step.data.results) {
      step.data.results.forEach(result => {
        if (result.price) {
          const price = typeof result.price === 'number' ? result.price : parsePrice(result.price);
          if (price !== null) {
            allPrices.push({
              marketplace: 'Search Result',
              productName: result.title,
              price,
              formattedPrice: `$${price.toFixed(2)}`,
            });
          }
        }
      });
    }
  });

  if (allPrices.length === 0) {
    return {
      success: false,
      error: 'No prices found in results',
    };
  }

  // Find cheapest
  allPrices.sort((a, b) => a.price - b.price);
  const cheapest = allPrices[0];

  return {
    success: true,
    cheapestPrice: cheapest,
    allPrices,
    priceCount: allPrices.length,
    priceRange: {
      min: allPrices[0].price,
      max: allPrices[allPrices.length - 1].price,
      average: allPrices.reduce((sum, p) => sum + p.price, 0) / allPrices.length,
    },
  };
}

/**
 * Parses price from text
 * @param {string} priceText - Price text (e.g., "$999.00")
 * @returns {number|null} Parsed price or null
 */
function parsePrice(priceText) {
  if (typeof priceText !== 'string') {
    return null;
  }

  // Remove currency symbols and parse
  const cleanPrice = priceText.replace(/[$,]/g, '').trim();
  const price = parseFloat(cleanPrice);

  return isNaN(price) ? null : price;
}

module.exports = {
  createPriceComparisonTask,
  processPriceComparisonResult,
  parsePrice,
};
