# D4: Impact Analysis
---

## Section 1: Node Legend

### Requirements (R)

| ID  | Requirement Name | Details / Impact |
|-----|------------------|-------------------|
| R1  | User Registration | Handle new user sign-ups. |
| R2  | User Login | Authenticate users and create sessions. |
| R3  | Browse Dogs | View available dogs for adoption. |
| R4  | Search & Filter Dogs | Search dogs by criteria  |
| R5  | Favourite Dogs | Save and manage favorite dogs. |
| R6  | Submit Adoption Request | Allow users to apply for dog adoption. |
| R7  | Review Adoption Request | Admin review and approval of adoptions. |
| R8  | Citizen Verification | Verify citizen ID for adoptions. |
| R9  | Monthly Check-up | Schedule and manage post-adoption check-ups. |
| R10 | Sponsor Registration | Handle user sponsorships for dogs. |
| R11 | Admin Reports | Generate administrative reports. |
| R12 | Notification System | Send alerts and reminders to users  |
| R13 | Dog Management (CRUD) | Admin operations for managing dogs. |

### Design (D) — C4 Containers / Components

| ID  | Design Component | Details / Impact |
|-----|-----------------|-------------------|
| D1  | users table | Stores user credentials and profile data. |
| D2  | dogs table | Stores dog profiles  |
| D3  | favorites table | Maps users to their favorite dogs. |
| D4  | adoption_requests table | Tracks adoption applications and statuses. |
| D5  | delivery_schedules table | Manages dog delivery scheduling. |
| D6  | monthly_followups table | Tracks post-adoption monthly check-ups. |
| D7  | notifications table | Stores system alerts and user messages  |
| D8  | verification tables | Stores citizen identity verification data. |
| D9  | sponsors table | Records sponsorship transactions and info. |
| D10 | Search API Contract | Defines JSON structure for dog search  |

### Code (C) — Modules / Packages

| ID  | Code Module | File(s) | Details / Impact |
|-----|------------|---------|-------------------|
| C1  | Auth Routes | `routes/auth.js` | Handles login/register  |
| C2  | Dogs Routes | `routes/dogs.js` | Dog CRUD and listing  |
| C3  | Favourites Routes | `routes/favourites.js` | User favorites management. |
| C4  | Adoptions Routes | `routes/adoptions.js` | Adoption requests handling. |
| C5  | Checkups Routes | `routes/checkups.js` | Monthly follow-up tracking. |
| C6  | Verify Routes | `routes/verify.js` | Citizen verification process. |
| C7  | Sponsors Routes | `routes/sponsors.js` | Handling sponsorships. |
| C8  | Reports Routes | `routes/reports.js` | Admin reporting endpoints. |
| C9  | Notifications Routes | `routes/notifications.js` | Notification API endpoints  |
| C10 | Dog Service | `services/dogService.js` | Business logic for dogs  |
| C11 | Auth Middleware | `middleware/auth.js` | JWT validation and route protection. |
| C12 | Database Config | `config/db.js` | MySQL connection pool setup. |
| CF1 | Dogs Page (Frontend) | `js/dogs.js` | UI for dog listing  |
| CF2 | Home Page (Frontend) | `js/index.js` | Main landing page UI  |
| CF3 | API Client (Frontend) | `js/api.js` | Frontend fetch wrappers  |

### Test (T) — Test Cases

| ID  | Test Case | Details / Impact |
|-----|----------|-------------------|
| T1  | Auth Routes Tests | `routes.auth.test.js`  |
| T2  | Dogs Routes Tests | `routes.dogs.test.js` |
| T3  | Favourites Routes Tests | `routes.favourites.test.js` |
| T4  | Adoptions Routes Tests | `routes.adoptions.test.js` |
| T5  | Checkups Routes Tests | `routes.checkups.test.js` |
| T6  | Verify Routes Tests | `routes.verify.test.js` |
| T7  | Sponsors Routes Tests | `routes.sponsors.test.js` |
| T8  | Reports Routes Tests | `routes.reports.test.js` |
| T9  | Auth Middleware Tests | `middleware.auth.test.js` |

---
# Traceability graph

<img width="799" height="833" alt="1" src="https://github.com/user-attachments/assets/157ba961-0b57-4c69-94f5-b7ed43af727a" />

## Traceability Graph Analysis

The traceability graph shows how requirements (R) connect to design (D), code (C), and test (T).

Most core features like login (R1, R2), dog search (R3, R4), and notifications (R12) are fully linked across all layers. For example, the notification system (R12) connects to the notifications table (D7), notifications routes (C9), and related test cases.

Important features like adoption (R6, R7) and dog management (R13) connect to many modules, which means they are more complex and tightly linked.

Overall, the system has good traceability. Most requirements are clearly implemented and tested. However, some parts have many connections, which may make them harder to maintain.

# Another version of the traceability graph that includes only the parts affected by the changes


<img width="1221" height="745" alt="2" src="https://github.com/user-attachments/assets/b5aa9cdb-d71d-49a3-a1eb-5e9c5b947106" />

## Affected Traceability Graph Analysis

This graph shows only the parts affected by the new features: search (R4) and notifications (R12).

These changes mainly affect the dogs table (D2), notifications table (D7), and search API (D10). The related code includes dogs routes (C2), notifications routes (C9), and dog service (C10), along with frontend modules (CF1–CF3).

The impact is limited to a few modules, which means the system is fairly modular. Changes do not spread to unrelated parts.

However, there are still links between frontend and backend, so testing must cover both sides.

Overall, the impact is moderate and mostly localized.

# Directed graph of SLOs 

