# Dynamic Port Configuration

This document describes how the application dynamically selects and communicates its HTTP port between the Spring Boot backend and Angular frontend.

## Overview

The application runs on different ports depending on its role:
- **Client Mode**: Port 8082 (default)
- **Hub Mode**: Port 8090

If the preferred port is unavailable, the system automatically finds an available port from a predefined list or lets the OS assign a random port.

---

## 1. Backend Port Configuration

### 1.1 Profile-Based Port Selection

Ports are configured via Spring profiles in application properties files:

**Client Mode** (`application.properties`):
```properties
server.port=8082
spring.profiles.active=prod
```
- Default port: **8082**
- This is the standard configuration for client instances

**Hub Mode** (`application-hub.properties`):
```properties
server.port=8090
spring.profiles.active=prod,hub
```
- Hub port: **8090**
- Activated when the `hub` profile is included in `spring.profiles.active`

### 1.2 Dynamic Port Resolution

**File**: `src/main/java/com/dk_power/power_plant_java/config/PortConfig.java`

The `PortConfig` component implements `WebServerFactoryCustomizer` to dynamically select an available port at startup.

#### Key Components:

**1. Preferred Port Injection**
```java
@Value("${server.port:8082}")
private int preferredPort;
```
- Reads from `server.port` property
- Defaults to 8082 if not specified
- In hub mode, reads 8090 from `application-hub.properties`

**2. Fallback Port List**
```java
private static final int[] FALLBACK_PORTS = {8082, 8083, 8084, 8085, 8086, 8087, 8088, 8089, 8090};
```
- If preferred port is busy, tries these ports in order
- Skips the preferred port to avoid redundant checks

**3. Port Selection Logic**

The `customize()` method runs during server initialization:

```java
@Override
public void customize(ConfigurableWebServerFactory factory) {
    int port = findAvailablePort();
    factory.setPort(port);
    System.out.println("Starting server on port: " + port);
}
```

**Port Selection Flow**:
1. Try preferred port (8082 for client, 8090 for hub)
2. If busy, iterate through fallback ports
3. If all ports busy, set port to 0 (OS assigns random port)
4. Configure the web server factory with selected port

**Port Availability Check**:
```java
private boolean isPortAvailable(int port) {
    try (ServerSocket socket = new ServerSocket(port)) {
        socket.setReuseAddress(true);
        return true;
    } catch (IOException e) {
        return false;
    }
}
```
- Attempts to bind to the port
- Returns `true` if successful, `false` if port is in use

### 1.3 Port Communication to Angular

After the server successfully starts, the actual port is written to a file for Angular to consume.

**Event Listener**:
```java
@EventListener
public void onServerInitialized(WebServerInitializedEvent event) {
    int actualPort = event.getWebServer().getPort();
    writePortToFile(actualPort);
}
```
- Listens for `WebServerInitializedEvent` (fires when server is fully started)
- Gets the actual port from the running web server
- Writes it to `backend-port.txt`

**File Writing**:
```java
private void writePortToFile(int port) {
    try {
        Path portFile = Paths.get("backend-port.txt");
        Files.writeString(portFile, String.valueOf(port));
        System.out.println("Wrote backend port " + port + " to " + portFile.toAbsolutePath());
    } catch (IOException e) {
        System.err.println("Failed to write backend port to file: " + e.getMessage());
    }
}
```
- File location: `<project-root>/backend-port.txt`
- Contains only the port number as a string (e.g., "8082" or "8090")
- Overwrites any existing file

---

## 2. Angular Frontend Port Discovery

### 2.1 Proxy Configuration

**File**: `frontend/proxy.conf.js`

The Angular dev server uses this proxy configuration to forward API requests to the backend.

**Port Discovery Function**:
```javascript
function getBackendPort() {
  const portFilePath = path.join(__dirname, '..', 'backend-port.txt');

  try {
    if (fs.existsSync(portFilePath)) {
      const port = fs.readFileSync(portFilePath, 'utf8').trim();
      console.log(`[Proxy] Using backend port ${port} from ${portFilePath}`);
      return port;
    }
  } catch (err) {
    console.warn(`[Proxy] Could not read backend port file: ${err.message}`);
  }

  // Fallback to environment variable or default
  const fallbackPort = process.env.BACKEND_PORT || '8082';
  console.log(`[Proxy] Using fallback backend port ${fallbackPort}`);
  return fallbackPort;
}
```

