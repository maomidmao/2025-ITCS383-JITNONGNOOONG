# HANDOVER.md

## 1. Project Features

The JITNONGNOOONG system is a comprehensive Dog Adoption platform designed for four distinct user roles: General Thai Users, Organization Staff, Admins, and Sponsors. The features implemented in the received project include:

- **Authentication & Verification**: Secure registration and login supporting multiple roles. Users are verified against external systems (citizen system, criminal records, blacklist).
- **Dog Management**: Organization Staff can add and manage dog profiles, including general information, photos, training, and medical records.
- **Adoption Management**: Users browse available dogs, manage favorites, and submit adoption requests. Staff can review (approve/reject) these requests.
- **Delivery Scheduling**: Once approved, users can select a delivery date. Staff review and mark the delivery as confirmed and completed.
- **Check-up Management**: Facilitates post-adoption monthly follow-ups where users can upload pictures and updates.
- **Sponsor Management**: Eligible sponsors can register, upload their banners for display on the site, and make donations.
- **Reporting**: Admin users can access summary reports and view potential adopter queues.

## 2. Design Verification

### Consistencies

- **Architecture**: The client-server architectural approach (Static HTML/CSS/JS frontend communicating with a Node.js REST API backend connected to a MySQL database) perfectly aligns with the C4 Container diagram.
- **Roles and Permissions**: Role-Based Access Control (RBAC) designed in the Class Diagram is faithfully implemented using express-session middleware to guard API endpoints according to the roles.
- **Data Flow**: The six core functional processes outlined in the Data Flow Diagrams (Authentication, Dog Management, Adoption, Sponsor, Check-up, and Reporting) are all functional and map correctly to the respective API routes.

### Differences

- **Backend Component Diagram**: The original backend component diagram only highlighted a subset of the APIs (Verify, Adoption, Report, LogIn, SignIn, Dog). However, the implementation clearly separates responsibilities into additional domain-specific APIs not explicitly drawn in the component diagram, such as `checkups.js`, `sponsors.js`, `favourites.js`, and `appointments.js` (for delivery scheduling).
- **Web UI Component Diagram**: The C4 Web UI component diagram shows separate components for “Sign In” and “Log In”, but the implementation merges these into a single `/pages/login.html` page to streamline user onboarding.

## 3. Reflection

### a. Technologies used

- **Backend**: Node.js, Express.js API framework.
- **Database**: MySQL 8 using the `mysql2` package with connection pooling.
- **Authentication**: `express-session` for session tracking and access control middleware.
- **Frontend**: Vanilla HTML5, CSS3, and JavaScript without relying on modern component frameworks like React or Vue.
- **File Handling**: `multer` is utilized for managing image uploads (e.g., dog profiles, check-up pictures, sponsor banners).

### b. Required information for successful handover

- Database and Source Files
- Project Structure
- Dependencies Requirement
- Database Setup Steps
- Application Setup Steps and Command
- **Technology Version (Node.js**: version 18.x , N**pm**: version 9.x, **MySQL**: version 8.0)
- Demo Accounts and password
- Backend Setup & Run

### c. Code quality (analyzed using SonarQube)

- **Maintainability (Rating: A)**: The debt ratio is very low (total technical debt of 1 day and 1 hour), despite 123 identified code smells. However, there is logic duplication across files and one large complex function that might be hard to maintain in the long run.
- **Reliability (Rating: C)**: This is the most critical area of concern. The scan reports 36 reliability issues (bugs) which represent a significant technical debt hotspot. The estimated time to fix these is ~2 hours 41 minutes.
- **Test Coverage**: Great at 84.6%. Out of 1,519 lines of code, only 175 remain uncovered.
- **Next Steps**: Our primary maintenance focus should be refactoring the duplicate code blocks, breaking down the functions with Cyclomatic Complexity >50, and resolving the 36 reliability bugs to bring the Reliability rating up to an A.
<img width="1907" height="937" alt="image" src="https://github.com/user-attachments/assets/c868b1b9-7880-40f1-8d38-245017704d47" />
<img width="1910" height="933" alt="image" src="https://github.com/user-attachments/assets/08a493da-81dd-4767-a2cb-209f242d4fc3" />

