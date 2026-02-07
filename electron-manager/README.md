# Electron Manager

Desktop application wrapper for managing Power Plant Java applications.

## Features

- **Process Management**: Start, stop, and restart Spring Boot JARs
- **Health Monitoring**: Automatic health checks with status indicators
- **Real-time Updates**: Live status updates via IPC
- **Graceful Shutdown**: Properly stops all managed apps on exit
- **Auto-start**: Configurable auto-start for specific apps

## Project Structure

```
electron-manager/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── main.ts              # Entry point
│   │   ├── app.ts               # Main App class
│   │   ├── constants.ts         # App configuration
│   │   ├── managers/            # Window and process managers
│   │   ├── services/            # Health checking, etc.
│   │   ├── ipc/                 # IPC handlers and events
│   │   └── preload/             # Preload scripts
│   │
│   └── renderer/                # Angular UI
│       ├── src/app/             # Angular components
│       ├── angular.json         # Angular CLI config
│       └── package.json         # Angular dependencies
│
├── package.json                 # Electron dependencies
└── tsconfig.main.json           # TypeScript config for main process
```

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Java 21 (for running managed apps)

### Installation

1. Install Electron dependencies:
```bash
cd electron-manager
npm install
```

2. Install Angular dependencies:
```bash
cd src/renderer
npm install
```

## Development

### Run in development mode

Terminal 1 - Start Angular dev server:
```bash
cd src/renderer
npm start
```

Terminal 2 - Start Electron (after Angular is running):
```bash
cd electron-manager
npm start
```

### Build for production

```bash
npm run build
```

### Package for distribution

```bash
npm run package
```

## Managed Apps

Apps are configured in `src/main/constants.ts`:

| App | Port | Auto-start |
|-----|------|------------|
| P&ID Manager | 8082 | Yes |
| Fire Impairment | 8083 | No |
| Gate Log | 8084 | No |

JARs should be placed in `../managed_apps/` relative to the electron-manager folder.

## IPC API

The preload script exposes the following API to the renderer:

```typescript
window.electronAPI = {
  // App control
  startApp(appId: string): Promise<Result>
  stopApp(appId: string): Promise<Result>
  restartApp(appId: string): Promise<Result>
  getAppStatuses(): Promise<AppStatus[]>
  getAppLogs(appId: string): Promise<string[]>
  openAppUrl(appId: string): Promise<Result>

  // Status subscriptions
  onAppStatusChange(callback): () => void

  // Window control
  closeWindow(): void
  minimizeWindow(): void
  maximizeWindow(): void

  // General
  getAppVersion(): Promise<string>
  openExternal(url: string): Promise<void>
}
```

## Menu Bar

The application menu provides quick access to:

- **File > Exit**: Close application (with confirmation if apps running)
- **Apps**: Start/Stop all apps, individual app controls
- **View**: Reload, DevTools
- **Help > About**: Version info
