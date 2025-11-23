# Mulampuzha Library Management App

This project is a full-stack Library Management application built with the help of the Gemini CLI.

## Current Status

The application is fully functional and operational, with all initially planned features and recent enhancements successfully implemented. It includes:

### Core Functionality:
- **Book Management:** Add, view, edit, delete books. Search books by title, author, or ISBN.
- **Member Management:** Add, view, edit, delete library members.
- **Loan Management:** Borrow and return books, with automatic tracking of availability and due dates.
- **Loan History:** View a detailed history of all loans, including book, member, borrow date, due date, and return date.
- **Dashboard:** An overview page displaying key statistics (total books, members, active loans, overdue loans) and a pie chart for book availability.
- **CSV Bulk Import:** Import multiple books at once using a CSV file, with template download and validation.

### Technical Foundation:
- **Robust Backend:** Node.js (Express.js) APIs with PostgreSQL database.
- **Modern Frontend:** React (TypeScript) with Vite and Material-UI (MUI).
- **Containerized Deployment:** Podman & Podman Compose for all services.
- **Schema Management:** Dedicated `node-pg-migrate` for database migrations.
- **User Feedback:** Global toast notifications for all operations.
- **CORS Support:** Seamless frontend-backend communication.

## Tech Stack

- **Frontend:** React (TypeScript) with Vite
- **Backend:** Node.js with Express.js
- **Database:** PostgreSQL
- **Containerization:** Podman & Podman Compose
- **Styling:** Material-UI (MUI v5+)
- **Database Migrations:** `node-pg-migrate`
- **CSV Handling (Backend):** `multer`, `@csv-parse/sync`
- **Charting (Frontend):** `recharts`

## Future Enhancements (Roadmap)

All previously outlined future enhancements have been successfully implemented. The application is now feature-complete according to the defined roadmap.
