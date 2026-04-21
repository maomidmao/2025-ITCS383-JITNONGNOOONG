# AI Agent Instructions

## Project Overview

This is a Dog Adoption system using:

* Backend: Node.js (Express)
* Database: MySQL
* Frontend: Vanilla JavaScript (HTML/CSS)

---

## Architecture Rules

* Follow REST API design
* Separate layers:

  * Routes
  * Controllers
  * Services
  * Database queries
* Do not mix business logic inside routes

---

## Coding Standards

* Use async/await (no callback hell)
* Handle errors using try/catch
* Return consistent JSON format:
  {
  success: boolean,
  data: any,
  message: string
  }

---

## Database Rules

* Use parameterized queries (prevent SQL injection)
* Avoid raw string concatenation in SQL
* Use indexes for searchable fields (name, breed)

---

## Feature Implementation Rules

### Search Engine

* Build dynamic SQL query based on filters
* Use LIKE for keyword search
* Escape special characters safely
* Do not fetch all data then filter in JS (must filter in SQL)

### Notification System

* Use event-based logic (trigger on approve/reject)
* Store all notifications in database
* Ensure notifications belong to correct user
* Support unread/read state

---

## Performance Guidelines

* Avoid unnecessary DB calls
* Use pagination if result is large
* Keep API response time fast (<300ms if possible)

---

## Testing Rules

* Write unit tests for:

  * Search API
  * Notification logic
* Cover edge cases

---

## Refactoring Rules

* Reduce code duplication
* Split large functions into smaller reusable functions
* Improve readability and maintainability

---

## What NOT to do

* Do not rewrite entire system
* Do not change existing working features
* Do not break RBAC (role-based access control)
