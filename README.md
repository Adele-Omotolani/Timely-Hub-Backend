# TimelyHub Backend

TimelyHub is a productivity app that helps users manage their time with reminders, AI chats, quizzes, file uploads, and activity tracking. This backend is built with Node.js, Express, TypeScript, and MongoDB.

## Quick Start

1. **Clone the repo** and navigate to `Timely-Hub-Backend`
2. **Install dependencies**: `npm install`
3. **Set up environment variables**: Copy `.env.example` to `.env` and fill in your values (MongoDB URI, Cloudinary keys, OpenAI key, email credentials)
4. **Run the server**: `npm run dev` (uses nodemon for auto-restart)
5. **Server runs on**: `http://localhost:5040`

The app connects to MongoDB automatically and starts a reminder scheduler that checks for due reminders every minute.

## Features & API Endpoints

All endpoints are under `/api` unless noted. Authentication uses JWT tokens (send in `Authorization: Bearer <token>` header after login/signup). Protected routes require authentication.

### Authentication & Usage Notes
- **Base URL**: `http://localhost:5040` (local) or `https://timely-hub-backend.onrender.com` (deployed)
- **Headers**: 
  - `Content-Type: application/json` for JSON bodies
  - `Authorization: Bearer <jwt_token>` for protected routes
  - `Content-Type: multipart/form-data` for file uploads
- **Error Responses**: Standard JSON `{ message: string, error?: string }` with status codes (400, 401, 404, 500)
- **Success Responses**: `{ message: string, data?: any }`

### 1. **User Authentication & Management**
Handles user registration, login, logout, and profile management. Passwords are hashed with Argon2.

- **POST /api/signUp**
  - **Description**: Create a new user account.
  - **Auth Required**: No
  - **Request Body**:
    ```json
    {
      "fullName": "John Doe",
      "email": "john@example.com",
      "password": "password123",
      "confirmPassword": "password123"
    }
    ```
  - **Response (201)**:
    ```json
    {
      "message": "User created successfully",
      "data": { "fullName": "John Doe", "email": "john@example.com", "_id": "..." }
    }
    ```

- **POST /api/loginUser**
  - **Description**: Authenticate user and return JWT token.
  - **Auth Required**: No
  - **Request Body**:
    ```json
    {
      "email": "john@example.com",
      "password": "password123"
    }
    ```
  - **Response (200)**:
    ```json
    {
      "message": "Login successful",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": { "id": "...", "fullName": "John Doe", "email": "john@example.com", "role": "myUsers" }
    }
    ```

- **POST /api/logout**
  - **Description**: Logout (client-side token removal; server returns success).
  - **Auth Required**: Yes
  - **Request Body**: None
  - **Response (200)**: `{ "message": "Logout successful" }`

- **GET /api/getAll**
  - **Description**: Retrieve all users (admin only, but currently open).
  - **Auth Required**: No (add auth for production)
  - **Response (200)**:
    ```json
    {
      "message": "Users gotten successfully",
      "data": [ { "fullName": "...", "email": "...", "_id": "..." }, ... ]
    }
    ```

- **GET /api/getOne/:id**
  - **Description**: Get user by ID.
  - **Auth Required**: No
  - **Path Param**: `id` (user MongoDB ID)
  - **Response (200)**:
    ```json
    {
      "message": "User gotten successfully",
      "data": { "fullName": "John Doe", "email": "john@example.com", "_id": "..." }
    }
    ```

- **PATCH /api/update/:id**
  - **Description**: Update user profile (name, email, password).
  - **Auth Required**: Yes
  - **Path Param**: `id` (user ID)
  - **Request Body**:
    ```json
    {
      "fullName": "Jane Doe",
      "email": "jane@example.com",
      "password": "newpass123",
      "currentPassword": "password123"
    }
    ```
  - **Response (200)**:
    ```json
    {
      "message": "User updated successfully",
      "data": { "id": "...", "fullName": "Jane Doe", "email": "jane@example.com" }
    }
    ```

- **DELETE /api/deleteOne/:id**
  - **Description**: Delete user by ID.
  - **Auth Required**: Yes (admin)
  - **Path Param**: `id` (user ID)
  - **Response (200)**: `{ "message": "User deleted successfully", "data": { ... } }`

### 2. **AI Chat**
Powered by OpenAI. Chats store message history per user.

- **POST /api/chat**
  - **Description**: Create a new chat session.
  - **Auth Required**: Yes
  - **Request Body**:
    ```json
    { "title": "My AI Chat" }
    ```
  - **Response (201)**:
    ```json
    {
      "message": "Chat created successfully",
      "data": { "title": "My AI Chat", "_id": "...", "messages": [] }
    }
    ```

- **POST /api/chat/message**
  - **Description**: Send message to chat (AI auto-responds).
  - **Auth Required**: Yes
  - **Request Body**:
    ```json
    {
      "chatId": "...",
      "content": "Hello, AI!"
    }
    ```
  - **Response (200)**: Updated chat with new messages.

- **GET /api/chat**
  - **Description**: Get all user's chats.
  - **Auth Required**: Yes
  - **Response (200)**:
    ```json
    {
      "message": "Chats retrieved",
      "data": [ { "title": "...", "_id": "...", "messageCount": 5 }, ... ]
    }
    ```

- **GET /api/chat/:chatId**
  - **Description**: Get specific chat details.
  - **Auth Required**: Yes
  - **Path Param**: `chatId`
  - **Response (200)**: Full chat object with messages.

- **DELETE /api/chat/:chatId**
  - **Description**: Delete a chat.
  - **Auth Required**: Yes
  - **Path Param**: `chatId`
  - **Response (200)**: `{ "message": "Chat deleted successfully" }`

