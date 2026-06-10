# Aether Capital — Backend

Node.js + Express + MongoDB + Google Drive backend for the onboarding form.

---

## Stack
- **Express.js** — API server
- **MongoDB + Mongoose** — data storage
- **Google Drive API** — file & image storage (via OAuth2)
- **Multer** — file upload handling (memory storage → buffer → Drive)

---

## Project Structure

```
backend/
├── app.js                  # Express app setup, routes, middleware
├── server.js               # Entry point — connects DB then starts server
├── .env.example            # Copy to .env and fill in your values
└── src/
    ├── config/
    │   ├── db.js                   # MongoDB connection
    │   └── googleDrive.config.js  # OAuth2 client + Drive instance
    ├── controllers/
    │   ├── onboarding.controller.js  # All 6 steps + submit
    │   ├── upload.controller.js      # Standalone upload endpoints
    │   └── form.controller.js        # Contact form
    ├── middleware/
    │   ├── multer.middleware.js    # File parsing (memory storage)
    │   ├── error.middleware.js     # Global error handler
    │   └── validate.middleware.js  # express-validator runner
    ├── models/
    │   ├── onboarding.model.js     # All onboarding data schema
    │   └── form.model.js           # Contact form schema
    ├── routes/
    │   ├── onboarding.routes.js
    │   ├── upload.routes.js
    │   └── form.routes.js
    ├── services/
    │   └── googledrive.service.js  # uploadFileToDrive, deleteFileFromDrive
    └── utils/
        ├── ApiError.js
        ├── ApiResponse.js
        └── asyncHandler.js
```

---

## Setup (Step by Step)

### 1. Install dependencies
```bash
npm install
```

### 2. Create `.env`
```bash
cp .env.example .env
```
Fill in your values (MongoDB URI, Google credentials).

### 3. MongoDB Setup
- Create a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
- Create a database user
- Whitelist your IP
- Copy the connection string into `MONGODB_URI`

### 4. Google Drive Setup (One-time)

#### a) Create a Google Cloud Project
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create new project → name it "Aether Capital"
3. Go to **APIs & Services → Enable APIs**
4. Search and enable **Google Drive API**

#### b) Create OAuth2 Credentials
1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth client ID**
3. Application type: **Web application**
4. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
5. Copy **Client ID** and **Client Secret** into `.env`

#### c) Create OAuth Consent Screen
1. Go to **OAuth consent screen**
2. User type: **External**
3. Fill in app name, your email
4. Add scope: `https://www.googleapis.com/auth/drive.file`
5. Add your Gmail as a test user

#### d) Get Refresh Token (run once)
1. Start the server: `npm run dev`
2. Open browser: `http://localhost:5000/api/auth/google`
3. Authorize with your Google account
4. Copy the refresh token from the page → paste into `.env` as `GOOGLE_REFRESH_TOKEN`

#### e) Create Drive Folder
1. Go to [drive.google.com](https://drive.google.com)
2. Create a folder named "Aether Capital Uploads"
3. Right-click → Share → copy the folder ID from the URL
   - URL looks like: `https://drive.google.com/drive/folders/1ABC...xyz`
   - The ID is: `1ABC...xyz`
4. Paste it as `GOOGLE_DRIVE_FOLDER_ID` in `.env`

### 5. Run the server
```bash
npm run dev      # development (nodemon)
npm start        # production
```

---

## API Endpoints

### Onboarding
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/onboarding/start` | Start session (Step 1) |
| PUT | `/api/onboarding/:id/step2` | Personal/business info + image |
| PUT | `/api/onboarding/:id/step3` | Address |
| PUT | `/api/onboarding/:id/step4` | Roles & departments |
| PUT | `/api/onboarding/:id/step5` | Compliance + document uploads |
| PUT | `/api/onboarding/:id/step6` | Signature + final submit |
| GET | `/api/onboarding/:id` | Get single record |
| GET | `/api/onboarding` | Get all (admin) |

### Upload (standalone)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/image` | Single image → Drive |
| POST | `/api/upload/document` | Single doc → Drive |
| POST | `/api/upload/documents` | Multiple docs → Drive |
| DELETE | `/api/upload/:fileId` | Delete from Drive |

### Form
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/form/submit` | Submit contact form |
| GET | `/api/form` | Get all submissions (admin) |

---

## Frontend Integration

1. Copy `FRONTEND_api.service.js` into your frontend as `src/services/api.service.js`
2. Add to your frontend `.env`:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```
3. For production, change it to your deployed backend URL (Railway/Render/etc.)

### Example usage in a component:
```js
import { startOnboarding, saveStep2 } from "../services/api.service";

// Step 1
const { data: session } = await startOnboarding("individual");
localStorage.setItem("onboarding_id", session._id);

// Step 2 with image
const file = imageInputRef.current.files[0];
await saveStep2(session._id, { firstName: "Nova", email: "nova@example.com" }, file);
```

---

## Deploying to Railway (Recommended)
1. Push backend to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add all `.env` variables in Railway dashboard
4. Railway gives you a URL → update `VITE_API_URL` in your Netlify frontend env

---

## File Upload Flow

```
User selects file
    ↓
Multer (memoryStorage) — reads file into buffer, never touches disk
    ↓
googledrive.service.js — converts buffer to stream, uploads to Drive
    ↓
Drive returns fileId + webViewLink + directUrl
    ↓
directUrl saved in MongoDB (use in <img src="..."> on frontend)
```