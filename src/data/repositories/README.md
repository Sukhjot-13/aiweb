# Repositories Layer

## Responsibility

Abstract data access from services. Define what data operations are available, not how they work.

## Rules

- **Define interfaces** - what operations exist
- **Use providers** - delegate to actual storage implementation
- **Hide storage details** - services should never know about DB, JSON, etc.
- **One repository per domain entity** - TaskRepository, UserRepository, etc.

## Layer Dependencies

✅ Can import: `providers`, `models`, `utils`  
❌ Cannot import: `services`, `controllers`

## Example Structure

```javascript
// repositories/taskRepository.js
import { inMemoryTaskStorage } from "@/data/providers/inMemoryTaskStorage";

export const taskRepository = {
  async createTask(task) {
    return await inMemoryTaskStorage.save(task);
  },

  async getTask(id) {
    return await inMemoryTaskStorage.findById(id);
  },
};
```

## Provider Swapping

Changing from JSON → Database should only require changing ONE line:

```javascript
// Before: import { inMemoryTaskStorage } from './providers/inMemoryTaskStorage';
// After:  import { mongoTaskStorage } from './providers/mongoTaskStorage';
```
