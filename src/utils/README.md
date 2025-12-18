# Utilities Layer

## Responsibility

Reusable helper functions used across the application.

## Rules

- **Pure functions** - no side effects
- **Single purpose** - each utility does one thing
- **Well tested** - aim for 100% coverage
- **Framework agnostic** - should work anywhere

## Categories

### Validation

- Schema validation
- Type checking
- Input sanitization

### Normalization

- Currency formatting
- Date parsing
- Text cleaning

### Serialization

- JSON serialization/deserialization
- Deep cloning
- Object comparison

## Example Structure

```javascript
// utils/normalize.js
export function normalizeCurrency(value, currency = "USD") {
  // Implementation
}

export function normalizeDate(dateString) {
  // Implementation
}
```
