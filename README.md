# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

---

## Connecting to PostgreSQL directly 🗄️

This application uses **Supabase** for its backend database, which is just a hosted PostgreSQL instance. The front‑end interacts with it through the Supabase JS client (see `src/integrations/supabase/client.ts`).

If you need to talk to the database *outside* of the browser (for migrations, server‑side code, or tooling), you can connect directly using a normal PostgreSQL driver.

---

## Backend API

A separate Python FastAPI service provides the actual scanning logic and geolocation lookup. During development the React app will send requests to it when the `VITE_BACKEND_URL` environment variable is defined (otherwise it defaults to `http://localhost:8000`).

To enable the frontend to call the backend, add the following to your `.env` file:

```dotenv
VITE_BACKEND_URL="http://localhost:8000"
```

Start the backend first (`uvicorn backend.main:app --reload --port 8000`) and then run the frontend (`npm run dev`).

The scanner helpers in `src/lib/scanner.ts` now forward geolocation, port scans and network discovery to the API, with local simulated fallbacks when the service is unreachable.


1. **Install a Postgres client** in your project (e.g. `pg` for Node):

   ```bash
   npm install pg   # or yarn add pg
   ```

2. **Add connection info to environment variables** (use the values from the Supabase dashboard under **Settings → Database**):

   ```env
   SUPABASE_DB_URL="postgres://postgres:password@chehmnqiuqrfyprnxbtt.db.supabase.co:5432/postgres"
   SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>" # store securely; never expose to client
   ```

3. **Example helper** (`src/lib/postgres.ts`):

   ```ts
   // src/lib/postgres.ts
   import { Pool } from 'pg';

   // connection string should include ssl options when running from outside
   const connectionString = process.env.SUPABASE_DB_URL;

   export const pgPool = new Pool({
     connectionString,
     ssl: { rejectUnauthorized: false },
   });
   ```

4. **Using the pool** in your server code:

   ```ts
   import { pgPool } from '@/lib/postgres';

   async function getScans() {
     const res = await pgPool.query('SELECT * FROM scans ORDER BY created_at DESC');
     return res.rows;
   }
   ```

   This bypasses the Supabase client and speaks directly to PostgreSQL.

> 🔐 Keep service-role credentials and raw URLs on the server. The front-end should continue using the Supabase JS client with `VITE_` env vars.

---

