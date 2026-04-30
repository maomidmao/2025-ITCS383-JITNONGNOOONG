# D3: Change Request Analysis

##  Corrective (Bug Fixes)

### CR-01: Notification badge shows wrong number

| Attribute | Description |
| --- | --- |
| **Associated Feature** | Notification System |
| **Description** | The bell icon badge shows "0" even when there are unread notifications |
| **Maintenance Type** | Corrective |
| **Priority** | High |
| **Severity** | Major |
| **Time to implement** | <1 hour |
| **Verification Method** | Test: check that the badge number matches the real count of unread messages |

**Conclusion**: The code was counting all notifications, not just the unread ones so we fix by filter only `is_read = false` before counting.

---

### CR-02: Search crashes when limit value is a decimal

| Attribute | Description |
| --- | --- |
| **Associated Feature** | Search Dog Feature |
| **Description** | Calling `/api/dogs/search?limit=10.5` causes a 500 server error |
| **Maintenance Type** | Corrective |
| **Priority** | Medium |
| **Severity** | Major |
| **Time to implement** | <1 hour |
| **Verification Method** | Test: send `limit=10.5` and expect a 400 error with a clear message, not a 500 crash |

**Conclusion**: The code only checked if the value was a number, not whether it was a whole number. therefore we Added a check to reject non-integer values before they reach the database.

---

##  Adaptive (New Requirements)

### CR-03: Auto-send notification when adoption is approved or rejected

| Attribute | Description |
| --- | --- |
| **Associated Feature** | Notification System |
| **Description** | Users had to manually check their adoption status, no automatic notification was sent |
| **Maintenance Type** | Adaptive |
| **Priority** | High |
| **Severity** | Minor |
| **Time to implement** | <1 hour |
| **Verification Method** | Test: approve/reject an adoption → check that a notification appears in the user's notification list |

**Conclusion:** When staff approves or rejects an adoption request, the system now automatically creates a notification for the adopter.

---

### CR-04: Search response format updated for mobile app

| Attribute | Description |
| --- | --- |
| **Associated Feature** | Search Dog Feature |
| **Description** | The new Android mobile app needed a specific response format that the old `/api/dogs` endpoint did not support |
| **Maintenance Type** | Adaptive |
| **Priority** | High |
| **Severity** | Minor |
| **Time to implement** | <1 hour |
| **Verification Method** | Review: confirm that the response includes `{ success, data: { dogs[], pagination: { total, limit, offset, hasMore } }, message }` |

**Conclusion**: A new `/api/dogs/search` endpoint was created with a standardised response format so both the web and mobile app can use it.

---

##  Perfective (Improvements)

### CR-05: Speed up dog search with a database index

| Attribute | Description |
| --- | --- |
| **Associated Feature** | Search Dog Feature |
| **Description** | As the number of dogs grows, search queries slow down because the database checks every row |
| **Maintenance Type** | Perfective |
| **Priority** | Medium |
| **Severity** | Minor |
| **Time to implement** | <1 hour |
| **Verification Method** | Review: run `EXPLAIN SELECT` before and after, confirm fewer rows are scanned |

**Conclusion**: Added a database index on the most-used filter columns (`DogStatus`, `breed`, `color`) to make searches faster.

---

### CR-06: Notification dropdown looks better and easier to use

| Attribute | Description |
| --- | --- |
| **Associated Feature** | Notification System |
| **Description** | The notification dropdown only showed plain text, it was hard to tell what type of notification it was |
| **Maintenance Type** | Perfective |
| **Priority** | Low |
| **Severity** | Minor |
| **Time to implement** | <2 hour |
| **Verification Method** | Review: check that approved = green, rejected = red, reminder = yellow; "Mark all as read" button works |

**Conclusion**:**:** Added colour-coded styles for each notification type and a "Mark all as read" button.

---

##  Preventive (Prevent Future Problems)

### CR-07: Stop duplicate reminder notifications

| Attribute | Description |
| --- | --- |
| **Associated Feature** | Notification System |
| **Description** | Every time a user logs in, the system checks for overdue check-ups and creates a reminder, users who log in daily would get the same reminder message dozens of times |
| **Maintenance Type** | Preventive |
| **Priority** | High |
| **Severity** | Major |
| **Time to implement** | <1 hours |
| **Verification Method** | Test: log in twice within 20 days with the same overdue check-up → only 1 reminder should exist in the database |

**Conclusion:** Before inserting a reminder, the system now checks if the same reminder was already sent within the past 20 days. If yes, it skips.

---

### CR-08: Prevent search input from causing unexpected results

| Attribute | Description |
| --- | --- |
| **Associated Feature** | Search Dog Feature |
| **Description** | If a user types `%` as a keyword, it matches every dog in the database, this is a potential misuse of the search feature |
| **Maintenance Type** | Preventive |
| **Priority** | Medium |
| **Severity** | Minor |
| **Time to implement** | <1 hour |
| **Verification Method** | Test: search with `%` as keyword → confirm it does not match all records |

**Conclusion**: Added an escape function that neutralises special SQL wildcard characters (`%`, `_`) in the keyword before running the search query.

---

## All 8 Change Requests at a Glance

| ID | Feature | Short Description | Type | Priority | Severity | Time |
| --- | --- | --- | --- | --- | --- | --- |
| CR-01 | Notification | Badge shows wrong unread count | Corrective | High | Major | <1 hrs |
| CR-02 | Search Dog | 500 error on decimal limit value | Corrective | Medium | Major | <1 hrs |
| CR-03 | Notification | Auto-notify on adoption decision | Adaptive | High | Minor |  <1 hrs |
| CR-04 | Search Dog | Standardised response for mobile | Adaptive | High | Minor | <1 hrs |
| CR-05 | Search Dog | Database index for faster search | Perfective | Medium | Minor | <1 hr |
| CR-06 | Notification | Colour-coded dropdown + mark all read | Perfective | Low | Minor | <2 hrs |
| CR-07 | Notification | No duplicate reminders on login | Preventive | High | Major | <1 hrs |
| CR-08 | Search Dog | Escape wildcard characters in keyword | Preventive | Medium | Minor | <1 hr |

**Total Estimated Time: ~9 hours**
