## 1. Core Functionality Overview

### 1.1 Primary Features

Core Box Functionality
1. Box Display & Representation
Grid Layout: 12×6 grid = 72 physical LOTO safety boxes
Visual State: Each box is a clickable tile showing:
Box number (1-72)
Current status color (RGB LED representation)
Brightness level
Online/offline indicator
2. Status Management (4 States)
| Status | Color | RGB | Purpose |
|--------|-------|-----|---------|
| **Building** | Green | (255, 255, 0) | Equipment being worked on, not yet ready |
| **Test** | Yellow | (255, 255, 0) | Testing phase, validating functionality |
| **Active** | Red | (255, 0, 0) | Live/in-use, locked out for safety |
| **Closed** | Bloue | (0, 0, 255) | Off/inactive, no lockout in effect |

3. User Interactions
Single Box Operations:
Click box → dropdown menu appears
Select new status → RGB values sent to WLED controller
LED strip updates in real-time
Status persisted to database
Action logged with timestamp
Bulk Operations:
Update All: Sync all current box colors to controllers
Clear All: Set all boxes to "Closed" (black, brightness 0)
Refresh Status: Poll all controllers for online/offline state
4. LED Controller Synchronization
Data Flow:
1.
User changes box status
2.
Service identifies which WLED controller owns that box
3.
HTTP request sends RGB + brightness to controller IP
4.
Controller updates addressable LED segment
5.
Physical LED strip changes color instantly
6.
Confirmation logged
Retry Logic:
If controller unreachable → queue update
Exponential backoff (1s, 2s, 4s, 8s...)
Max 5 retries before marking failed
Offline queue persists to IndexedDB
5. Controller Health Monitoring
Polling Service:
Every 30 seconds: ping all WLED controllers
Track response time, online/offline status
Display controller health in UI
Alert if controller goes down
Auto-resume sync when controller comes back online
6. Audit Logging
Logged Events:
Box status changes (who, when, from→to)
Controller sync successes/failures
Controller health changes
Bulk operation results (5 successful, 2 failed)
User actions (refresh, clear all, etc.)
Log Features:
Timestamped entries
Color-coded by severity (INFO, WARN, ERROR, SUCCESS)
Searchable/filterable
Exportable to CSV/JSON
Persisted to IndexedDB for offline access
7. Offline Support
When Controllers Unavailable:
Queue all status changes locally
Show "pending sync" indicator on affected boxes
Auto-retry when controller comes online
Prevent data loss with IndexedDB persistence
When App Offline:
Service Worker caches UI
Display cached box states
Queue changes in IndexedDB
Sync when connectivity restored
8. Real-Time Multi-User Sync
Scenario: Multiple operators using the app simultaneously
Option A: Polling (every 5s) - simpler, higher latency
Option B: WebSocket/SignalR - real-time, more complex
Conflict Resolution: Last-write-wins or server-authoritative

---

## 2. Architecture Layers

### 2.1 Presentation Layer (Components)

