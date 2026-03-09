# JITNONGNOONG — D3 AI Usage Log

**Project:** Dog Adoption System  
**Course:** ITCS383 Software Construction and Evolution  
**Group:** JITNONGNOONG  
**Phase:** Phase 1 — v1.0  

---

## Summary

This document combines the team AI usage log entries and the latest implementation-phase AI support history into one file.  
For each entry, the log records: prompt used, accepted/rejected output, and concrete verification.

---

## Part A — Core D3 AI Log Entries

### Entry 1 — System Architecture and C4 Design

**Date:** January 2025  
**AI Tool:** Claude (Anthropic)  
**Area:** Design / D1 Deliverable

**Prompt Used:**
> "We are building a Dog Adoption System for a Thai animal shelter. The system has four roles: General User (Thai citizens only), Organization Staff, Admin, and Eligible Sponsor. It connects to three external systems: Criminal Record System, Citizen Profile System, and Blacklist System. Help us structure the C4 Context and Container diagrams and explain the component boundaries."

**What Was Accepted:**
- The suggestion to separate the backend into distinct API components (Login API, SignIn API, Dog Profile API, Adoption API, Report API) rather than one monolithic controller.
- The recommendation to use a Security Component to centralise authentication and password hashing.
- The idea of a dedicated Verify Component to isolate external system calls.

**What Was Rejected:**
- Combining User Database and Sponsor Database into a single users table.
- Using GraphQL instead of REST.

**Verification:**
- Manual team review against requirements.
- Cross-check C4 boundaries against DFD Level 2.
- Committed design artifacts under `designs/`.

---

### Entry 2 — Database Schema Design

**Date:** January 2025  
**AI Tool:** Claude (Anthropic)  
**Area:** Database / SQL Schema

**Prompt Used:**
> "Here is our Dog Adoption System entity list: User, Dog, Adoption, Sponsor, TreatmentRecord, TrainingRecord, FavoriteList, DeliverySchedule. Design a normalised MySQL schema with proper primary keys, foreign keys, and data types. The system must support role-based users, dog status tracking, and a one-year monthly check-up process after adoption."

**What Was Accepted:**
- Normalized tables for core entities.
- `ENUM` constraints for dog/adoption status.
- FK constraints across users/dogs/adoptions.
- Role-based user model in DB.

**What Was Rejected:**
- Sponsor data collapsed into generic users with sparse nullable columns.
- Overuse of `TEXT` where bounded `VARCHAR` is more appropriate.

**Verification:**
- Imported SQL on local MySQL.
- Verified FK constraints (`SHOW CREATE TABLE`).
- Inserted sample data and checked invalid enum rejection.

---

### Entry 3 — Authentication and Password Security Implementation

**Date:** February 2025  
**AI Tool:** Claude (Anthropic)  
**Area:** Backend — Login API / Security Component

**Prompt Used:**
> "Implement a login and registration system in Node.js/Express with MySQL. Users should register with email and password. Passwords must be hashed using bcrypt. On login, return a JWT token. Use a separate security service to handle hashing and token generation so the route handler stays clean."

**What Was Accepted:**
- Separation of controller/service/security responsibilities.
- Bcrypt hashing and centralized auth middleware.

**What Was Rejected:**
- Hardcoded secret in source code.
- Insecure frontend token storage patterns.

**Verification:**
- Endpoint checks for register/login success and failure paths.
- Protected route validation checks.
- Local test execution for auth-related behavior.

---

### Entry 4 — Dog Profile CRUD API

**Date:** February 2025  
**AI Tool:** Claude (Anthropic)  
**Area:** Backend — Dog Profile API

**Prompt Used:**
> "Implement a RESTful CRUD API in Express.js for dog profiles. Each dog has: name, breed, age, gender, image URL, general info, training profile, medical profile, personality, and dog status. Only Organization Staff should be able to create, update, or delete profiles. General users can only read. Use the auth middleware to protect routes."

**What Was Accepted:**
- CRUD endpoint structure and RBAC middleware.
- Controller/service split for maintainability.

**What Was Rejected:**
- Broad `SELECT *` usage.
- Hard delete for dogs (replaced with status-driven behavior).

**Verification:**
- Postman endpoint checks by role.
- Public list access validation.
- Static analysis review and manual refactor review.

---

### Entry 5 — Adoption Request Flow

**Date:** February 2025  
**AI Tool:** Claude (Anthropic)  
**Area:** Backend — Adoption API / Verify Component

**Prompt Used:**
> "Implement the adoption request flow in Node.js. A general user submits a request for a dog. The system must: (1) check the user is not on the blacklist, (2) check the user has no criminal record, (3) check the dog is still available, (4) create an adoption record with status 'pending'. Staff can approve or reject the request. On approval, update the dog status to 'adopted' and create a delivery schedule. Use a Verify Component to call the external Criminal Record and Blacklist APIs."

**What Was Accepted:**
- Verification abstraction via dedicated component/service.
- Ordered validation flow before record creation.
- Clear user-facing error messages.

**What Was Rejected:**
- Long route handlers with mixed responsibilities.
- Nested callback style.

