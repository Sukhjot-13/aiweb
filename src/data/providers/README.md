# Providers Layer

## Responsibility

Actual implementation of data storage and external integrations.

## Rules

- **Implementation only** - no business logic
- **Implement standard interface** - defined by repository contract
- **Swappable** - changing provider should not affect other layers
- **No task awareness** - providers don't know about tasks, orchestration, etc.

## Layer Dependencies

✅ Can import: `models`, `utils`  
❌ Cannot import: `services`, `controllers`, `repositories`

## Provider Types

### Storage Providers

- InMemoryTaskStorage (Phase 1 - temporary)
- MongoTaskStorage (Phase 7 - production)
- PostgresTaskStorage (Phase 7 - alternative)

### Automation Providers

- MockApiProvider (Phase 1 - testing)
- MockBrowserProvider (Phase 1 - testing)
- PuppeteerProvider (Phase 7 - production)
- PlaywrightProvider (Phase 7 - alternative)

## Example Structure

```javascript
// providers/inMemoryTaskStorage.js
export const inMemoryTaskStorage = {
  data: new Map(),

  async save(task) {
    this.data.set(task.id, task);
    return task;
  },

  async findById(id) {
    return this.data.get(id) || null;
  },
};
```
