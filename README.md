# Google Forms Clone (Custom Form Builder)

A full-stack, real-time application for creating, managing, and filling out custom online forms, inspired by Google Forms. This project features role-based access control,a form builder, live response tracking, file uploads, and email notifications.

## 🚀 Features

- **Role-Based Access Control**: Separate dashboards for Admins, Employees, and Customers.
- **Dynamic Form Builder**: Create forms with various input types (text, multiple choice, file uploads, integer fields,     Dropdown, checkbox).
- **Real-Time Updates**: Instant form response syncing across clients using Socket.io.
- **File Uploads**: Easily upload and manage file attachments for form submissions.
- **Authentication**: Secure JWT-based authentication system.
- **Email Notifications**: Automated email alerts for form submissions or registration events via Nodemailer.
- **Google API Integration**: Connectivity to Google services using `googleapis`.

## 🛠️ Tech Stack

- **Framework**: [Next.js (App Router)](https://nextjs.org/)
- **Frontend**: React, CSS Modules / Globals, Lucide React (Icons)
- **Backend**: Node.js custom server (Express/Next API Routes)
- **Database**: MongoDB with [Mongoose](https://mongoosejs.com/)
- **Real-time Engine**: [Socket.io](https://socket.io/)
- **Authentication**: JWT (JSON Web Tokens), bcryptjs, jose
- **Mailing**: Nodemailer

## 📁 Project Structure

```text
src/
├── app/             # Next.js App Router (Pages & API routes)
│   ├── admin/       # Admin dashboards and form management
│   ├── api/         # Backend API endpoints (auth, forms, uploads, admin, customer.)
│   ├── customer/    # Customer dashboard
│   ├── employee/    # Employee dashboard and response handling
│   └── forms/       # Public/Shared form viewing interfaces
├── components/      # Reusable UI components (e.g., FormBuilder, Header)
├── lib/             # Utility and config files (auth, db connection, email, socket)
└── models/          # Mongoose database schemas (Form, Response, User)
public/uploads/      # Directory for user-uploaded files
server.js            # Custom Node.js server entry point (for Next.js + Socket.io integration)
```

## ⚙️ Prerequisites

- **Node.js** (v18+ recommended)
- **MongoDB** (Local or Atlas)
- **npm** or **yarn**

## 🔧 Installation & Setup

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd google-forms
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.local.env` or `.env` file in the root directory and add the necessary variables:
   ```env
   MONGODB_URI=mongodb://localhost:27017/google-forms
   JWT_SECRET=your_super_secret_jwt_key
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_app_password
   # Add any required Google API keys here
   ```

4. **Run the Application**:
   This project uses a custom server (`server.js`) to handle Next.js and Socket.io simultaneously.
   ```bash
   npm run dev
   ```

5. **Open the App**:
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Scripts

- `npm run dev` - Starts the development server using the custom `node server.js`
- `npm run build` - Builds the application for production (`next build`)
- `npm start` - Starts the production server using `node server.js`
- `npm run lint` - Runs ESLint to check for code issues
