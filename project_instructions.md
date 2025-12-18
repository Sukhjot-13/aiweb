
# MASTER PROJECT PLAN
## Professional, Modular, Maintainable Software Architecture

---

## 1. Vision & Goals
This project must be:
- Easy to understand
- Easy to modify
- Safe to scale
- Resistant to change in data sources, frameworks, and infrastructure

Primary rule:
> A change in requirement should require changes in **one place only**.

---

## 2. Core Architecture Principles

### 2.1 Single Responsibility Principle (SRP)
- Every function, class, and file must do exactly one thing.
- If logic changes for one reason, it must exist in one place.

### 2.2 Separation of Concerns
Each layer has a single concern:
- Controllers: input/output
- Services: business logic
- Repositories: data access abstraction
- Providers: actual data source implementation

### 2.3 Dependency Inversion
High-level modules never depend on low-level modules.
Both depend on abstractions.

---

## 3. Reusability & Generalization Rule (Mandatory)

- One concept → one implementation
- Functions/components must handle multiple situations via arguments
- No partial or overlapping implementations
- Configuration over duplication

---

## 4. Temporary Values & Incremental Development

- Use constants, mocks, fake data, JSON files first
- Lock function contracts once behavior is correct
- Replace internals later with real DB/APIs without changing callers

---

## 5. Dynamic Behavior & Re-Execution

At the end of designing any function/component, decide:
- Static vs Dynamic
- If dynamic: when, why, and how it re-runs
- Use explicit triggers (events, timers, schedulers)
- Stateless by default

---

## 6. Layered Architecture

Controller → Service → Repository → Provider

Rules:
- No skipping layers
- No reverse dependencies

---

## 7. Folder Structure

src/
- controllers/
- services/
- data/
  - repositories/
  - providers/
- models/
- utils/
- config/

---

## 8. Permission & Access Control Architecture

The application uses a **permission-first, role-based access control (RBAC)** architecture designed for scalability, flexibility, and seamless future migration to a database-driven system.

### Core Principles
- Permissions define capabilities, not roles
- Roles are collections of permissions only
- Explicit access everywhere (no implicit access)
- Ordered authority hierarchy (conceptual, not numeric)
- Environment-aware feature flags
- Per-user permission overrides
- Database-ready by design

### Structure
- **Constants Layer**: defines roles, permissions, role-to-permission mapping (single source of truth)
- **Logic Layer**: pure permission resolution helpers
- **Server Guards**: enforce permissions on all APIs
- **Client Gates**: declarative UI permission control

### UX Philosophy
- Respectful access-denied handling
- No aggressive upgrade pressure
- UI always reflects real permissions

This ensures:
- One change → one file
- No hardcoded checks
- Clean separation of concerns
- Safe future migration to DB-backed RBAC

---

## 9. Data Access Layer (DAL)

- Repository pattern mandatory
- Providers abstract storage (JSON, DB, API)
- Switching data source requires one change only

---

## 10. Service Layer

- Business logic only
- No IO, no HTTP
- Fully testable with mocks

---

## 11. Controller Layer

- Input/output only
- No business logic
- No data access

---

## 12. Models & Validation

- Models define data contracts
- Validate at system boundaries only

---

## 13. Error Handling & Logging

- Errors bubble upward
- Controllers map errors to responses
- Centralized structured logging only

---

## 14. Configuration & Testing

- No hardcoded values
- Environment-based configuration
- Unit tests use mocks & constants
- Integration tests verify real providers

---

## 15. Final Golden Rules

- One change → one place
- One concept → one implementation
- Explicit behavior over magic
- Temporary first, real later
- Architecture over shortcuts

---

## End of Master Plan
