# Services Layer

## Responsibility

Contain all business logic for the application.

## Rules

- **Pure business logic only** - no I/O, no HTTP
- **Fully testable** - use dependency injection
- **No framework dependencies** - should work outside Next.js
- **Call repositories** - for data access

## Layer Dependencies

✅ Can import: `repositories`, `models`, `utils`, `config`  
❌ Cannot import: `controllers`, `providers` (use repositories instead)

## Example Structure

```javascript
// services/taskOrchestrator.js
import { taskRepository } from "@/data/repositories/taskRepository";

export async function executeTask(taskId) {
  // 1. Get task from repository
  // 2. Execute business logic
  // 3. Update task state
  // 4. Return result
}
```
