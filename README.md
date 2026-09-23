# Portfolio Backend — Custom CMS + REST API

Node.js + Express 5 + MongoDB (Mongoose). Serves content to the portfolio frontend and powers the admin panel.

## Quick start

```bash
npm install
cp .env.example .env      # Windows PowerShell: Copy-Item .env.example .env
# edit .env -> set MONGODB_URI
npm run dev
```

Open http://localhost:4000/api/health — you should see `"db": "connected"`.

### Create your admin account (once)

1. Generate two JWT secrets (run twice, paste one into each variable in `.env`):
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
2. Set `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` in `.env`
3. `npm run create-admin`
4. Delete the `ADMIN_PASSWORD` line from `.env`

Forgot your password? Put a new one in `ADMIN_PASSWORD` and run `npm run reset-admin`.

## Auth API

| Method | Route                       | Auth         | Description                                |
| ------ | --------------------------- | ------------ | ------------------------------------------ |
| POST   | `/api/auth/login`           | public       | Returns `accessToken` + sets refresh cookie |
| POST   | `/api/auth/refresh`         | cookie       | New access token when the old one expires  |
| POST   | `/api/auth/logout`          | cookie       | Ends all sessions, clears cookie           |
| GET    | `/api/auth/me`              | Bearer token | Current admin                              |
| PUT    | `/api/auth/change-password` | Bearer token | Logs out other sessions                    |

Protect any route with `protect` (and optionally `authorize('admin')`) from `src/middleware/auth.js`.

## Folder structure

```
src/
  config/        env loading + validation, DB connection
  controllers/   request handlers (thin: read req, call service, send res)
  middleware/    error handler, 404, (Day 2) auth guard
  models/        Mongoose schemas (Day 3)
  routes/        Express routers, all mounted under /api
  services/      business logic / DB queries (Day 3+)
  utils/         ApiError, asyncHandler, helpers
  validators/    request body validation (Day 3+)
  app.js         Express app: security, CORS, parsers, routes
  server.js      connects DB, starts server, graceful shutdown
scripts/         one-off scripts (create-admin)
uploads/         local file storage (Day 4)
requests.http    API requests for the VS Code REST Client extension
```

## Scripts

| Command       | What it does                     |
| ------------- | -------------------------------- |
| `npm run dev` | Start with auto-reload (nodemon) |
| `npm start`   | Start for production             |
| `npm run create-admin` | Create the first admin user |
| `npm run reset-admin`  | Reset the admin password    |

## Error response format

```json
{ "success": false, "message": "Validation failed", "details": [{ "field": "title", "message": "..." }] }
```