**Fallback Hierarchy**:
1. Read from `backend-port.txt` (written by Spring Boot)
2. Read from `BACKEND_PORT` environment variable
3. Default to port 8082

**Proxy Target Configuration**:
```javascript
const BACKEND_PORT = getBackendPort();
const target = `http://localhost:${BACKEND_PORT}`;

const paths = [
  '/api', '/ng', '/work-requests-api', '/jha-api',
  '/images-api', '/uploads', '/power-automate',
  '/actuator', '/browser', '/print', '/server'
];

paths.forEach(path => {
  config[path] = { target, secure: false, changeOrigin: true };
});
```
- All listed paths are proxied to the backend
- Target is dynamically set based on discovered port

### 2.2 Angular Configuration

**File**: `frontend/angular.json`

```json
"serve": {
  "builder": "@angular-devkit/build-angular:dev-server",
  "options": {
    "proxyConfig": "proxy.conf.js"
  }
}
```
- The dev server is configured to use `proxy.conf.js`
- Proxy config is loaded once at Angular dev server startup

### 2.3 Environment Files

**File**: `frontend/src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: '/ng',
  baseApiUrl: '',
  syncServerUrl: 'http://localhost:8090',
  baseHref: '/'
};
```
- `apiUrl` uses relative paths (proxied by Vite/Angular dev server)
- `syncServerUrl` hardcoded to 8090 (assumes hub is always on 8090)
- In production, Angular is bundled and served from the backend, so proxying is not needed

---

## 3. Complete Flow Diagram

### Client Mode Startup (Port 8082)

```
1. Spring Boot starts
   └─> application.properties: server.port=8082

2. PortConfig.customize() runs
   └─> Check if 8082 is available
       ├─> Available: Use 8082
       └─> Busy: Try fallback ports [8083, 8084, ...]

3. Server starts on selected port (e.g., 8082)

4. WebServerInitializedEvent fires
   └─> PortConfig.onServerInitialized()
       └─> Write "8082" to backend-port.txt

5. Angular dev server starts
   └─> proxy.conf.js reads backend-port.txt
       └─> Configure proxy: http://localhost:8082

6. Angular makes API request to /api/foo
   └─> Proxied to http://localhost:8082/api/foo
```

### Hub Mode Startup (Port 8090)

```
1. Spring Boot starts with hub profile
   └─> spring.profiles.active=prod,hub
   └─> application-hub.properties: server.port=8090

2. PortConfig.customize() runs
   └─> Check if 8090 is available
       ├─> Available: Use 8090
       └─> Busy: Try fallback ports [8082, 8083, ...]

3. Server starts on selected port (e.g., 8090)

4. WebServerInitializedEvent fires
   └─> PortConfig.onServerInitialized()
       └─> Write "8090" to backend-port.txt

5. Angular dev server starts
   └─> proxy.conf.js reads backend-port.txt
       └─> Configure proxy: http://localhost:8090

6. Angular makes API request to /api/foo
   └─> Proxied to http://localhost:8090/api/foo
```

---

## 4. Port Selection Examples

### Example 1: Client Mode - Preferred Port Available
```
server.port = 8082 (from application.properties)
Port 8082 is available
→ Selected port: 8082
→ backend-port.txt: "8082"
```

### Example 2: Client Mode - Port Busy
```
server.port = 8082 (from application.properties)
Port 8082 is BUSY
Check fallback ports...
Port 8083 is available
→ Selected port: 8083
→ backend-port.txt: "8083"
```

### Example 3: Hub Mode - Preferred Port Available
```
server.port = 8090 (from application-hub.properties)
Port 8090 is available
→ Selected port: 8090
→ backend-port.txt: "8090"
```

### Example 4: Hub Mode - Port Busy, Fallback to Client Port
```
server.port = 8090 (from application-hub.properties)
Port 8090 is BUSY
Check fallback ports...
Port 8082 is available
→ Selected port: 8082
→ backend-port.txt: "8082"
```

### Example 5: All Ports Busy
```
server.port = 8082
Ports 8082-8090 all BUSY
→ Selected port: 0 (OS assigns random port, e.g., 54321)
→ backend-port.txt: "54321"
```

---

## 5. Development Workflow

### Recommended Startup Order

**Option 1: Backend First (Recommended)**
```bash
# Terminal 1 - Start Spring Boot
mvn spring-boot:run
# Wait for: "Wrote backend port 8082 to ..."

