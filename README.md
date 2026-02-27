
# Visa Apply Website - Authentication System

This project contains a complete authentication system with a Node.js/Express backend and a Vanilla JS/HTML frontend.

## Setup Instructions

1.  **Install Dependencies**
    Open a terminal in this folder and run:
    ```bash
    npm install
    ```

2.  **Environment Variables**
    Review the `.env` file and update the following if needed:
    - `MONGO_URI`: Your MongoDB connection string.
    - `EMAIL_USER` / `EMAIL_PASS`: Your email credentials for sending OTPs.

3.  **Run the Server**
    Start the backend server:
    ```bash
    npm run dev
    ```
    The server will start on `http://localhost:5000`.

4.  **Run the Frontend**
    Open `index.html` or `login.html` in your browser (using Live Server or just opening the file).

## API Endpoints

-   `POST /api/auth/register`: Register a new user.
-   `POST /api/auth/login`: Login user.
-   `POST /api/auth/forgot-password`: specific email to receive OTP.
-   `POST /api/auth/reset-password`: Reset password using OTP.
-   `GET /api/auth/profile`: Get current user info (requires Bearer token).

## Project Structure

-   `app.js` - Main server entry point.
-   `src/models/User.js` - User database schema.
-   `src/controllers/authController.js` - logical handling of requests.
-   `src/routes/authRoutes.js` - API route definitions.
-   `src/middlewares/authMiddleware.js` - JWT protection middleware.
-   `src/utils/sendEmail.js` - Email sending utility.
-   `js/auth.js` - Frontend logic for forms.