<img width="840" height="835" alt="3" src="https://github.com/user-attachments/assets/4379bfda-64bd-42f1-86d8-9fe619474411" />

## SLO Graph Analysis

The SLO graph shows dependencies between code modules. Each arrow means one module depends on another.

server.js is the main entry point and connects to many modules like auth.js, dogs.js, and notifications.js.

Backend modules use services and middleware (dogService.js, middleware/auth.js, config/db.js), which shows a layered design. This helps keep code organized.

config/db.js is used by many modules, so it is a critical shared component. Changes here can affect many parts.

Frontend modules (index.js, dogs.js, api.js) mostly go through api.js to reach the backend. This reduces direct coupling.

Overall, the system has a clear structure, but central modules like server.js and config/db.js are high-impact points.

# Connectivity Matrix

## Shows the **shortest dependency distance** between each pair of modules.

| From → To        | server.js | auth.js | dogs.js | dogService.js | notifications.js | middleware/auth.js | config/db.js | api.js (FE) | dogs.js (FE) | index.js (FE) |
|-----------------|-----------|---------|---------|---------------|------------------|--------------------|--------------|--------------|---------------|----------------|
| server.js        | -         | 1       | 1       | 2             | 1                | 2                  | 2            | -            | -             | -              |
| auth.js          | -         | -       | -       | -             | -                | 1                  | 1            | -            | -             | -              |
| dogs.js          | -         | -       | -       | 1             | -                | 1                  | 1            | -            | -             | -              |
| dogService.js    | -         | -       | -       | -             | -                | x                  | 1            | -            | -             | -              |
| notifications.js | -         | -       | -       | -             | -                | 1                  | 1            | -            | -             | -              |
| middleware/auth.js | -       | -       | -       | -             | -                | -                  | -            | -            | -             | -              |
| config/db.js     | -         | -       | -       | -             | -                | -                  | -            | -            | -             | -              |
| api.js (FE)      | -         | -       | -       | -             | -                | -                  | -            | -            | -             | -              |
| dogs.js (FE)     | -         | -       | -       | -             | -                | -                  | -            | 1            | -             | -              |
| index.js (FE)    | -         | -       | -       | -             | -                | -                  | -            | 1            | -             | -              |

## Connectivity Matrix Analysis

The connectivity matrix shows the shortest distance between modules.

server.js has short distances to many modules, showing it is the central controller. config/db.js is also close to many modules, making it a key shared dependency.

Distance = 1 means direct connection, such as dogs.js → dogService.js. Distance = 2 or 3 means indirect connections.

"x" means no connection, which shows some modules are independent. This is good for reducing side effects.

However, many modules depend on shared components like config/db.js and middleware/auth.js. Changes in these modules can affect many others.

Overall, the matrix confirms a moderately connected system with some strong central dependencies.

## Analysis Questions

### Q1 Which CRs are easy to implement and why?

| CR | Type | Why Easy |
| --- | --- | --- |
| **CR-02** Fix decimal `limit` param | Corrective | A one-line guard in `dogs.js`. No DB schema change, no new files. |
| **CR-05** Add composite DB index | Perfective | A single `CREATE INDEX` SQL statement. Does not change any application code. |
| **CR-08** Escape LIKE wildcards | Preventive | A small helper function added to `dogService.js`. Localised change with no side-effects on other modules. |
| **CR-07** Deduplicate reminders | Preventive | Already implemented in `auth.js` with a single `SELECT` check before `INSERT`. No schema change needed. |

**Summary:** CRs that only touch a single module, require no schema changes, and have no downstream consumers are easiest to implement and test.

---

### Q2 Which CRs are difficult to implement and why?

| CR | Type | Why Difficult |
| --- | --- | --- |
| **CR-03** Auto-notify on adoption decision | Adaptive | Requires coordinating two modules (`adoptions.js` writes a record, `notifications.js` stores it). The adoption flow must be updated atomically so a notification is never inserted without a successful status change. |
| **CR-04** Standardised response for mobile | Adaptive | Required creating a brand-new service layer (`dogService.js`), a new API endpoint (`/api/dogs/search`), updating the frontend (`dogs.js`), and ensuring backward compatibility with the old `/api/dogs` endpoint so existing web pages do not break. |
| **CR-06** Notification dropdown UX | Perfective | Involves cross-cutting changes across HTML structure, CSS styling, and JavaScript logic (`index.js`). "Mark all as read" requires multiple sequential API calls and local state management in the UI. |

**Summary:** CRs that span multiple modules, require new DB tables, or must maintain backward compatibility are the most difficult.

---

### Q3 What improvements are expected from previous developers?

Based on the inherited codebase analysis:

1. **No service layer.** All business logic was written directly inside route handlers (`dogs.js` had 311 lines of mixed routing and SQL). We introduced `dogService.js` to separate concerns. Future developers should continue this pattern for `adoptions.js` and `checkups.js`.
2. **Inconsistent API response format.** Some endpoints returned `{ dogs: [] }`, others `{ message: '...' }`, and the new search endpoint returns `{ success, data, message }`. A shared response helper should be created to enforce one format across all routes.
3. **No input validation middleware.** Each route manually validates its own inputs. A shared validation layer (e.g., using `express-validator`) would reduce duplication and prevent bugs like the decimal `limit` issue (CR-02).
4. **Missing notification integration in adoption flow**. The original `adoptions.js` had no side-effects on the notifications table. Developers should ensure all user-facing status changes (delivery scheduled, check-up approved, etc.) trigger appropriate notifications.
5. **Frontend JS files are large and unstructured**. `dogs.js` (frontend) is 18,999 bytes of mixed DOM manipulation, API calls, and UI logic. Breaking it into smaller, focused modules would improve maintainability.


