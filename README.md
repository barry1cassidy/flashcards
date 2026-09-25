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

The production compose file runs Nginx (the React build + `/api` proxy), Spring Boot, and MySQL on one host. The frontend already calls `/api` with relative URLs. Production Nginx listens on 80 and 443 and redirects HTTP to `https://zipdeck.app`.

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

Open Lightsail firewall for **HTTP (80)** and **HTTPS (443)**. Do not publish 3306. Google sign-in needs `https://zipdeck.app` (and `https://www.zipdeck.app` if you use it) as authorized JavaScript origins; password sign-in works without that.

### Card images (S3)

Local development stores Pro card images on disk under `backend/data/card-images` (gitignored). Production uses a **private Lightsail object storage** bucket (S3 API). Do not enable “Host a static website”. On the bucket, open **Permissions → Access keys** and create a key, then put these in the server `.env`:

```
CARD_IMAGES_STORAGE=s3
CARD_IMAGES_S3_BUCKET=zipdeck-card-images
CARD_IMAGES_S3_REGION=us-west-2
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

The API serves images over `/api` with the user’s JWT. Keep “All objects are private”. Leave `CARD_IMAGES_S3_ENDPOINT` empty.

The first API image build downloads Maven and can take several minutes. After that, `docker compose -f docker-compose.prod.yml up -d --build` picks up git pulls.

### HTTPS (Let’s Encrypt)

Issue the certificate on the host **before** the web container starts on 443, or stop `web` briefly so Certbot can bind port 80:

```bash
sudo apt-get install -y certbot
sudo mkdir -p /var/www/certbot
docker compose -f docker-compose.prod.yml stop web
sudo certbot certonly --standalone -d zipdeck.app -d www.zipdeck.app
docker compose -f docker-compose.prod.yml up -d --build
```

To add `api.zipdeck.app` to the **same** certificate (one renewal, required before native apps call that host):

```bash
nslookup api.zipdeck.app
sudo certbot certonly --webroot -w /var/www/certbot --expand \
  -d zipdeck.app -d www.zipdeck.app -d api.zipdeck.app
```

`--expand` must list every name already on the cert plus the new one. Then rebuild `web` so Nginx loads the `api.zipdeck.app` server block, and recreate `api` so CORS includes `capacitor://zipdeck.app`.

Certs are read from `/etc/letsencrypt/live/zipdeck.app/`. After Nginx is serving HTTPS, switch Certbot renewals from standalone to webroot so the timer does not fight Nginx for port 80. In `/etc/letsencrypt/renewal/zipdeck.app.conf` set:

```
authenticator = webroot
webroot_path = /var/www/certbot
```

Add a deploy hook so Nginx reloads after each renew:

```bash
sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh >/dev/null <<'EOF'
#!/bin/sh
cd /home/ubuntu/flashcards
docker compose -f docker-compose.prod.yml exec -T web nginx -s reload
EOF
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

Adjust the `cd` path if the repo lives somewhere else on the instance.

### Play Billing key

The Android app sends each purchase token to the API, which asks Google whether the purchase is real. That call needs a Play Developer API service-account JSON. It is gitignored and excluded from the image, so it has to be placed on the host and mounted in.

1. Google Cloud → IAM → the Play service account → Keys → Add key → JSON. Keep it off git.
2. Play Console → Users and permissions → invite that service-account email and give it access to orders and subscriptions for Zipdeck.
3. Put the file on the instance and restrict it:

```bash
sudo install -m 600 /path/to/downloaded.json /opt/zipdeck/google-play.json
```

4. In `.env`, set `GOOGLE_PLAY_CREDENTIALS_PATH=/app/google-play.json` (the path **inside** the container). Override `GOOGLE_PLAY_CREDENTIALS_HOST_PATH` only if the file is not at `/opt/zipdeck/google-play.json`.
5. `docker compose -f docker-compose.prod.yml up -d api` — no image rebuild needed.

Create the file before starting the container. A bind mount to a missing path makes Docker create a directory there instead, and purchases then fail verification. Check with `docker compose -f docker-compose.prod.yml exec api ls -l /app/google-play.json`. Until the key is readable, `/api/billing/status` reports Play billing off and the app hides Subscribe.

## Android (Capacitor)

The native app is the same Vite React UI in a WebView. Keep coding in Cursor; install **Android Studio** for the SDK and emulator.

```bash
cd frontend
copy .env.android.example .env.android   # Windows; points at https://api.zipdeck.app
npm run android
```

That builds with `VITE_API_BASE`, syncs Capacitor, and opens Android Studio. Pick an emulator (or a USB phone) and Run.

The API must allow Capacitor origins (included in `APP_CORS_ORIGINS`). Put the same `VITE_GOOGLE_CLIENT_ID` Web client ID in `.env.android` as the website uses.

Google’s JavaScript button does not work in the Android WebView (tiny error page, then blank). The app uses native Google Sign-In instead. Adding `https://localhost` as a JavaScript origin will not fix that. `server.hostname` is `zipdeck.app` for password autofill. Native `VITE_API_BASE` must stay `https://api.zipdeck.app` so `/api` is not served from the bundle.

