# Mulampuzha Library App - Improvement Implementation Plan

This document outlines a phased, sprint-based implementation plan for the identified future enhancements, focusing on logical grouping and checkpoints.

## Phase 1: Authentication & Core Data Enhancements

**Goal:** Secure the application with user authentication and lay the groundwork for richer book metadata.

### Sprint 1.1: User Authentication (Simple Username/Password)

-   **Objective:** Implement a basic username/password authentication system.
-   **Tasks:**
    -   **Backend:**
        -   Add `users` table to the database (`id`, `username`, `password_hash`, `role`).
        -   Implement user registration/creation endpoint (admin-only initially).
        -   Implement user login endpoint, returning a JWT or session token.
        -   Add middleware to protect relevant API endpoints, requiring authentication.
        -   Hash passwords securely (e.g., using `bcrypt`).
    -   **Frontend:**
        -   Create Login/Logout components/pages.
        -   Integrate authentication state (e.g., using React Context).
        -   Display user-specific UI elements (e.g., welcome message, logout button).
        -   Redirect unauthenticated users to the login page.
-   **Checkpoint:** Users can register (if allowed) and log in/out. Protected API endpoints are inaccessible without a valid token.

### Sprint 1.2: Book Covers & Local Storage

-   **Objective:** Allow users to upload book cover images and store them locally.
-   **Tasks:**
    -   **Backend:**
        -   Add `cover_image_path` column to the `books` table.
        -   Implement file upload endpoint (`POST /api/books/:id/cover`) using `multer` to save images to a local directory (e.g., `/app/uploads`).
        -   Implement serving of static files from the local storage directory.
        -   Update book update endpoint to handle `cover_image_path`.
    -   **Frontend:**
        -   Modify `BookForm` to include a file input for cover upload.
        -   Display book cover images in `BookList` and book details.
        -   Ensure `server` container has a persistent volume for `/app/uploads`.
-   **Checkpoint:** Users can upload cover images for books, and images are displayed correctly.

### Sprint 1.3: Book Categories/Tags

-   **Objective:** Implement a system for categorizing and tagging books.
-   **Tasks:**
    -   **Backend:**
        -   Add `categories` table (`id`, `name`).
        -   Create a `book_categories` junction table (`book_id`, `category_id`) for many-to-many relationship.
        -   Implement CRUD endpoints for categories.
        -   Modify book creation/update endpoints to associate categories.
    -   **Frontend:**
        -   Create `CategoryManagement` component (admin-only).
        -   Modify `BookForm` to allow selecting/assigning categories (e.g., using Material-UI `Autocomplete` or `Select` with multiple selection).
        -   Display categories in `BookList`.
-   **Checkpoint:** Books can be assigned to categories, and categories can be managed.

## Phase 2: Enhanced User Experience & Automation

**Goal:** Improve data discoverability, automate notifications, and enhance deployment security.

### Sprint 2.1: Advanced Search & Filtering

-   **Objective:** Provide more powerful tools for finding books and members.
-   **Tasks:**
    -   **Backend:**
        -   Enhance `GET /api/books` and `GET /api/members` to accept more filtering parameters (e.g., `availableStatus`, `categoryIds`).
        -   Implement API endpoints for sortable table columns.
    -   **Frontend:**
        -   Modify `BookList` and `MemberList` to include additional filter controls (e.g., Material-UI `Select`, `Checkbox`).
        -   Implement sortable columns in `BookList` and `MemberList` tables.
-   **Checkpoint:** Users can effectively filter and sort book and member lists.

### Sprint 2.2: Automated Overdue Reminders

-   **Objective:** Implement a system to notify about overdue books.
-   **Tasks:**
    -   **Backend:**
        -   Implement a cron job scheduler (e.g., `node-cron`) within the server.
        -   Develop a function to identify overdue loans and potentially mark them in the database or generate a report.
        -   (Optional, but recommended) Create a simple notification mechanism (e.g., pushing a status update to the Dashboard or a dedicated "Notifications" page).
    -   **Frontend:**
        -   Display overdue alerts prominently on the Dashboard.
        -   (If implemented) Create a dedicated "Notifications" view.
-   **Checkpoint:** Overdue books are identified automatically, and users are alerted.

### Sprint 2.3: Responsive Navigation & Dashboard Interactivity

-   **Objective:** Improve the mobile user experience and make the Dashboard more actionable.
-   **Tasks:**
    -   **Frontend:**
        -   Implement a responsive drawer/sidebar navigation for smaller screens, replacing the current AppBar buttons.
        -   Make Dashboard cards/chart segments clickable, linking them to filtered views of relevant lists (e.g., clicking "Overdue Loans" navigates to a filtered "Loan History" page).
-   **Checkpoint:** Application is highly usable on mobile devices, and the Dashboard provides direct navigation to relevant data.

## Phase 3: Robust Deployment & Maintenance

**Goal:** Ensure the application is securely deployed and data is protected.

### Sprint 3.1: Traefik Reverse Proxy & HTTPS

-   **Objective:** Implement Traefik for secure external access and automated HTTPS.
-   **Tasks:**
    -   Configure Traefik service in `compose.yml`.
    -   Configure Traefik dynamic configuration (e.g., via labels) for the `client` and `server` services.
    -   Obtain/manage SSL certificates (e.g., Let's Encrypt for public access, self-signed for internal-only HTTPS).
    -   Ensure Traefik correctly routes traffic to the backend API and serves the frontend.
-   **Checkpoint:** Application is accessible via Traefik, and HTTPS is enforced.

### Sprint 3.2: Automated Database Backups

-   **Objective:** Implement a reliable system for regular database backups.
-   **Tasks:**
    -   Create a backup script using `pg_dump`.
    -   Integrate the script into a cron job or a dedicated container service in `compose.yml` to run periodically.
    -   Define a persistent volume for storing backup files.
-   **Checkpoint:** Database backups are automatically created and stored securely.

---
This phased plan provides a structured approach to enhance the Mulampuzha Library application based on your requirements. Each sprint delivers tangible improvements and builds upon previous work.
