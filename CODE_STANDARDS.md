# AI Web Automation Platform - Code Standards

## Architecture Principles

This document enforces the architectural decisions defined in `project_instructions.md`.

---

## 1. Layered Architecture (Mandatory)

```
Controller → Service → Repository → Provider
```

### Rules

- **Never skip layers** - Controllers cannot call Repositories directly
- **No reverse dependencies** - Providers cannot import Services
- **One-way flow** - Data and control flow in one direction only

### How to Check

```bash
# ESLint will catch layer violations
npm run lint
```

---

## 2. Import Rules

### ✅ Allowed

```javascript
// Absolute imports (preferred)
import { taskService } from "@/services/taskService";
import { Task } from "@/models/Task";

// Relative imports (same directory only)
import { helper } from "./helper";
```

### ❌ Forbidden

```javascript
// Deep imports
import { something } from "../../../services/taskService";

// Layer violations
import { provider } from "@/data/providers/browserProvider"; // in controller
```

---

## 3. File Naming Conventions

### Directories

- `camelCase` for everything: `src/services/`, `src/data/repositories/`

### Files

- `camelCase.js` for implementation: `taskService.js`, `taskRepository.js`
- `PascalCase.js` for classes/models: `Task.js`, `AutomationAction.js`
- `README.md` in each directory to explain its purpose

---

## 4. Function Standards

### Naming

- **Services**: verb + noun → `executeTask()`, `createTask()`
- **Repositories**: CRUD verbs → `findById()`, `save()`, `deleteById()`
- **Utilities**: describe action → `normalizePrice()`, `validateEmail()`

### Structure

```javascript
/**
 * Brief description of what this function does
 * @param {Type} paramName - Description
 * @returns {Type} Description
 */
export async function functionName(paramName) {
  // 1. Validate input
  // 2. Execute logic
  // 3. Return result
}
```

---

## 5. Error Handling

### Pattern

```javascript
// Services throw errors
export async function executeTask(id) {
  if (!id) {
    throw new Error("Task ID is required");
  }
  // ... logic
}

// Controllers catch and format
export async function handleExecuteTask(req) {
  try {
    const result = await executeTask(req.taskId);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

---

## 6. Testing Requirements

### Coverage

- **Models**: 100% coverage (they're pure, easy to test)
- **Services**: 80%+ coverage
- **Utilities**: 100% coverage
- **Providers**: 80%+ coverage

### Test Location

```
src/
  services/
    taskService.js
    taskService.test.js  ← next to implementation
```

### Test Structure

```javascript
describe("taskService", () => {
  describe("executeTask", () => {
    it("should execute task successfully", async () => {
      // Arrange
      // Act
      // Assert
    });

    it("should throw error if task not found", async () => {
      // Arrange
      // Act & Assert
    });
  });
});
```

---

## 7. Configuration Rules

### Environment Variables

```javascript
// ❌ Never do this
const apiKey = "hardcoded-key-123";

// ✅ Always use env vars
const apiKey = process.env.API_KEY;
```

### Constants

```javascript
// config/constants.js
export const TaskState = {
  PENDING: "PENDING",
  RUNNING: "RUNNING",
  // ...
};

// One source of truth for all constants
```

---

## 8. Dependency Injection

### Why

- Makes testing easy
- Makes providers swappable
- Reduces coupling

### How

```javascript
// ❌ Hard dependency
import { browserProvider } from "@/data/providers/browserProvider";

export async function executeAction(action) {
  return browserProvider.execute(action);
}

// ✅ Injected dependency
export async function executeAction(action, provider) {
  return provider.execute(action);
}

// Or with default
export async function executeAction(action, provider = defaultProvider) {
  return provider.execute(action);
}
```

---

## 9. Documentation Requirements

### Every File Must Have

```javascript
/**
 * Brief description of file's purpose
 *
 * Layer: [Controller/Service/Repository/Provider/Model/Util]
 * Dependencies: [list of major dependencies]
 */
```

### Every Public Function Must Have

```javascript
/**
 * Description
 * @param {Type} name - description
 * @returns {Type} description
 * @throws {Error} when...
 */
```

---

## 10. Pre-Commit Checklist

Before committing code, verify:

- [ ] ESLint passes (`npm run lint`)
- [ ] Tests pass (`npm test`)
- [ ] No layer violations
- [ ] No deep imports (`../../../`)
- [ ] No hardcoded values (use config)
- [ ] Functions are documented
- [ ] New code has tests

---

## Common Violations & Fixes

### Violation 1: Controller Calls Provider

```javascript
// ❌ Wrong
import { browserProvider } from "@/data/providers/browserProvider";
const result = await browserProvider.execute();

// ✅ Right
import { taskService } from "@/services/taskService";
const result = await taskService.executeTask();
```

### Violation 2: Deep Imports

```javascript
// ❌ Wrong
import { helper } from "../../../utils/helper";

// ✅ Right (configure jsconfig.json paths)
import { helper } from "@/utils/helper";
```

### Violation 3: Business Logic in Controller

```javascript
// ❌ Wrong (controller has business logic)
export async function handleCreateTask(taskData) {
  const task = new Task(taskData);
  if (task.steps.length === 0) {
    throw new Error("No steps");
  }
  // ... more logic
}

// ✅ Right (delegate to service)
export async function handleCreateTask(taskData) {
  return await taskService.createTask(taskData);
}
```

---

## Enforcement

These rules are enforced by:

1. **ESLint** - Catches structural violations
2. **Code Review** - Human verification
3. **Tests** - Prove correct behavior
4. **Documentation** - This file + README in each directory
