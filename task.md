# Phase 2 Maintenance Tasks

## Project Context

Existing system: Dog Adoption Platform (Node.js + Express + MySQL + Vanilla JS)

---

# Feature 1: Search Engine

## Goal

Allow users to search and filter dogs on Dog Browsing page without scrolling.

## Backend Tasks

* Create API endpoint: GET /dogs/search
* Support query parameters:

  * keyword (search by name, breed)
  * breed
  * color
  * training_status
  * availability
* Implement SQL filtering with WHERE conditions
* Handle special characters in search (%, &, @)
* Optimize query performance (use indexes if needed)

## Frontend Tasks

* Add search bar UI on Dog Browsing page
* Add filter panel:

  * Breed dropdown
  * Color dropdown
  * Training status dropdown
  * Availability toggle
* Trigger API call on:

  * typing keyword
  * changing filter
* Display filtered results dynamically
* Show "No results found" state

## Edge Cases

* Empty keyword
* Invalid filter values
* Special characters breaking query

---

# Feature 2: Status Notification

## Goal

Notify users when adoption request status changes or check-up reminder is due.

## Backend Tasks

* Create notifications table:

  * id
  * user_id
  * message
  * type (approved / rejected / reminder)
  * is_read
  * created_at
* Create API:

  * GET /notifications
  * POST /notifications (internal use)
  * PATCH /notifications/:id/read
* Trigger notification when:

  * Staff approves request
  * Staff rejects request (include reason)
  * Monthly check-up is approaching

## Frontend Tasks

* Add notification bell icon in header
* Show unread count
* Dropdown list of notifications
* Mark notification as read when clicked

## Message Logic

* Approved → "Your adoption request is approved. Delivery will be scheduled."
* Rejected → "Your request was rejected. Reason: {reason}"
* Reminder → "Monthly check-up is due. Please upload update."

---

# Testing Tasks

* Unit test search API (filters + keyword)
* Test notification creation triggers
* Test notification read/unread logic

---

# Refactoring (from SonarQube report)

* Fix 36 reliability issues
* Reduce duplicated logic
* Break functions with high complexity (>50)
