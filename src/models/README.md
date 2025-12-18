# Models Layer

## Responsibility

Define data structures, schemas, and validation rules.

## Rules

- **Pure data structures** - no I/O, no side effects
- **Validation included** - each model validates its own data
- **Serialization support** - can convert to/from JSON
- **Immutable by default** - prefer frozen objects

## Layer Dependencies

✅ Can import: `utils` (for validation helpers)  
❌ Cannot import: anything else

## Example Structure

```javascript
// models/Task.js
export const TaskState = {
  PENDING: "PENDING",
  RUNNING: "RUNNING",
  PAUSED: "PAUSED",
  WAITING_FOR_INPUT: "WAITING_FOR_INPUT",
  FAILED: "FAILED",
  COMPLETED: "COMPLETED",
};

export class Task {
  constructor({ id, goal, steps, state, result }) {
    this.id = id;
    this.goal = goal;
    this.steps = steps;
    this.state = state || TaskState.PENDING;
    this.result = result || null;

    this.validate();
  }

  validate() {
    if (!this.id) throw new Error("Task ID is required");
    if (!this.goal) throw new Error("Task goal is required");
    // ... more validation
  }

  toJSON() {
    return {
      id: this.id,
      goal: this.goal,
      steps: this.steps,
      state: this.state,
      result: this.result,
    };
  }

  static fromJSON(data) {
    return new Task(data);
  }
}
```