```
┌─────────────────────────────────────────────────────┐
│         Control Panel Page Component                │
├─────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ Bulk Controls│  │  Status Feed │  │ Controller│ │
│  │  (3 buttons) │  │  (Log viewer)│  │  Status   │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
├─────────────────────────────────────────────────────┤
│              Box Grid Component                      │
│  ┌─────────────────────────────────────────────────┐│
│  │  [1] [2] [3] ... [12]                           ││
│  │  [13][14][15]... [24]                           ││
│  │  ...                                             ││
│  │  [61][62][63]... [72]                           ││
│  │                                                  ││
│  │  Each box = Box Tile Component                  ││
│  │    └─ Status Dropdown (on click)                ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```
Hardware: 
    -2 esp controlllers each controls 3 led strips on pins 4,12,16.
    -6 led stips with different length: 240,237,237, 245,245,260
    -72 boxes: [
        // Strip 0 - Boxes 1-12
        { number: 1, strip: 0, rangeStart: 0, rangeEnd: 17, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 2, strip: 0, rangeStart: 20, rangeEnd: 37, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 3, strip: 0, rangeStart: 40, rangeEnd: 57, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 4, strip: 0, rangeStart: 60, rangeEnd: 77, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 5, strip: 0, rangeStart: 80, rangeEnd: 97, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 6, strip: 0, rangeStart: 100, rangeEnd: 117, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 7, strip: 0, rangeStart: 120, rangeEnd: 137, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 8, strip: 0, rangeStart: 140, rangeEnd: 157, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 9, strip: 0, rangeStart: 160, rangeEnd: 177, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 10, strip: 0, rangeStart: 180, rangeEnd: 197, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 11, strip: 0, rangeStart: 202, rangeEnd: 219, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 12, strip: 0, rangeStart: 222, rangeEnd: 240, r: 0, g: 0, b: 32, brightness: 255 },

        // Strip 1 - Boxes 13-24
        { number: 13, strip: 1, rangeStart: 0, rangeEnd: 17, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 14, strip: 1, rangeStart: 21, rangeEnd: 37, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 15, strip: 1, rangeStart: 41, rangeEnd: 57, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 16, strip: 1, rangeStart: 60, rangeEnd: 77, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 17, strip: 1, rangeStart: 82, rangeEnd: 98, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 18, strip: 1, rangeStart: 100, rangeEnd: 117, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 19, strip: 1, rangeStart: 120, rangeEnd: 137, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 20, strip: 1, rangeStart: 140, rangeEnd: 156, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 21, strip: 1, rangeStart: 158, rangeEnd: 175, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 22, strip: 1, rangeStart: 177, rangeEnd: 194, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 23, strip: 1, rangeStart: 197, rangeEnd: 214, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 24, strip: 1, rangeStart: 217, rangeEnd: 237, r: 0, g: 0, b: 32, brightness: 255 },

        // Strip 2 - Boxes 25-36
        { number: 25, strip: 2, rangeStart: 0, rangeEnd: 17, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 26, strip: 2, rangeStart: 20, rangeEnd: 37, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 27, strip: 2, rangeStart: 40, rangeEnd: 57, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 28, strip: 2, rangeStart: 60, rangeEnd: 77, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 29, strip: 2, rangeStart: 80, rangeEnd: 97, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 30, strip: 2, rangeStart: 100, rangeEnd: 117, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 31, strip: 2, rangeStart: 120, rangeEnd: 137, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 32, strip: 2, rangeStart: 139, rangeEnd: 156, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 33, strip: 2, rangeStart: 159, rangeEnd: 176, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 34, strip: 2, rangeStart: 178, rangeEnd: 195, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 35, strip: 2, rangeStart: 197, rangeEnd: 214, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 36, strip: 2, rangeStart: 217, rangeEnd: 237, r: 0, g: 0, b: 32, brightness: 255 },

        // Strip 3 - Boxes 37-48 (Mixed colors - some red)
        { number: 37, strip: 3, rangeStart: 0, rangeEnd: 24, r: 255, g: 0, b: 0, brightness: 255 },
        { number: 38, strip: 3, rangeStart: 28, rangeEnd: 43, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 39, strip: 3, rangeStart: 46, rangeEnd: 63, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 40, strip: 3, rangeStart: 65, rangeEnd: 83, r: 255, g: 0, b: 0, brightness: 255 },
        { number: 41, strip: 3, rangeStart: 85, rangeEnd: 103, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 42, strip: 3, rangeStart: 105, rangeEnd: 123, r: 255, g: 0, b: 0, brightness: 255 },
        { number: 43, strip: 3, rangeStart: 125, rangeEnd: 143, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 44, strip: 3, rangeStart: 145, rangeEnd: 163, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 45, strip: 3, rangeStart: 165, rangeEnd: 182, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 46, strip: 3, rangeStart: 184, rangeEnd: 201, r: 255, g: 0, b: 0, brightness: 255 },
        { number: 47, strip: 3, rangeStart: 203, rangeEnd: 220, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 48, strip: 3, rangeStart: 222, rangeEnd: 245, r: 255, g: 0, b: 0, brightness: 255 },

        // Strip 4 - Boxes 49-60
        { number: 49, strip: 4, rangeStart: 0, rangeEnd: 17, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 50, strip: 4, rangeStart: 20, rangeEnd: 37, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 51, strip: 4, rangeStart: 43, rangeEnd: 57, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 52, strip: 4, rangeStart: 62, rangeEnd: 81, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 53, strip: 4, rangeStart: 83, rangeEnd: 100, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 54, strip: 4, rangeStart: 102, rangeEnd: 120, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 55, strip: 4, rangeStart: 123, rangeEnd: 140, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 56, strip: 4, rangeStart: 142, rangeEnd: 160, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 57, strip: 4, rangeStart: 162, rangeEnd: 180, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 58, strip: 4, rangeStart: 182, rangeEnd: 200, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 59, strip: 4, rangeStart: 202, rangeEnd: 220, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 60, strip: 4, rangeStart: 222, rangeEnd: 245, r: 0, g: 0, b: 32, brightness: 255 },

        
        // Strip 5 - Boxes 61-72 (Mixed colors - purple and blue)
        { number: 61, strip: 5, rangeStart: 0, rangeEnd: 27, r: 159, g: 0, b: 255, brightness: 255 },
        { number: 62, strip: 5, rangeStart: 30, rangeEnd: 47, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 63, strip: 5, rangeStart: 50, rangeEnd: 69, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 64, strip: 5, rangeStart: 72, rangeEnd: 90, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 65, strip: 5, rangeStart: 92, rangeEnd: 110, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 66, strip: 5, rangeStart: 112, rangeEnd: 130, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 67, strip: 5, rangeStart: 136, rangeEnd: 154, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 68, strip: 5, rangeStart: 157, rangeEnd: 177, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 69, strip: 5, rangeStart: 177, rangeEnd: 197, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 70, strip: 5, rangeStart: 199, rangeEnd: 217, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 71, strip: 5, rangeStart: 220, rangeEnd: 237, r: 0, g: 0, b: 32, brightness: 255 },
        { number: 72, strip: 5, rangeStart: 245, rangeEnd: 260, r: 0, g: 0, b: 32, brightness: 255 }
    ]


