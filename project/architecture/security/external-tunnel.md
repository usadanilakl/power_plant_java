# External Access Tunnel (LocalXpose)

## Purpose

LocalXpose creates a public HTTPS URL that tunnels traffic to `localhost:8082`. This lets you test the external access security tiers (Tier 3: restricted, Tier 4: grant-based) from a phone or any device outside the local network.

## Setup (One-Time)

### 1. Install

```bash
./scripts/localxpose-tunnel.sh install
```

This downloads the `loclx` binary to `~/.local/bin`. If `~/.local/bin` isn't on your PATH, add it:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

### 2. Authenticate

Get your access token from https://localxpose.io/dashboard/access, then:

```bash
./scripts/localxpose-tunnel.sh login
```

Paste your token when prompted. This is stored locally by the loclx CLI.

## Usage

### Start Tunnel

```bash
./scripts/localxpose-tunnel.sh start
```

Output shows the public URL (e.g., `https://abc123.loclx.io`). Open this URL from any external device.

### Stop Tunnel

```bash
./scripts/localxpose-tunnel.sh stop
```

### Check Status

```bash
./scripts/localxpose-tunnel.sh status
```

### View Logs

```bash
./scripts/localxpose-tunnel.sh logs
```

### Custom Port

```bash
APP_PORT=8090 ./scripts/localxpose-tunnel.sh start
```

## How It Works with Security Tiers

When traffic comes through the LocalXpose tunnel:

1. LocalXpose proxy connects to `localhost:8082`
2. The request includes `X-Forwarded-For` header with the real client's public IP
3. `NetworkUtils.getClientIp()` reads `X-Forwarded-For` and returns the external IP
4. Since the IP is not loopback or RFC 1918 private, security filters classify it as **external**

| Tier | Behavior Through Tunnel |
|------|------------------------|
| 1 (Desktop auto-auth) | Skipped — not loopback |
| 2 (LAN full access) | Skipped — not internal IP |
| 3 (External restricted) | Active — login gives `accessLevel: RESTRICTED` |
| 4 (External + grant) | Active — after admin approves, `ACCESS_TOKEN` cookie grants full access |

This is the expected behavior for testing external access flows.

## CORS Configuration

When testing the Angular frontend through the tunnel, add the tunnel URL to allowed origins in `application.properties`:

```properties
security.cors.allowed-origins=http://localhost:*,https://dk-power.github.io,https://*.loclx.io
```

Or for a specific subdomain:
```properties
security.cors.allowed-origins=http://localhost:*,https://dk-power.github.io,https://abc123.loclx.io
```

**File:** `config/SecurityConfigSpring.java` — `corsConfigurationSource()`

## Security Notes

- The tunnel is **manually started** — it does not run automatically
- Only start the tunnel when actively testing; stop it when done
- All 4 security tiers remain enforced — the tunnel doesn't bypass any security
- Admin grant endpoints (`/api/auth/admin/**`) remain localhost-only and are inaccessible through the tunnel
- LAN-only endpoints (sync, backup, h2-console) are also blocked through the tunnel
- The tunnel URL changes each time (unless you have a paid plan with reserved subdomains)

## Files

| File | Purpose |
|------|---------|
| `scripts/localxpose-tunnel.sh` | Start/stop/manage the tunnel |
| `localxpose.pid` | PID file (gitignored) |
| `logs/localxpose.log` | Tunnel output log (gitignored) |

## Testing Checklist

1. Start the Spring Boot app (`localhost:8082`)
2. Start the tunnel: `./scripts/localxpose-tunnel.sh start`
3. Copy the public URL
4. On an external device (phone, different network):
   - Open the URL — should load the Angular app
   - Login — should get `accessLevel: "RESTRICTED"` and route to `/access-request`
   - Click "Request Full Access" — creates a PENDING grant
5. On the desktop (localhost):
   - Go to `/admin/access-management` — see the pending request
   - Approve it
6. Back on the external device:
   - Polling picks up approval, `ACCESS_TOKEN` cookie is set
   - Redirected to `/home` with full access
7. Stop the tunnel: `./scripts/localxpose-tunnel.sh stop`
