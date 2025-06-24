# 📦 Central Notification API

A lightweight, OneSignal-based notification API hub designed for Vercel deployment and Supabase integration. Allows apps to register users and send notifications centrally.

---

## 🚀 Features
- Register apps and users to receive notifications
- Send messages and deep links
- Store logs of all notifications
- Auto-creates necessary DB tables via Supabase RPC
- Simplified DB design using embedded JSON fields

---

## 🛠️ Setup

### 🔐 Environment Variables (set in Vercel UI)

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
ONESIGNAL_REST_API_KEY=your-onesignal-rest-api-key
API_SECRET_KEY=your-internal-api-key
```

---

## 📦 Supabase SQL Setup

Run this RPC function in Supabase to enable auto-creation of tables:

```sql
create or replace function ensure_notification_schema()
returns void as $$
begin
  create table if not exists ring_apps (
    id text primary key,
    name text,
    onesignal_app_id text,
    api_key text,
    created_at timestamp with time zone default now()
  );

  create table if not exists ring_users (
    id bigint generated always as identity primary key,
    user_id text,
    app_id text references ring_apps(id),
    subscription jsonb,
    onesignal_player_id text,
    preferences jsonb,
    created_at timestamp with time zone default now()
  );

  create table if not exists ring_logs (
    id bigint generated always as identity primary key,
    app_id text references ring_apps(id),
    user_id text,
    message text,
    url text,
    sent_at timestamp with time zone,
    response_status integer
  );
end;
$$ language plpgsql;
```

---

## 📬 API Endpoints

### 🔧 `POST /api/register`
Registers a user and stores their subscription info.

#### Request Body
```json
{
  "user_id": "user-abc",
  "app_id": "my-app-id",
  "subscription": {
    "endpoint": "...",
    "keys": { "p256dh": "...", "auth": "..." }
  }
}
```

### 📤 `POST /api/send`
Sends a push notification to a registered user.

#### Request Body
```json
{
  "user_id": "user-abc",
  "app_id": "my-app-id",
  "message": "You have a new update!",
  "url": "https://app.domain.com/page"
}
```

### 🆕 `POST /api/apps/create`
Creates a new app and generates a unique API key.

```json
{
  "name": "My Project App",
  "onesignal_app_id": "xxxxx"
}
```

### 📎 `POST /api/events/user-signup`
Trigger event-based notification (ex: on signup).

```json
{
  "event": "signup",
  "user_id": "user-abc",
  "app_id": "my-app-id"
}
```

### 📋 `GET /api/preferences?user_id=...&app_id=...`
Returns notification preferences for a user (used inside iframe).

### ✏️ `POST /api/preferences/update`
Updates preferences for a specific user/app.

```json
{
  "user_id": "user-abc",
  "app_id": "my-app-id",
  "preferences": {
    "marketing": false,
    "updates": true
  }
}
```

---

## 🔐 API Key Protection (Optional)

Add middleware to restrict access to your endpoints using `API_SECRET_KEY`. Example:

```ts
if (req.headers['x-api-key'] !== process.env.API_SECRET_KEY) {
  return res.status(403).json({ error: 'Unauthorized' })
}
```

For per-app API keys, validate against `apps.api_key` using the `app_id`.

---

## 🧪 Test Locally
You can use [Hoppscotch](https://hoppscotch.io) or [Postman](https://www.postman.com/) to test requests.

---

## 🛰️ Deploy

1. Push repo to GitHub
2. Import project into Vercel
3. Set environment variables
4. Deploy!

---

## 🧩 Future Ideas

- ✅ Admin dashboard to view/send notifications manually
  - Select app and user
  - Preview and send messages with optional URL

- ✅ App-level API keys
  - Apps can be created with unique `api_key`
  - Used to validate requests to the central API

- ✅ Event-based notifications (e.g. on user signup)
  - Apps can trigger `POST /api/events/...` to notify users based on app behavior

- ✅ Subscription preferences per user
  - Users can edit their preferences via iframe-based settings page per app

---

Happy hacking! 🛎️