**Verification:**
- Blacklist/criminal fail scenarios.
- Valid approval path updates dog status and schedule.
- Unit/service behavior checks with mocked external responses.

---

### Entry 6 — Code Quality and Refactoring (Code Smell Removal)

**Date:** February–March 2025  
**AI Tool:** Claude (Anthropic)  
**Area:** Code Quality / All Modules

**Prompt Used:**
> "Review the following Node.js service files for code smells based on clean code principles. Identify: long methods, duplicate code, magic numbers, poor variable names, and missing error handling. Suggest refactors without changing the external behaviour. The code needs to be clean with no code smell for code quality and prepared for future implementation and validation."

**What Was Accepted:**
- Error-handling utility extraction.
- Better naming and method decomposition.
- More complete async error handling.

**What Was Rejected:**
- Full TypeScript migration during Phase 1.
- Over-documenting all internals with excessive JSDoc.

**Verification:**
- Static analysis delta checks.
- Regression tests.
- Manual behavior parity review.

---

### Entry 7 — Unit Test Generation for Core Services

**Date:** March 2025  
**AI Tool:** Claude (Anthropic)  
**Area:** Testing

**Prompt Used:**
> "Generate unit tests using Jest for the following service functions in our Dog Adoption System: (1) authService.hashPassword and authService.verifyPassword, (2) dogService.getDogById, (3) adoptionService.createAdoptionRequest. Mock the database connection. Cover: happy path, invalid inputs, and error cases."

**What Was Accepted:**
- Structured `describe`/`it` organization.
- DB mocking approach and setup/teardown pattern.
- Happy/invalid/error case coverage.

**What Was Rejected:**
- Brittle assertions tied to exact SQL strings.
- Vague test descriptions.

**Verification:**
- Local test run and coverage checks.
- Manual review for meaningful test intent.

---

## Part B — Additional AI-Assisted Implementation Iterations (Project Workspace)

### Entry 8 — Appointment/handover/follow-up state flow

**Date:** February 2026  
**AI Tool:** Codex (GPT-5 based coding assistant)  
**Area:** Adoption + checkups flow

**Prompt Used (summary):**
- Adopter sets appointment after approval.
- Staff confirms delivery/handover.
- Follow-up upload only after successful handover.
- Staff and adopter tracking view must share same follow-up data.

**Accepted:**
- Added/updated appointment endpoints and transitions.
- Shared follow-up model for both dashboards.

**Rejected/Revised:**
- UI patterns that caused role confusion; revised to explicit staff-controlled final handover.

**Verification:**
- End-to-end manual checks:
  - approved request appears in appointment tab,
  - appointment review updates status,
  - follow-up upload gated by completed handover.

---

### Entry 9 — Sponsor upload and homepage banner fixes

**Date:** February–March 2026  
**AI Tool:** Codex (GPT-5 based coding assistant)  
**Area:** Sponsors API + homepage

**Prompt Used (summary):**
- Fix sponsor logo/banner upload errors.
- Make homepage show sponsor banner linked to uploaded URL.
- Show latest sponsor as primary banner.
- Increase banner size and make layout mobile-first.

**Accepted:**
- Multi-file upload support (`logo` + `banner`).
- JSON-safe API error handling in frontend client.
- Latest-sponsor ordering and large responsive banner rendering.

**Rejected/Revised:**
- Reading global sponsor list for current sponsor profile; revised to dedicated `/api/sponsors/my` behavior.

**Verification:**
- Syntax checks:
  - `node --check implementations/backend/routes/sponsors.js`
  - `node --check implementations/frontend/js/api.js`
- UI behavior checks:
  - sponsor upload succeeds,
  - homepage shows one latest banner,
  - banner link opens sponsor URL,
  - mobile/desktop banner sizing works.

---

### Entry 10 — Core Logic Test Creation

**Date:** March 2026  
**AI Tool:** Codex (GPT-5 based coding assistant)  
**Area:** Testing

**Prompt Used:**
> "create the test for the core logic for me"

**What Was Accepted:**
- Test planning for core service logic with focus on behavior-driven cases.
- Suggested structure to separate happy path, validation failures, and data-access error paths.
- Use of mocked dependencies for deterministic test runs.

**What Was Rejected:**
- Assertions tied too tightly to implementation internals (e.g., exact SQL text), because they are brittle.

**Verification:**
- Manual review that each test case maps to a business rule.
- Confirmed coverage focus on critical core logic paths (not only utility functions).
- Ensured test descriptions are explicit and readable for maintainers.

---

## Overall AI Usage Principles

1. **AI as a drafting assistant, not final authority.** All suggestions were reviewed by humans.
2. **Architecture-first decisions stayed human-owned.** Conflicting AI suggestions were rejected.
3. **Concrete verification required before acceptance.** Static checks, endpoint checks, and UI scenarios were used.
4. **No blind copy-paste.** Naming, validation, error handling, and role logic were adjusted to project standards.

---

## Final Statement

AI tools were used to accelerate design, implementation, debugging, and documentation.  
Accepted outputs were validated with concrete checks before adoption; rejected outputs are recorded with rationale for traceability.

*End of D3 AI Usage Log — JITNONGNOONG*
