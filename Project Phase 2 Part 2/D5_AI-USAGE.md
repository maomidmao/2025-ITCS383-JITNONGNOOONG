# D5: Al-Usage Report

## D5: AI-Usage Report Description

- You can use the AI coding agents to help you complete this project. However,
you must report on how to use such AIs.
- Create a file called D5_AI-USAGE.md and list the activities that you use the
AI to help you with in this project.

# D5: AI-Usage Report

This document serves as the required D5 deliverable outlining how AI coding agents were used to assist in the completion of Project Phase 2 Part 2. The AI was utilized to accelerate the development of the new notification features, maintain architectural consistency, and troubleshoot deployment infrastructure.

## 1. AI-Assisted Development Activities

The development of the notification system and related infrastructure was broken down into several key activities where the AI provided direct assistance:

### Database & Backend Architecture (Task 1)

- **Schema Design:** The AI generated the MySQL `CREATE TABLE` statement for a new `notifications` table. This included setting up appropriate data types and constraints, such as an `ENUM` for notification types (approved, rejected, reminder) and a `BOOLEAN` for the `is_read` status.
- **API Implementation:** The AI drafted the Express.js routes for the notification system. This included creating endpoints for fetching notifications (`GET /notifications`), internal creation (`POST /notifications`), and updating the read status (`PATCH /notifications/:id/read`).

### Business Logic Automation (Task 1)

- **Adoption Triggers:** The AI was prompted to modify the existing adoption approval and rejection logic. It successfully integrated automated database insertions so that when staff approves or rejects a request, a corresponding notification is created for the user.
- **Reminder System:** The AI implemented a lightweight monthly reminder system that checks for due pet check-ups upon user login and generates a reminder notification if one is due.

### Frontend UI Integration (Task 2)

- **Dynamic Injection:** Instead of manually updating every HTML page, the AI developed an `initNotificationBell()` function within `api.js` to dynamically inject a notification bell icon into the header for authenticated users.
- **Interactive Elements:** The AI wrote the frontend logic to display an unread count badge, render a togglable dropdown list of notifications, and instantly update the UI (removing blue highlights and decrementing the badge count) when a user clicks an unread notification.

### Deployment & Infrastructure Troubleshooting (Task 2)

- **Session Persistence Fix:** When deploying the backend to Render, sessions were not persisting. The AI analyzed the issue and identified that Render acts as a reverse proxy. It provided the necessary fix by updating the session cookie configuration to include `secure: true` and `sameSite: 'none'`, which is required for cross-domain HTTP/HTTPS handling.

## 2. Summary of AI Prompts
