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

## Content API

`GET` routes are public (visitors only see `published` projects/blogs). Everything else needs the Bearer token.

| Route               | Methods                                   |
| ------------------- | ----------------------------------------- |
| `/api/about`        | GET, PUT (single document)                |
| `/api/skills`       | GET, POST, PUT `/:id`, DELETE `/:id`, PUT `/reorder` |
| `/api/projects`     | same as skills, plus GET `/:slug`         |
| `/api/blogs`        | GET, POST, PUT `/:id`, DELETE `/:id`, GET `/:slug` |
| `/api/experience`   | GET, POST, PUT `/:id`, DELETE `/:id`      |
| `/api/testimonials` | same as skills                            |
| `/api/services`     | same as skills                            |
| `/api/stats`        | GET (admin dashboard counts)              |

List routes support `?page=&limit=&q=&sort=` plus per-type filters (see each file in `src/routes`).

## Uploads & media library

Files are stored in `uploads/` and served at `/uploads/<filename>`. Every upload is also saved in the
`media` collection so the admin panel can browse and reuse it.

| Method | Route                   | Body (multipart/form-data)       | Limits                        |
| ------ | ----------------------- | -------------------------------- | ----------------------------- |
| POST   | `/api/upload/image`     | `file`, optional `alt`           | jpg, png, webp, gif, avif · 5 MB |
| POST   | `/api/upload/document`  | `file`                           | pdf · 10 MB                   |
| GET    | `/api/media`            | `?kind=image\|document&q=&page=` |                               |
| PUT    | `/api/media/:id`        | `{ "alt": "..." }`               |                               |
| DELETE | `/api/media/:id`        | deletes the file too             |                               |

Uploads are checked twice: extension + mime type, then the file's first bytes, so a renamed
`.exe` can't pass as a `.png`. SVG is not allowed because it can contain scripts.

> Render/Railway disks are wiped on every deploy. Before Day 12, either attach a persistent disk
> or swap `src/middleware/upload.js` to a cloud store (Cloudinary / S3).

## Admin panel (`admin/`)

React 19 + Vite + Tailwind CSS 4. Login, dashboard, CRUD screens for every content type, a media
library, and password change.

```bash
npm run admin:install   # once
npm run dev             # terminal 1: API on :4000
npm run admin:dev       # terminal 2: admin on http://localhost:5173
```

In development Vite proxies `/api` and `/uploads` to `:4000`, so no CORS setup is needed.
For production set `VITE_API_URL` (see `admin/.env.example`) and add the admin's URL to `CLIENT_URLS`.

Content types are described once in `admin/src/resources.jsx` (fields, list columns, filters). The list
page and edit form are generic, so adding a field is usually a one-line change there.

## Folder structure

```
src/
  config/        env loading + validation, DB connection, upload settings
  controllers/   request handlers (thin: read req, call service, send res)
  middleware/    auth guard, validation, uploads, error handler, 404
  models/        Mongoose schemas
  routes/        Express routers, all mounted under /api
  services/      business logic (auth)
  utils/         ApiError, asyncHandler, query parsing, helpers
  validators/    request body validation (zod)
  app.js         Express app: security, CORS, parsers, routes
  server.js      connects DB, starts server, graceful shutdown
admin/           admin panel (React + Vite)
  src/resources.jsx   field config for every content type
  src/pages/          dashboard, generic list/edit pages, about, media, settings
  src/components/     UI kit, form fields, media picker, layout
  src/lib/api.js      fetch wrapper with automatic token refresh
scripts/         one-off scripts (create-admin, seed)
uploads/         local file storage
requests.http    API requests for the VS Code REST Client extension
```

## Scripts

| Command       | What it does                     |
| ------------- | -------------------------------- |
| `npm run dev` | Start with auto-reload (nodemon) |
| `npm start`   | Start for production             |
| `npm run create-admin` | Create the first admin user |
| `npm run reset-admin`  | Reset the admin password    |
| `npm run seed`         | Add sample content (empty collections only) |
| `npm run admin:dev`    | Start the admin panel       |
| `npm run admin:build`  | Build the admin panel to `admin/dist` |

## Error response format

```json
{ "success": false, "message": "Validation failed", "details": [{ "field": "title", "message": "..." }] }
```