In the **same Google Cloud project** as the Web client, create one **Android** OAuth client per signing SHA-1 (`com.zipdeck.app`). Do not paste those Android client IDs into the app or `.env`. The plugin still sends the **Web** client ID so `/api/auth/google` can verify the token.

Play App Signing (required for the store, including internal testing and production) re-signs each device APK. New apps use quantum-ready hybrid signing, so Play holds **several** app-signing certs: older-Android classical, a different classical for the hybrid signature, PQC, and any **Previous** key after a key change. Google Sign-In looks up package + the SHA-1 **on the installed APK**. A missing client shows as `[16] Account reauth failed` after the account picker, with no `/api/auth/google` line.

Before a **production** Play rollout (and any time a new device/track fails Google login):

1. Play Console → Protected with Play → Manage Play app signing.
2. Register an Android OAuth client for **every** App signing SHA-1 on that page (Classical / Classic variants, PQC, Previous). Ignore the upload-key block. SHA-1 is 20 colon-separated pairs, not SHA-256.
3. Keep the debug client if you still sideload: `6E:2D:F0:66:99:01:DE:EB:89:5E:F5:85:FE:0B:1F:D2:DB:B7:AA:A5` (this machine’s debug keystore).
4. If `[16]` still appears, pull the Play install and compare `apksigner verify --print-certs` Signer #1 certificate SHA-1 to Cloud — that fingerprint is a Play cert you skipped, not a bad AAB.

`google-play.json` / `GOOGLE_PLAY_CREDENTIALS_PATH` are Play Billing only. They are not used for Google login. iOS stays one OAuth client (bundle ID `com.zipdeck.app`).

### Android release build

This is how we produce the signed AAB for Play **internal testing** and, later, production. `server.hostname` is `zipdeck.app` and `androidScheme` is `https` (WebView origin `https://zipdeck.app`). `VITE_API_BASE` must be `https://api.zipdeck.app`. Pointing the API at `zipdeck.app` makes Capacitor serve bundled `index.html` for `/api` and login never leaves the device.

1. Copy `frontend/.env.android.example` to gitignored `frontend/.env.android` if it is missing.
2. Set `VITE_API_BASE=https://api.zipdeck.app`. Relative `/api` has no proxy on device.
3. Set `VITE_GOOGLE_CLIENT_ID` to the **Web** OAuth client ID (same as the website and API). Do not put an Android client ID in this file or in the app.
4. Bump `versionCode` (integer, must increase on every Play upload) and `versionName` in `frontend/android/app/build.gradle`.
5. From `frontend`, run `npm run cap:sync` (`build:android` then `npx cap sync android`). Confirm `frontend/android/app/src/main/assets/capacitor.config.json` has `"hostname": "zipdeck.app"` and that the JS bundle calls `https://api.zipdeck.app`, not `https://zipdeck.app/api`.
6. Release signing reads gitignored `frontend/android/keystore.properties`. The keys are `storeFile`, `storePassword`, `keyAlias`, and `keyPassword`. The upload keystore file named by `storeFile` lives next to that properties file and is also gitignored. Do not commit either file.
7. From `frontend/android`, run `.\gradlew.bat bundleRelease`. The AAB is `frontend/android/app/build/outputs/bundle/release/app-release.aab`.
8. Play Console → Test and release → Internal testing → create a release, upload **only** that AAB, then Review and Start rollout. Production uses the same AAB steps on the Production track once the store listing is ready.

Copy the AAB out of `build/` if you want a dated name in Downloads. Play rejects a reuse of the same `versionCode`.

## iOS (Capacitor)

The iOS app is the same Vite React UI in a WebView. Keep coding in Cursor. Signed builds and the Simulator need a **Mac + Xcode** (physical or a rented cloud Mac). This Windows machine cannot compile or upload iOS. Do not add Ionic UI.

