# Controllers Layer

## Responsibility

Handle input/output for API routes and UI components.

## Rules

- **No business logic** - delegate to services
- **No data access** - use services only
- **Validate input** - at system boundaries
- **Format output** - transform service results for consumers

## Layer Dependencies

✅ Can import: `services`, `models`, `utils`  
❌ Cannot import: `repositories`, `providers`

## Example Structure

```javascript
// controllers/taskController.js
import { createTask } from "@/services/taskService";

export async function handleCreateTask(req) {
  // 1. Validate input
  // 2. Call service
  // 3. Format response
  // 4. Handle errors
}
```
