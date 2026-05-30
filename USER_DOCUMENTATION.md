# Google Forms Clone — User Documentation

This document guides end users and administrators through using the Google Forms Clone application: creating forms, managing employees, collecting responses, and working with uploads.

## Contents

- Introduction
- User roles overview
- Installation & access
- Admin workflows
  - Creating a new form
  - Managing employees
  - Viewing responses
- Employee workflows
  - Responding to assigned forms
  - Viewing assigned tasks
- Customer workflows
  - Filling public forms
- File uploads
- Notifications & emails
- Troubleshooting & FAQ

---

## Introduction

The Google Forms Clone is a web application that lets organizations build custom forms, assign respondents (employees or customers), collect responses, and store attachments. It supports role-based access: Admin, Employee, Customer.

## User roles overview

- Admin: Full access. Can create/edit/delete forms, manage employees, view all responses, and configure notifications.
- Employee: Can view assigned forms, submit responses on behalf of customers (if permitted), and view permitted responses.
- Customer: Can view and fill public forms, have limited access to their own responses on the dashboard, and receive email confirmations and copy of responses after submitting a form.

## Installation & access

If you are an end user (not installing locally), skip to "Accessing the App".

### Installing locally (admin/developer)

1. Clone the repo and install dependencies:

```bash
git clone <repository-url>
cd google-forms
npm install
```

2. Create environment file `.env` with required variables:

```env
MONGODB_URI=mongodb://localhost:27017/company_forms
JWT_SECRET=your_jwt_secret_key
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GMAIL_REFRESH_TOKEN=your_gmail_refresh_token
GMAIL_USER=your_gmail_user
ADMIN_EMAIL=your_admin_email
```

3. Start development server:

```bash
npm run dev
```

4. Open the app at `http://localhost:3000`.

### Accessing the App (end users)

- Admins: Go to `/admin/dashboard` after login.
- Employees: Go to `/employee/dashboard` after login.
- Customers: Access public forms via `/forms/[id]` or through links.

## Admin workflows

### Creating a new form

1. Navigate to `Admin → Forms → New`.
2. Enter a form title and optional description.
3. Add questions using the Form Builder. Supported field types:
   - Text (single-line)
   - Multiple Choice
   - Checkbox
   - Dropdown
   - File Upload
   - Integer
4. Configure which employees are allowed to respond (optional).
5. Save and publish the form.

### editing an existing form

1. Navigate to `Admin → Forms`.
2. Click on the form you want to edit.
3. Make the necessary changes.
4. Save the form.

### Managing employees

- Navigate to `Admin → Employees`.
- Add a new employee with an email and password.

### Viewing responses

- Navigate to `Admin → Forms → [Form] → Responses`.
- View response details, including submitted answers and attached files.

## Employee workflows

### Viewing tasks

- Employees will see a list of assigned forms and response statuses on their dashboard.

## Customer workflows

- Customers open public forms, fill out the form, attach files (if required), and submit.

## File uploads

- Uploaded files are stored in `public/uploads/`.
- Admins and assigned employees can download uploaded files from the response details page.
- Supported file types are restricted by server-side validation (see admin settings).

## Notifications & emails

- On specific event form submission, email notifications are sent via Nodemailer and the configured Gmail account to admin and full response recipients to customer.

## Troubleshooting & FAQ

Q: I see a Turbopack panic when starting development.
A: Delete the `.next` folder and restart the dev server: `rm -rf .next && npm run dev` (Windows: `rmdir /s /q .next`).

Q: How do I change SMTP credentials?
A: Update `EMAIL_USER` and `EMAIL_PASS` in your `.env` file and restart the server.

Q: How to change database connection?
A: Update `MONGODB_URI` in `.env`.

---