`server.hostname` is `zipdeck.app` for password autofill. Native builds must use `VITE_API_BASE=https://api.zipdeck.app`. Setting hostname to the API host makes Capacitor serve bundled `index.html` and login never leaves the device. The site hosts `https://zipdeck.app/.well-known/apple-app-site-association` (`TA5H8MHX2X.com.zipdeck.app`). Associated Domains in Xcode must include `applinks:zipdeck.app`.

On the Mac, clone this repo and work from `frontend`. First time only, if `ios/` is missing:

```bash
cd frontend
npm ci
npm install @capacitor/ios
npx cap add ios
```

Reuse the Android Vite env (there is no separate `.env.ios`). Copy `frontend/.env.android.example` to gitignored `frontend/.env.android`:

1. `VITE_API_BASE=https://api.zipdeck.app` — relative `/api` has no proxy on device. Do not use `https://zipdeck.app`.
2. `VITE_GOOGLE_CLIENT_ID` — the **Web** OAuth client ID (same as the website and API). Do not put the iOS client ID in this file, in `VITE_GOOGLE_CLIENT_ID`, or in git.

Then:

```bash
cd frontend
npm run build:android
npx cap sync ios
npx cap open ios
```

`build:android` is the production-API Vite mode; it is what we sync into iOS as well. The API must allow Capacitor origins (included in `APP_CORS_ORIGINS`).

Google’s JavaScript button does not work in the iOS WebView (`capacitor://localhost`). The app uses native Google Sign-In (`@capawesome/capacitor-google-sign-in`). Do not add `capacitor://localhost` or any `capacitor://` URL as a Google JavaScript origin or redirect URI.

In the **same Google Cloud project** as the Web client, create one **iOS** OAuth client with bundle ID `com.zipdeck.app`. The plugin still sends the **Web** client ID so `/api/auth/google` can verify the token. Configure the iOS client only in `Info.plist` on the Mac (Xcode **App** target → **Info**):

- `GIDClientID` — the iOS OAuth client ID (`….apps.googleusercontent.com`).
- `CFBundleURLTypes` → `CFBundleURLSchemes` — the **reversed** iOS URL scheme Google shows on that client (`com.googleusercontent.apps.…`). Role can stay **Editor**.
- `ITSAppUsesNonExemptEncryption` — Boolean **NO** (standard HTTPS only; avoids a TestFlight export-compliance prompt).

Do not paste those values into git or chat.

### iOS TestFlight build

This is how we produce the signed archive for **internal** TestFlight. App name Zipdeck, bundle ID `com.zipdeck.app`. StoreKit / App Store IAP is not wired yet; the native Pro page must not show Stripe or “subscribe on the website.”

1. On a browser: App Store Connect → register App ID `com.zipdeck.app` if needed (Certificates, Identifiers & Profiles → Identifiers), then Apps → New App → iOS, name Zipdeck, SKU `zipdeck`.
2. On the Mac: `git pull`, then from `frontend` run `npm ci`, `npm run build:android`, `npx cap sync ios`. Confirm `GIDClientID` and the URL scheme survived the sync (`cap sync` does not overwrite `Info.plist`).
3. Xcode → **App** target (under TARGETS) → **Signing & Capabilities**: Automatically manage signing, your Apple Developer team, bundle identifier `com.zipdeck.app`. Do not commit team IDs, certificates, or provisioning profiles.
4. Destination: **Any iOS Device (arm64)** (Archive stays disabled while a simulator is selected). Product → Archive.
5. Organizer → **Archives** → Distribute App → **App Store Connect** → Upload. Skip Xcode Cloud “Get Started” until a manual upload has worked. Newer Xcode may skip the options/signing sheets when automatic signing is already on.
6. App Store Connect → Zipdeck → TestFlight. Wait until the build is **Ready to Test**. Create an **Internal Testing** group (Enable Automatic Distribution is fine), add yourself, attach the build. Internal testers skip Beta App Review.
7. On the test iPhone, sign into the App Store / TestFlight with the **same Apple ID** that received the invite, then install from the email’s View in TestFlight link or from the TestFlight app.

A USB phone cannot attach to a cloud Mac. Simulator Google Sign-In is unreliable; TestFlight on a device is the real check. Digital goods on iOS must use StoreKit later — do not add a website subscribe CTA in the iOS app.
