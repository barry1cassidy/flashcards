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
3. Put the file on the instance. The API process is user `app` (uid **10001**), not `ubuntu`, so mode `600` owned by `ubuntu` makes `/api/billing/status` report `googlePlayEnabled: false` and Android hides Subscribe:

```bash
sudo install -m 644 /path/to/downloaded.json /opt/zipdeck/google-play.json
```

4. In `.env`, set `GOOGLE_PLAY_CREDENTIALS_PATH=/app/google-play.json` (the path **inside** the container). Override `GOOGLE_PLAY_CREDENTIALS_HOST_PATH` only if the file is not at `/opt/zipdeck/google-play.json`. Product IDs default to `pro_monthly`, `pro_yearly`, `credits_addon`.
5. `docker compose -f docker-compose.prod.yml up -d api` — no image rebuild needed.

Create the file before starting the container. A bind mount to a missing path makes Docker create a directory there instead, and purchases then fail verification. Check with `docker compose -f docker-compose.prod.yml exec api ls -l /app/google-play.json` (must be a file, not a directory) and `exec api id` (`uid=10001(app)`). Until that user can read the file, Play Subscribe stays hidden.

### Stripe (website)

Stay in the Stripe **sandbox** until website payments are tested. In `.env`:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_YEARLY=price_...
STRIPE_PRICE_ADDON=price_...
```

Secret key: Developers → API keys (not the `pk_test_` publishable key). Price IDs come from Product catalog → Zipdeck Pro (monthly and yearly) and Zipdeck AI credits. Webhook: Developers → Webhooks / Add destination → **Webhook endpoint**

```
https://api.zipdeck.app/api/billing/stripe/webhook
```

Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`. Signing secret is `whsec_…`. Then `docker compose -f docker-compose.prod.yml up -d api`. `/api/billing/status` should show `stripeEnabled: true`. Live mode needs a second webhook and live keys later — do not reuse sandbox `price_` or `whsec_` values.

### Tester checkout allowlist

While `APP_BILLING_PUBLIC_CHECKOUT` is `false`, only admins and emails in `APP_BILLING_ALLOW_EMAILS` see Subscribe (website, Play, and App Store). Add this to the server `.env`, then recreate `api`:

```
APP_BILLING_ALLOW_EMAILS=barry1cassidy@gmail.com,barry1cassidy@hotmail.com,barry1cassidy@yahoo.com,*@zipdeck.app
```

Leave `APP_BILLING_PUBLIC_CHECKOUT=false` until testing is done. Then clear `APP_BILLING_ALLOW_EMAILS` and set `APP_BILLING_PUBLIC_CHECKOUT=true`.

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

### Password autofill

The website and both apps share passwords saved for **zipdeck.app**. That needs a WebView origin of `zipdeck.app` and an API on a **different** host.