# Terminal 2 - Start Angular
cd frontend
npm start
# Should see: "[Proxy] Using backend port 8082 from ..."
```

**Option 2: Angular First (Fallback Mode)**
```bash
# Terminal 1 - Start Angular
cd frontend
npm start
# Will see: "[Proxy] Using fallback backend port 8082"

# Terminal 2 - Start Spring Boot
mvn spring-boot:run

# If backend uses different port, restart Angular
# Ctrl+C in Terminal 1, then npm start again
```

### Switching Between Client and Hub Modes

**To Client Mode**:
1. Edit `application.properties`:
   ```properties
   spring.profiles.active=prod
   ```
2. Restart Spring Boot
3. Restart Angular dev server (if already running)

**To Hub Mode**:
1. Edit `application.properties`:
   ```properties
   spring.profiles.active=prod,hub
   ```
2. Restart Spring Boot
3. Restart Angular dev server (if already running)

---

## 6. Troubleshooting

### Angular Shows "Connection Refused" Errors

**Symptom**:
```
[vite] http proxy error: /api/auth/me
AggregateError [ECONNREFUSED]
```

**Causes & Solutions**:

1. **Backend not started**
   - Solution: Start Spring Boot backend first

2. **Backend on different port than Angular expects**
   - Check Spring Boot console: `"Starting server on port: XXXX"`
   - Check Angular console: `"[Proxy] Using backend port XXXX"`
   - Solution: Restart Angular dev server to re-read `backend-port.txt`

3. **backend-port.txt doesn't exist**
   - Solution: Ensure Spring Boot has fully started and written the file
   - Check: `type backend-port.txt` (Windows) or `cat backend-port.txt` (Linux/Mac)

4. **Port file has stale port number**
   - Solution: Delete `backend-port.txt` and restart both servers

### Backend Starts on Unexpected Port

**Check**:
1. What profile is active?
   ```
   Spring Boot log: "The following profiles are active: prod, hub"
   ```
2. Is preferred port busy?
   ```
   Spring Boot log: "Port 8090 is busy, searching for alternative..."
   ```
3. Check which port was selected:
   ```
   Spring Boot log: "Starting server on port: 8083"
   ```

### Angular Proxy Uses Wrong Port

**Verify**:
1. Check Angular dev server startup logs:
   ```
   [Proxy] Using backend port 8090 from C:\...\backend-port.txt
   ```
2. Check file contents:
   ```bash
   type backend-port.txt
   ```
3. If mismatch, restart Angular dev server

---

## 7. File Locations

| File | Purpose | Created By |
|------|---------|------------|
| `backend-port.txt` | Port communication file | Spring Boot (PortConfig) |
| `src/main/resources/application.properties` | Client mode config (port 8082) | Developer |
| `src/main/resources/application-hub.properties` | Hub mode config (port 8090) | Developer |
| `src/main/java/com/dk_power/power_plant_java/config/PortConfig.java` | Dynamic port selection logic | Developer |
| `frontend/proxy.conf.js` | Angular proxy config (reads backend-port.txt) | Developer |
| `frontend/angular.json` | Angular dev server config (uses proxy.conf.js) | Angular CLI |

---

## 8. Git Configuration

The `backend-port.txt` file is excluded from version control:

**`.gitignore`**:
```gitignore
# Backend port file for Angular dev server
backend-port.txt
```

This is necessary because:
- The file is runtime-generated and machine-specific
- Different developers may run on different ports
- The file is recreated on every backend startup

---

## 9. Production Considerations

In production (Electron packaging):
- Angular is pre-built and served as static files from Spring Boot's `resources/static/angular`
- No proxy is needed (Angular and backend are on the same server)
- The `backend-port.txt` file is not used
- Port is determined solely by Spring Boot configuration

The dynamic port system is primarily for **development mode** where Angular runs on its own dev server (Vite) separate from the Spring Boot backend.