### 3. **Quiz Generation**
Generates quizzes via OpenAI based on topic or file source.

- **POST /api/quiz**
  - **Description**: Generate quiz from topic/source.
  - **Auth Required**: Yes
  - **Request Body**:
    ```json
    {
      "source": "Python basics",
      "difficulty": "easy",
      "numQuestions": 10
    }
    ```
  - **Response (201)**: Quiz object with questions array.

- **GET /api/quiz/history**
  - **Description**: Get user's quiz history.
  - **Auth Required**: Yes
  - **Response (200)**: Array of quizzes.

- **GET /api/quiz/:id**
  - **Description**: Get specific quiz.
  - **Auth Required**: Yes
  - **Path Param**: `id` (quiz ID)
  - **Response (200)**: Full quiz details.

### 4. **File Upload**
Files uploaded to Cloudinary, associated with user.

- **POST /api/upload**
  - **Description**: Upload file(s).
  - **Auth Required**: Yes
  - **Request**: Multipart form with `files` field (one or more files)
  - **Response (200)**:
    ```json
    {
      "message": "Files uploaded successfully",
      "data": [ { "originalName": "file.txt", "url": "...", "_id": "..." }, ... ]
    }
    ```

- **GET /api/files**
  - **Description**: List user's files.
  - **Auth Required**: Yes
  - **Response (200)**: Array of file objects.

### 5. **Reminders & Notifications**
Timed reminders with email notifications via scheduler.

- **GET /api/reminders**
  - **Description**: Get user's reminders (sorted by datetime).
  - **Auth Required**: Yes
  - **Response (200)**: Array of reminders.

- **POST /api/reminders**
  - **Description**: Create reminder.
  - **Auth Required**: Yes
  - **Request Body**:
    ```json
    {
      "title": "Meeting",
      "description": "Team sync",
      "date": "2024-12-31",
      "time": "12:00"
    }
    ```
  - **Response (201)**: Created reminder.

- **PUT /api/reminders/:id**
  - **Description**: Update reminder.
  - **Auth Required**: Yes
  - **Path Param**: `id`
  - **Request Body**: Partial reminder data.

- **PUT /api/reminders/:id/seen**
  - **Description**: Mark as seen.
  - **Auth Required**: Yes
  - **Path Param**: `id`
  - **Response (200)**: Updated reminder.

- **DELETE /api/reminders/:id**
  - **Description**: Delete reminder.
  - **Auth Required**: Yes
  - **Path Param**: `id`
  - **Response (200)**: `{ "message": "Reminder deleted" }`

- **POST /api/reminders/reset** (Dev only)
  - **Description**: Add sample reminders.
  - **Auth Required**: Yes
  - **Response (200)**: Sample data added.

- **POST /api/reminders/test-email** (Dev only)
  - **Description**: Test email.
  - **Auth Required**: Yes
  - **Request Body**: `{ "email": "test@example.com" }`

- **POST /api/reminders/test-scheduler** (Dev only)
  - **Description**: Trigger scheduler manually.
  - **Auth Required**: Yes

### 6. **Activity History**
Unified view of all user activities.

- **GET /api/activities**
  - **Description**: Get sorted activity timeline (reminders, quizzes, chats, files).
  - **Auth Required**: Yes
  - **Response (200)**: Array of activities with type, title, timestamp, details.

### 7. **Health & Root**
- **GET /health**
  - **Description**: Server status check.
  - **Auth Required**: No
  - **Response (200)**: `{ "status": "OK", "timestamp": "..." }`

- **GET /** 
  - **Description**: Root info.
  - **Auth Required**: No
  - **Response (200)**: `{ "message": "Timely Hub Backend", "api": "/api", "timestamp": "..." }`

## Database Models
- **User (myUsers)**: `_id`, fullName, email, password (hashed), role (default: "myUsers"), timestamps
- **Chat**: `_id`, title, messages[] (role, content, timestamp, fileUrl), userId, timestamps
- **Quiz**: `_id`, source/topic, difficulty, numQuestions, questions[] (question, options, answer, explanation), userId, timestamps
- **File**: `_id`, originalName, mimeType, size, url, publicId, userId, createdAt
- **Reminder**: `_id`, title, datetime, userId, lastSeen, notified, timestamps

## Environment Variables (.env)
```
PORT=5040
MONGODB_URI=mongodb://localhost:27017/timelyhub
JWT_SECRET=your_super_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
OPENAI_API_KEY=sk-your_openai_key
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
NODE_ENV=development
```

## Tech Stack
- **Server**: Express.js, TypeScript
- **Database**: MongoDB (Mongoose ODM)
- **Auth**: JWT, Argon2 (hashing)
- **AI**: OpenAI GPT API
- **Storage**: Cloudinary (file uploads)
- **Email**: Nodemailer (Gmail SMTP)
- **Scheduler**: Node.js cron-like intervals
- **Dev Tools**: Nodemon, ESLint, TypeScript

## Development & Deployment
- **Scripts**:
  - `npm run dev`: Run with nodemon
  - `npm run build`: Compile TS to JS (dist/)
  - `npm start`: Run built JS
  - `npm run lint`: Lint code
- **Testing**: Use `test_all_paths.sh` script for API endpoint testing (requires bash, creates test user).
- **Deployment**: Render.com (auto-deploys on git push). Ensure env vars set in dashboard.
- **Logs**: Console output for requests/errors. Check MongoDB/Render logs for issues.

## Testing All Endpoints
Run `./test_all_paths.sh` in backend root (creates test user, tests all routes with curl). Outputs responses to console.

For contributions or issues, open a PR or issue on GitHub.
