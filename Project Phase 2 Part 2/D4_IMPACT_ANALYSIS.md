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
<img width="799" height="833" alt="1" src="https://github.com/user-attachments/assets/157ba961-0b57-4c69-94f5-b7ed43af727a" />

# Another version of the traceability graph that includes only the parts affected by the changes


<img width="1221" height="745" alt="2" src="https://github.com/user-attachments/assets/b5aa9cdb-d71d-49a3-a1eb-5e9c5b947106" />


# Directed graph of SLOs 

<img width="840" height="835" alt="3" src="https://github.com/user-attachments/assets/4379bfda-64bd-42f1-86d8-9fe619474411" />

# Connectivity Matrix

## Shows the **shortest dependency distance** between each pair of modules.
> `1` = directly connected, `2` = one hop apart, `x` = no path, `-` = same module.

| From → To        | server.js | auth.js | dogs.js | dogService.js | notifications.js | middleware/auth.js | config/db.js | api.js (FE) | dogs.js (FE) | index.js (FE) |
|-----------------|-----------|---------|---------|---------------|------------------|--------------------|--------------|--------------|---------------|----------------|
| server.js        | -         | 1       | 1       | 2             | 1                | 2                  | 2            | x            | x             | x              |
| auth.js          | x         | -       | x       | x             | x                | 1                  | 1            | x            | x             | x              |
| dogs.js          | x         | x       | -       | 1             | x                | 1                  | 1            | x            | x             | x              |
| dogService.js    | x         | x       | x       | -             | x                | x                  | 1            | x            | x             | x              |
| notifications.js | x         | x       | x       | x             | -                | 1                  | 1            | x            | x             | x              |
| middleware/auth.js | x       | x       | x       | x             | x                | -                  | x            | x            | x             | x              |
| config/db.js     | x         | x       | x       | x             | x                | x                  | -            | x            | x             | x              |
| api.js (FE)      | x         | x       | x       | x             | x                | x                  | x            | -            | x             | x              |
| dogs.js (FE)     | x         | x       | x       | x             | x                | x                  | x            | 1            | -             | x              |
| index.js (FE)    | x         | x       | x       | x             | x                | x                  | x            | 1            | x             | -              |


