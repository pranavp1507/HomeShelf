# Library Management App Plan

## Overview
This document outlines the development plan for a full-stack Library Management application. The application will allow users to manage books, members, and book loans. The development will be structured into sprints, with each sprint focusing on a set of related features.

## Technology Stack
*   **Frontend:** React (TypeScript) with Vite
*   **Backend:** Node.js with Express.js
*   **Database:** PostgreSQL
*   **Containerization:** Docker & Docker Compose
*   **Styling:** Material-UI (MUI)

## Sprints

### Sprint 1: Project Setup & Core Backend (Planned)

**Goal:** Establish the foundational project structure and a basic backend API for book management, integrated with a PostgreSQL database via Docker.

**Tasks:**
1.  **Project Initialization:**
    *   Create a monorepo structure with `client/` and `server/` directories.
    *   Initialize `server/` as a Node.js project.
    *   Initialize `client/` as a React (TypeScript) project using Vite.
2.  **Docker Setup:**
    *   Create `docker-compose.yml` to orchestrate PostgreSQL, the Node.js backend, and the React frontend.
    *   Define `Dockerfile` for the Node.js backend.
    *   Define `Dockerfile` for the React frontend.
3.  **Database Setup (PostgreSQL):**
    *   Configure PostgreSQL service in `docker-compose.yml`.
    *   Create initial database schema for the `books` table (e.g., `id`, `title`, `author`, `isbn`, `available`).
4.  **Backend API (Node.js/Express):**
    *   Set up Express.js server.
    *   Implement basic API endpoints for `books`:
        *   `GET /api/books`: Retrieve all books.
        *   `POST /api/books`: Add a new book.

### Sprint 2: Book Management UI (Planned)

**Goal:** Develop the frontend user interface for managing books, including listing, adding, editing, and deleting functionalities.

**Tasks:**
1.  **React Frontend Setup:**
    *   Configure React project for routing (e.g., React Router).
    *   Integrate Material-UI (MUI) for styling.
2.  **Book Listing Component:**
    *   Create a component to display a list of all books, fetching data from `/api/books`.
    *   Implement a responsive table/card layout for displaying book details.
3.  **Add/Edit Book Form:**
    *   Develop a form component for adding new books.
    *   Extend the form for editing existing book details.
    *   Handle form submissions to interact with `POST /api/books` and `PUT /api/books` (to be implemented in backend).
4.  **Delete Book Functionality:**
    *   Add a button/icon to each book item for deletion.
    *   Implement logic to call `DELETE /api/books/:id` (to be implemented in backend).
5.  **Backend Enhancements (for Sprint 2):**
    *   Implement `PUT /api/books/:id`: Update an existing book.
    *   Implement `DELETE /api/books/:id`: Delete a book.

### Sprint 3: Member & Loan Management (Planned)

**Goal:** Introduce functionalities for managing library members and handling the borrowing and returning of books.

**Tasks:**
1.  **Database Schema Extension:**
    *   Add `members` table (`id`, `name`, `email`, `phone`).
    *   Add `loans` table (`id`, `book_id`, `member_id`, `borrow_date`, `return_date`).
2.  **Backend API (Members):**
    *   Implement API endpoints for `members`:
        *   `GET /api/members`: Retrieve all members.
        *   `GET /api/members/:id`: Retrieve a single member.
        *   `POST /api/members`: Add a new member.
        *   `PUT /api/members/:id`: Update a member.
        *   `DELETE /api/members/:id`: Delete a member.
3.  **Backend API (Loans):**
    *   Implement API endpoints for `loans`:
        *   `POST /api/loans/borrow`: Record a book borrowing.
        *   `POST /api/loans/return`: Record a book return.
        *   Update `books` table (`available` status) during borrow/return operations.
4.  **Frontend UI (Members):**
    *   Create components for listing, adding, editing, and deleting members.
5.  **Frontend UI (Loans):**
    *   Develop an interface to facilitate borrowing and returning books, linking members to books.

### Sprint 4: Search, Polish and Finalize (Planned)

**Goal:** Enhance usability with search functionality, refine the user experience, and ensure application stability.

**Tasks:**
1.  **Search Functionality:**
    *   Implement a search bar in the frontend for books (by title, author, ISBN).
    *   Enhance backend `GET /api/books` to support query parameters for search.
2.  **User Feedback & Error Handling:**
    *   Implement toast notifications or similar for success/error messages.
    *   Add robust error handling for API calls.
3.  **UI/UX Enhancements:**
    *   Review and improve navigation, layout, and overall visual appeal.
    *   Ensure responsiveness across various devices.
4.  **Testing:**
    *   Conduct manual testing across all features.
    *   (Optional) Add unit/integration tests for critical backend logic.

---
This plan is subject to change based on feedback and discoveries during development.