- **Android** Digital Asset Links: `https://zipdeck.app/.well-known/assetlinks.json` (`get_login_creds`, package `com.zipdeck.app`). Include a SHA-256 for **every** Play app-signing cert, especially **Download certificates → `deployment_cert.der`** (that is the cert on many phones). Classical / PQC SHA-256s alone are not enough. After changing the file, rebuild `web` and confirm the URL returns JSON, not `index.html`.
- **iOS** AASA: `https://zipdeck.app/.well-known/apple-app-site-association` must be JSON (`applinks` + `webcredentials`, app `TA5H8MHX2X.com.zipdeck.app`). Nginx has an explicit location so `try_files` cannot serve the React app. Apple’s CDN can cache a bad file for up to a week.
- **Xcode** Associated Domains: `applinks:zipdeck.app` and `webcredentials:zipdeck.app`. Enable Associated Domains on the App ID at [developer.apple.com/account](https://developer.apple.com/account) (not App Store Connect).
- After email/password login, iOS must call `@capgo/capacitor-autofill-save-password` (`offerSavePassword.js`). Android offers save from the form fields once the origin is `zipdeck.app`. Google Sign-In users never see a password sheet.

Check after a `web` deploy:

```bash
curl -sI https://zipdeck.app/.well-known/assetlinks.json
curl -sI https://zipdeck.app/.well-known/apple-app-site-association
```

Both must be `200` and `application/json`, not `text/html`.

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

`server.hostname` is `zipdeck.app` for password autofill. Native builds must use `VITE_API_BASE=https://api.zipdeck.app`. Setting hostname to the API host makes Capacitor serve bundled `index.html` and login never leaves the device. The site hosts `https://zipdeck.app/.well-known/apple-app-site-association` (`TA5H8MHX2X.com.zipdeck.app`). Associated Domains in Xcode must include `applinks:zipdeck.app` and `webcredentials:zipdeck.app`. After email/password login, iOS uses `@capgo/capacitor-autofill-save-password` to show the Keychain save sheet (a `fetch()` login never triggers it on its own).

On the Mac, clone this repo and work from `frontend` (`pwd` must end in `frontend` or `npm ci` prints npm’s help). First time only, if `ios/` is missing:

```bash
cd frontend
npm ci
npm install @capacitor/ios
npx cap add ios
```

Do not commit `frontend/ios/`, `package.json`, or `package-lock.json` from the Mac. `ios/` holds `GIDClientID` and signing. After `cap add ios`, copy the Swift files as in **App Store subscriptions** below — `cap add` / `cap sync` never copy `ios-native/`. Capacitor 8.5 `SceneDelegate` must instantiate `MainViewController()`; the storyboard Custom Class is ignored.

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

Google’s JavaScript button does not work in the iOS WebView. With `server.hostname` set, the origin is `capacitor://zipdeck.app` (not a Google JS origin). The app uses native Google Sign-In (`@capawesome/capacitor-google-sign-in`). Do not add `capacitor://localhost`, `capacitor://zipdeck.app`, or any `capacitor://` URL as a Google JavaScript origin or redirect URI.

In the **same Google Cloud project** as the Web client, create one **iOS** OAuth client with bundle ID `com.zipdeck.app`. The plugin still sends the **Web** client ID so `/api/auth/google` can verify the token. Configure the iOS client only in `Info.plist` on the Mac (Xcode **App** target → **Info**):

- `GIDClientID` — the iOS OAuth client ID (`….apps.googleusercontent.com`).
- `CFBundleURLTypes` → `CFBundleURLSchemes` — the **reversed** iOS URL scheme Google shows on that client (`com.googleusercontent.apps.…`). Role can stay **Editor**.
- `ITSAppUsesNonExemptEncryption` — Boolean **NO** (standard HTTPS only; avoids a TestFlight export-compliance prompt).

Do not paste those values into git or chat.

### App Store subscriptions

Digital Pro on iOS uses StoreKit, not Stripe. Product IDs must match App Store Connect: `pro_monthly`, `pro_yearly`, and consumable `credits_addon`. The API verifies the signed StoreKit 2 transaction at `/api/billing/apple/purchase`. No In-App Purchase `.p8` key is required for that.

The Swift sources live at `frontend/ios-native/` because `ios/` is created on the Mac. **`npx cap sync ios` does not copy that folder.** After every `git pull` that touches `ios-native/`, copy the files into the Xcode App target yourself and confirm they replaced the copies Xcode compiles.

Copying `AppleBillingPlugin.swift` is **not** enough: Capacitor 8 only talks to in-app plugins that `registerPluginInstance` loads, the same way Android `MainActivity` calls `registerPlugin(PlayBillingPlugin.class)`. That call lives on `MainViewController`. **Capacitor 8.5 ignores `Main.storyboard`:** `SceneDelegate` creates the window in code with `CAPBridgeViewController()`, so the storyboard Custom Class never runs and Subscribe shows `AppleBilling plugin is not implemented on ios`. Set `window?.rootViewController = MainViewController()` in `SceneDelegate.swift`. StoreKit must start the purchase on the main thread (`Task { @MainActor in }`). If Subscribe returns with no sheet and no error, Xcode is still compiling an old plugin copy.

Xcode may keep **two** on-disk copies. Overwrite both after pull:

```bash
cp frontend/ios-native/AppleBillingPlugin.swift frontend/ios/App/App/AppleBillingPlugin.swift
cp frontend/ios-native/AppleBillingPlugin.swift frontend/ios/App/AppleBillingPlugin.swift
cp frontend/ios-native/MainViewController.swift frontend/ios/App/App/MainViewController.swift
cp frontend/ios-native/MainViewController.swift frontend/ios/App/MainViewController.swift
cp frontend/ios-native/SceneDelegate.swift frontend/ios/App/App/SceneDelegate.swift
```

Then `find frontend/ios -name AppleBillingPlugin.swift` and `grep MainActor` on every path except `ios-native` (that one is the source). `grep rootViewController ios/App/App/SceneDelegate.swift` must show `MainViewController()`. Close stale Xcode tabs **without saving** or the editor will write the old buffer back.

After `git pull`:

1. Copy **all three** Swift files into the Xcode **App** target as above (same target as `Info.plist`). Add `MainViewController.swift` with File → Add Files if it is not already in the project. Overwrite `SceneDelegate.swift` — do not leave `CAPBridgeViewController()` as the root controller.
2. Confirm **Build Phases → Compile Sources** lists `AppleBillingPlugin.swift`, `MainViewController.swift`, and `SceneDelegate.swift` (select the blue App project, then TARGETS → App → Build Phases).
3. In `SceneDelegate.swift`, `willConnectTo` must use `window?.rootViewController = MainViewController()`. The storyboard Custom Class does not matter on Capacitor 8.5. Grep must show `MainViewController()`, not `CAPBridgeViewController()`.
4. Signing & Capabilities → add **In-App Purchase** if it is not already there. Keep Associated Domains (`applinks:zipdeck.app`, `webcredentials:zipdeck.app`).
5. `npm run build:android` then `npx cap sync ios`. Confirm the three Swift files are still in Compile Sources (`cap sync` must not delete them). If you sync after copying, copy the Swift files **again**.

**Paid Apps** (App Store Connect → **Business** → Agreements) must be **Active** or StoreKit returns no products and Subscribe shows “This subscription is not available in the App Store yet.” **Pending User Info** / **Processing** means tax or banking is incomplete. Complete the **electronic W-9** in that page (do not download a blank IRS form). US individual / sole proprietor is **Non-Exempt Payee**. Leave Business Name blank unless you file under a different legal name. Add a **bank account** on the same page. Do not paste TINs or bank numbers into git or chat. Bank can stay **Processing** after Paid Apps is already Active.

Products: subscription group with `pro_monthly` and `pro_yearly`, plus consumable `credits_addon`. Each needs English (U.S.) display name/description and a US price. **Prepare for Submission** is enough for TestFlight once Paid Apps is Active. The banner “first auto-renewable subscription must be submitted with a new app version” is for the public store, not sandbox. The 1024 icon is optional on the IAP product page.

`AppleBilling plugin is not implemented on ios` means SceneDelegate is still creating `CAPBridgeViewController()`. “Not available in the App Store yet” means Paid Apps is not Active, or the product ID/metadata does not match.

TestFlight IAP is always sandbox and does **not** charge a real card. The sheet says **Environment: Sandbox**. Stay on the real TestFlight Apple ID (do not add that address as a Sandbox tester). Users and Access → Sandbox testers are optional extras. On iOS 26, **Settings → App Store** has no Sandbox Account row; it is under **Settings → Developer**, which needs Developer Mode (USB + Xcode). A cloud Mac cannot enable that. Skip it for TestFlight.

Do not add a website Subscribe button or Stripe checkout in the iOS app.

### iOS TestFlight build

This is how we produce the signed archive for **internal** TestFlight. App name Zipdeck, bundle ID `com.zipdeck.app`. The native Pro page uses StoreKit (`pro_monthly`, `pro_yearly`, `credits_addon`). It must not show Stripe or “subscribe on the website.”

1. On a browser: App Store Connect → register App ID `com.zipdeck.app` if needed (Certificates, Identifiers & Profiles → Identifiers), then Apps → New App → iOS, name Zipdeck, SKU `zipdeck`.
2. On the Mac: `git pull` (if pull refuses to overwrite `frontend/package.json` or `package-lock.json`, `git restore` those two files only — they are leftover Mac `npm install @capacitor/ios` edits; do not commit them). From `frontend` run `npm ci`, `npm install @capacitor/ios` if needed, `npm run build:android`, `npx cap sync ios`. Confirm `GIDClientID`, the URL scheme, and `ITSAppUsesNonExemptEncryption=NO` survived (`cap sync` does not overwrite `Info.plist`).
3. Copy all `frontend/ios-native/*.swift` files into the App target as in **App Store subscriptions** (overwrite `ios/App/App/SceneDelegate.swift` and both plugin copies). `SceneDelegate` must set `rootViewController = MainViewController()`. Compile Sources must list `AppleBillingPlugin`, `MainViewController`, and `SceneDelegate`. If Subscribe fails with `AppleBilling plugin is not implemented on ios`, SceneDelegate is still creating `CAPBridgeViewController()`.
4. Xcode → **App** target (under TARGETS) → **Signing & Capabilities**: Automatically manage signing, your Apple Developer team, bundle identifier `com.zipdeck.app`. Associated Domains must list `applinks:zipdeck.app` and `webcredentials:zipdeck.app`. Add **In-App Purchase**. Do not commit team IDs, certificates, or provisioning profiles.
5. Bump **Build** (`CFBundleVersion`) on every upload. Apple rejects a reuse of the same version+build (all-`1.0 (1)` archives fail). Version can stay `1.0`.
6. App Store icon is the **1024×1024** slot in **Assets.xcassets → AppIcon**, not an App Store Connect upload (there is no icon file picker). The PNG must be RGB with **no alpha**. Confirm it on the TestFlight / home-screen icon; the Apps list in App Store Connect often stays a placeholder until a version is submitted. Listing screenshots go in App Store Connect → the iOS version → **Previews and Screenshots → iPhone 6.5"** (1284×2778). A 6.9" set is optional if 6.5" is present.
7. Destination: **Any iOS Device (arm64)** (Archive stays disabled while a simulator is selected). Product → Archive. Skip Xcode Cloud **Get Started**.
8. Organizer → **Archives** → select the **newest** row. **Distribute App** is on the right of that window (or right-click the row). Distribute → **App Store Connect** → Upload. Newer Xcode may skip the options/signing sheets when automatic signing is already on.
9. App Store Connect → Zipdeck → TestFlight. Wait until the build is **Ready to Test**. Create an **Internal Testing** group (Enable Automatic Distribution is fine), add yourself, attach the build. Internal testers skip Beta App Review.
10. On the test iPhone, sign into the App Store / TestFlight with the **same Apple ID** that received the invite, then install from the email’s View in TestFlight link or from the TestFlight app. Subscribe with that Apple ID. Do not sign the phone into a Sandbox tester as the main Apple ID. TestFlight is already sandbox (no real charge). iOS 26 will not show **Settings → App Store → Sandbox Account** without Developer Mode. Subscribe is allowlisted: Zipdeck accounts `barry1cassidy@…` or `@zipdeck.app` see StoreKit; everyone else still sees coming soon. That is expected. The sheet must say **Environment: Sandbox**, not a website.

A USB phone cannot attach to a cloud Mac. Simulator Google Sign-In is unreliable; TestFlight on a device is the real check. Digital goods on iOS must use StoreKit — do not add a website subscribe CTA in the iOS app.