## 2.2 Service Layer
┌──────────────────────────────────────────────────────┐
│              Service Architecture                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │  LotoBoxService (State & API)               │   │
│  │  • loadBoxes()                              │   │
│  │  • updateBoxStatus(id, status)              │   │
│  │  • bulkUpdateBoxes(ids, status)             │   │
│  │  • clearAllBoxes()                          │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │  ESP Config Service (State & API)           │   │
│  │  • Set pins                                 │   │
│  │  • Set led length                           │   │
│  │  • Set segments                             │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │  WLEDService (LED Controller API)           │   │
│  │  • setBoxColor(boxNum, r, g, b)             │   │
│  │  • setSegmentColor(controllerId, segId)     │   │
│  │  • getControllerStatus(ip)                  │   │
│  │  • batchSetColors(updates)                  │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │  ControllerHealthService (Monitoring)       │   │
│  │  • pollControllerStatus()                   │   │
│  │  • getHealthStatus()                        │   │
│  │  • handleControllerDown()                   │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │  SyncQueueService (Offline Support)         │   │
│  │  • queueUpdate(update)                      │   │
│  │  • processPendingQueue()                    │   │
│  │  • persistToIndexedDB()                     │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │  LoggerService (Audit Trail)                │   │
│  │  • log(level, message, context)             │   │
│  │  • getLogHistory()                          │   │
│  │  • exportLogs()                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
└──────────────────────────────────────────────────────┘

WLED API to use: 
GET  /json/info          → Device info (name, version, LED count, etc.)
GET  /json/state         → Current state (on/off, brightness, segments, colors)
GET  /json/cfg           → Current config
POST /json/state         → Update state (colors, brightness, effects)
POST /json               → Hardware config (pins, LED counts, save to flash)

1. Hardware Configuration (POST /json)
Purpose
Configure physical LED strips connected to ESP (pins, lengths, LED types)
Payload Structure
{
  cfg: {
    hw: {
      led: {
        cnt: 753,              // Total LED count across ALL strips
        ins: [                 // Input configurations (one per strip)
          { pin: [4],  len: 240 },   // Strip 0: GPIO4, 240 LEDs
          { pin: [12], len: 237 },   // Strip 1: GPIO12, 237 LEDs
          { pin: [16], len: 237 }    // Strip 2: GPIO16, 237 LEDs
        ]
      }
    }
  }
}
Key Rules
✅ cnt = sum of all len values
✅ pin is array (supports multiple pins per strip in advanced configs)
✅ Triggers automatic save to ESP flash memory
✅ Causes WLED to reboot (device unresponsive for ~2-5 seconds)
✅ After reboot, LED map is rebuilt internally

2. State Updates (POST /json/state)
Purpose
Update LED colors, brightness, effects, and segments
Payload Structure
{
  on: true,                    // Power on/off
  bri: 255,                    // Brightness (0-255)
  transition: 0,               // Transition time (ms)
  seg: [                        // Array of segments
    {
      id: 0,                   // Segment ID (0-based)
      start: 0,                // First LED index
      stop: 240,               // Last LED index + 1 (exclusive)
      col: [[255, 0, 0]],      // Colors [R, G, B]
      bri: 255                 // Segment brightness override
    },
    {
      id: 1,
      start: 240,
      stop: 477,
      col: [[0, 255, 0]]
    }
  ]
}
Key Rules
✅ stop is exclusive (LED at stop index is NOT included)
✅ col is array of RGB arrays (primary color at index 0)
✅ Segments can overlap (last one wins)
✅ Segments must be continuous for proper LED mapping
✅ id should match box number for tracking
