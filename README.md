# Flashcards

A web flashcard app with a Java/Spring Boot API, MySQL, and a React frontend. Create decks, study with flip / quiz / write modes, and let SM-2 spaced repetition schedule reviews.

## Prerequisites

- Java 21 (this machine has `C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot`; open a new terminal if `java` is not on PATH)
- Node.js 20+
- MySQL 8, or Docker to run the bundled `docker-compose.yml`

## Run MySQL

With Docker:

```bash
docker compose up -d
```

Without Docker, create a MySQL 8 database and user:

```sql
CREATE DATABASE flashcards;
CREATE USER 'flashcards'@'localhost' IDENTIFIED BY 'flashcards';
GRANT ALL PRIVILEGES ON flashcards.* TO 'flashcards'@'localhost';
FLUSH PRIVILEGES;
```

The API expects `localhost:3306`, database `flashcards`, user `flashcards`, password `flashcards`. Override with standard Spring datasource environment variables if needed.

## Run the API

```bash
cd backend
.\mvnw.cmd spring-boot:run
```

Flyway creates tables on startup. The API listens on [http://localhost:8080](http://localhost:8080).

## Run the web app

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Vite proxies `/api` to the backend.

## Google sign-in (localhost)

Personal Gmail works. You do not need a Workspace account or a custom domain. Keep the OAuth app in **Testing** and add yourself as a test user.

### 1. Create a Google Cloud project

1. Open [Google Cloud Console](https://console.cloud.google.com/) and sign in with the Gmail account you want to test.
2. Click the project picker at the top → **New Project**.
3. Name it something like `Flashcards local` → **Create**. Select that project.

### 2. Configure the Google Auth Platform (consent screen)

Google’s console now uses **Google Auth Platform** (Branding / Audience / Clients). Older docs say **APIs & Services → OAuth consent screen**; same settings live there if you still see that menu.

1. Open [Google Auth Platform](https://console.cloud.google.com/auth/overview) (or **APIs & Services → Google Auth Platform**).
2. If asked to get started, choose **External** (this is correct for a personal Gmail; Internal is Workspace-only).
3. **Branding**
   - App name: `Flashcards`
   - User support email: your Gmail
   - Developer contact email: your Gmail
   - Leave logo, homepage, privacy policy, and authorized domains empty. `localhost` is not an authorized domain and does not need to be.
4. **Data Access / Scopes**: do not add extra scopes. Sign in only needs `openid`, `email`, and `profile` (included by default).
5. **Audience**: stay in **Testing**. Click **Add users** and add the same Gmail you will sign in with. Until you do this, Google shows `access_blocked` / 403. You can add up to 100 test users; no Google verification is needed.

### 3. Create a Web OAuth client

1. Open [Clients](https://console.cloud.google.com/auth/clients) → **Create client**.
2. Application type: **Web application**.
3. Name: `Flashcards local`.
4. **Authorized JavaScript origins** (add all of these; Google treats `localhost` and `127.0.0.1` as different):
   - `http://localhost:5173`
   - `http://localhost:5174`
   - `http://127.0.0.1:5173`
   - `http://127.0.0.1:5174`
5. **Authorized redirect URIs** (same origins; GIS popup on localhost is happiest when these match):
   - `http://localhost:5173`
   - `http://localhost:5174`
   - `http://127.0.0.1:5173`
   - `http://127.0.0.1:5174`
6. **Create**. Copy the **Client ID** (`….apps.googleusercontent.com`). You do not need the client secret for this app.

No extra Google APIs (Gmail, Drive, etc.) need to be enabled.

### 4. Put the client ID in this repo

Frontend — copy `frontend/.env.example` to `frontend/.env.local` and paste the client ID:

```
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
```

API — copy `backend/google-sso.yml.example` to `backend/google-sso.yml` and paste the same client ID:

```yaml
app:
  google:
    client-id: YOUR_CLIENT_ID.apps.googleusercontent.com
```

Or set `$env:GOOGLE_CLIENT_ID="YOUR_CLIENT_ID.apps.googleusercontent.com"` in the PowerShell window that runs Spring Boot.

Restart both the Vite dev server and Spring Boot after saving. Flyway migration `V9` makes `password_hash` optional and adds `google_sub`.

### 5. Try it

1. Open the login page at [http://localhost:5173/login](http://localhost:5173/login) (or 5174 if Vite chose that port).
2. Click **Continue with Google**, pick your test Gmail, and allow Flashcards to see your name and email.
3. A flashcards account is created (or linked if that email already registered with a password).

If the Google button is missing, `.env.local` is absent or Vite was not restarted. If Google shows `redirect_uri_mismatch` or origin errors, the JavaScript origin must match the URL in the address bar exactly, including port. If Google shows that the app has not completed verification, add your Gmail under **Audience → Test users**.

## CSV format

Import and export use `front,back` columns. A header row of `front,back` (or `question,answer`) is optional:

```csv
front,back
photosynthesis,process plants use to make food
mitochondria,powerhouse of the cell
```

## Project layout

```
backend/    Spring Boot REST API
frontend/   React (Vite) app + Capacitor Android project
docker-compose.yml          MySQL for local development
docker-compose.prod.yml     Nginx + API + MySQL for a small VM
```

## Deploy (cheap VM)

The production compose file runs Nginx (the React build + `/api` proxy), Spring Boot, and MySQL on one host. The frontend already calls `/api` with relative URLs, so you do not need a domain or a separate static host yet. HTTP on a Lightsail IP is enough to start.

Recommended box: **AWS Lightsail $10/month (2 GB RAM)**. Java 21 + MySQL is uncomfortable on 1 GB. Skip GCP e2-micro until the app is tiny and tuned.

On a fresh Ubuntu instance:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# log out and back in so docker works without sudo
git clone https://github.com/barry1cassidy/flashcards.git
cd flashcards
cp .env.example .env
# edit .env: set MYSQL_PASSWORD, MYSQL_ROOT_PASSWORD, APP_JWT_SECRET, and AGENT_API_KEY
docker compose -f docker-compose.prod.yml up -d --build
```

Open `http://YOUR_LIGHTSAIL_IP/`. Open Lightsail firewall for HTTP (80). Do not publish 3306. Google sign-in needs that `http://IP` origin added to the OAuth client; password sign-in works without it.

The first API image build downloads Maven and can take several minutes. After that, `docker compose -f docker-compose.prod.yml up -d --build` picks up git pulls.

## Android (Capacitor)

The native app is the same Vite React UI in a WebView. Keep coding in Cursor; install **Android Studio** for the SDK and emulator.

```bash
cd frontend
copy .env.android.example .env.android   # Windows; already points at the Lightsail test API
npm run android
```

That builds with `VITE_API_BASE`, syncs Capacitor, and opens Android Studio. Pick an emulator (or a USB phone) and Run.

The Lightsail API must allow Capacitor origins (included in `APP_CORS_ORIGINS`). After pulling CORS changes, rebuild the API container on the VM. Google sign-in in the WebView is not wired yet; use email/password first.
