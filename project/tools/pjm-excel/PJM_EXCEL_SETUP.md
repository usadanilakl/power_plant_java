# PJM Data Miner - Excel Workbook Setup Guide

This guide walks you through building an Excel workbook that pulls live data from the PJM Data Miner 2 API. It uses the same API and authentication pattern as the Electron app's PJM integration.

## Prerequisites

- Microsoft Excel (Windows, with VBA macro support)
- PJM Data Miner API subscription key (get one at https://apiportal.pjm.com/)

---

## Step 1: Create the Workbook

1. Open Excel
2. **File > Save As** > choose **Excel Macro-Enabled Workbook (.xlsm)**
3. Name it `PJM_DataMiner.xlsm`

---

## Step 2: Create the 6 Sheets

Rename or create sheets so you have exactly these names (spelling matters for the VBA code):

| # | Sheet Name | Purpose |
|---|-----------|---------|
| 1 | `Config` | API key and settings |
| 2 | `RT 5-Min LMP` | Real-time 5-minute LMP prices |
| 3 | `DA Hourly LMP` | Day-ahead hourly LMP prices |
| 4 | `RT Hourly LMP` | Real-time hourly LMP prices |
| 5 | `Gen By Fuel` | Generation by fuel type |
| 6 | `Load Forecast` | 7-day load forecast |

---

## Step 3: Set Up the Config Sheet

On the `Config` sheet, create this layout:

| | A | B |
|---|---|---|
| 1 | **PJM Data Miner Configuration** | |
| 2 | API Key: | *(paste your key here)* |
| 3 | PNode ID: | 33092371 |
| 4 | Auto-Refresh (min): | 0 |
| 5 | Last Refresh: | *(auto-filled)* |

### Details:
- **B2** — Paste your `Ocp-Apim-Subscription-Key` from https://apiportal.pjm.com/
- **B3** — PNode ID. Default `33092371` = ComEd zone aggregate. Change to your plant's pricing node.
- **B4** — Auto-refresh interval in minutes. `0` = off. Valid: 1, 2, 5, 10, 15, 30.

### Optional: Add data validation to B4
1. Select cell B4
2. **Data > Data Validation**
3. Allow: **List**, Source: `0,1,2,5,10,15,30`

---

## Step 4: Set Up Data Sheet Tables

Repeat for each data sheet:

### RT 5-Min LMP

| | A | B | C | D | E | F |
|---|---|---|---|---|---|---|
| 1 | Last Updated: | *(auto-filled)* | | | | |
| 3 | Datetime (EPT) | PNode ID | PNode Name | Total LMP ($/MWh) | Congestion ($/MWh) | Loss ($/MWh) |

1. Select row 3 headers through a few blank rows below (e.g. A3:F13)
2. **Insert > Table** (check "My table has headers")
3. In the **Table Design** tab, rename the table to: `tblRT5Min`

### DA Hourly LMP

Same column headers as RT 5-Min LMP. Table name: `tblDAHourly`

| | A | B | C | D | E | F |
|---|---|---|---|---|---|---|
| 1 | Last Updated: | *(auto-filled)* | | | | |
| 3 | Datetime (EPT) | PNode ID | PNode Name | Total LMP ($/MWh) | Congestion ($/MWh) | Loss ($/MWh) |

### RT Hourly LMP

Same column headers as RT 5-Min LMP. Table name: `tblRTHourly`

| | A | B | C | D | E | F |
|---|---|---|---|---|---|---|
| 1 | Last Updated: | *(auto-filled)* | | | | |
| 3 | Datetime (EPT) | PNode ID | PNode Name | Total LMP ($/MWh) | Congestion ($/MWh) | Loss ($/MWh) |

### Gen By Fuel

| | A | B | C | D |
|---|---|---|---|---|
| 1 | Last Updated: | *(auto-filled)* | | |
| 3 | Datetime (EPT) | Fuel Type | Is Renewable | MW |

Table name: `tblGenFuel`

### Load Forecast

| | A | B | C | D |
|---|---|---|---|---|
| 1 | Last Updated: | *(auto-filled)* | | |
| 3 | Evaluated At (EPT) | Forecast Area | Forecast Datetime (EPT) | Forecast Load (MW) |

Table name: `tblLoadForecast`

---

## Step 5: Download VBA-JSON Library

VBA has no built-in JSON parser. We use the open-source VBA-JSON library (MIT license).

1. Go to: https://github.com/VBA-tools/VBA-JSON
2. Click **Code > Download ZIP**
3. Extract the ZIP
4. You need the file: `JsonConverter.bas`

---

## Step 6: Open VBA Editor and Add References

1. Press **Alt+F11** to open the VBA Editor
2. **Tools > References** — check these two:
   - [x] **Microsoft XML, v6.0** (for XMLHTTP web requests)
   - [x] **Microsoft Scripting Runtime** (for Dictionary, used by VBA-JSON)
3. Click OK

---

## Step 7: Import VBA Modules

In the VBA Editor:

1. **File > Import File...** > select `JsonConverter.bas` (from Step 5)
2. **File > Import File...** > select `modConfig.bas`
3. **File > Import File...** > select `modHttp.bas`
4. **File > Import File...** > select `modSheets.bas`
5. **File > Import File...** > select `modTimer.bas`

After import, your Project Explorer should show:

```
VBAProject (PJM_DataMiner.xlsm)
├── Microsoft Excel Objects
│   ├── Sheet1 (Config)
│   ├── Sheet2 (RT 5-Min LMP)
│   ├── Sheet3 (DA Hourly LMP)
│   ├── Sheet4 (RT Hourly LMP)
│   ├── Sheet5 (Gen By Fuel)
│   └── Sheet6 (Load Forecast)
├── Modules
│   ├── JsonConverter
│   ├── modConfig
│   ├── modHttp
│   ├── modSheets
│   └── modTimer
└── ThisWorkbook
```

---

## Step 8: Add Buttons

### Per data sheet — "Refresh Now" button

On each data sheet (RT 5-Min LMP, DA Hourly LMP, etc.):

1. **Developer > Insert > Button (Form Control)**
2. Draw the button somewhere visible (e.g. near cell H1)
3. When prompted "Assign Macro", select the matching sub:

| Sheet | Assign Macro |
|-------|-------------|
| RT 5-Min LMP | `RefreshRT5Min` |
| DA Hourly LMP | `RefreshDAHourly` |
| RT Hourly LMP | `RefreshRTHourly` |
| Gen By Fuel | `RefreshGenByFuel` |
| Load Forecast | `RefreshLoadForecast` |

4. Right-click the button > **Edit Text** > type `Refresh Now`

### Config sheet — Auto-refresh buttons

1. Add a button, assign macro: `StartAutoRefresh`, label: `Start Auto-Refresh`
2. Add a button, assign macro: `StopAutoRefresh`, label: `Stop Auto-Refresh`
3. Optionally add a button, assign macro: `RefreshAll`, label: `Refresh All Now`

> **Tip:** If you don't see the Developer tab, go to **File > Options > Customize Ribbon** and check **Developer**.

---

## Step 9: Test

1. On the `Config` sheet, paste your API key into cell **B2**
2. Verify PNode ID in **B3** (default 33092371 = ComEd)
3. Go to the `RT 5-Min LMP` sheet
4. Click **Refresh Now**
5. You should see the table fill with the latest 50 intervals of 5-minute LMP data
6. Check the "Last Updated" cell (B1) for the timestamp

### Test auto-refresh:
1. Go to Config, set B4 to `1` (1 minute)
2. Click **Start Auto-Refresh**
3. All sheets refresh immediately, then again every minute
4. Click **Stop Auto-Refresh** to stop

---

## Troubleshooting

### "PJM API Key is not configured"
Paste your `Ocp-Apim-Subscription-Key` into Config!B2. Get one at https://apiportal.pjm.com/.

### "PJM API returned 401 Unauthorized"
Your API key is invalid or expired. Log into the PJM API Portal and regenerate it.

### "PJM API returned 400 Bad Request"
The query parameters may be wrong. Check that the PNode ID in B3 is numeric and valid. The `startRow=1` parameter is required — the VBA code handles this automatically.

### Table not found error
Make sure each table is named exactly as specified:
- `tblRT5Min`, `tblDAHourly`, `tblRTHourly`, `tblGenFuel`, `tblLoadForecast`
To check/rename: click inside the table, go to **Table Design** tab, check the **Table Name** field.

### "Compile error: User-defined type not defined"
You're missing a VBA reference. Go to **Tools > References** in the VBA Editor and check:
- Microsoft XML, v6.0
- Microsoft Scripting Runtime

### "Compile error: Sub or Function not defined" for JsonConverter
You didn't import the `JsonConverter.bas` file. See Step 7.

### No data returned
- The PNode ID might not have data for the selected feed
- Try the default ComEd pnode: `33092371`
- Some feeds (like Load Forecast) use different date fields — the code handles this

### Auto-refresh doesn't stop
Close and reopen the workbook. The timer state resets on close.

---

## API Reference

All requests go to: `https://api.pjm.com/api/v1/{feed_name}`

| Feed | Description | Key Fields |
|------|------------|------------|
| `rt_unverified_fivemin_lmps` | Real-time 5-min LMP | total_lmp_rt, congestion_price_rt, marginal_loss_price_rt |
| `da_hrl_lmps` | Day-ahead hourly LMP | total_lmp_da, congestion_price_da, marginal_loss_price_da |
| `rt_hrl_lmps` | Real-time hourly LMP | total_lmp_rt, congestion_price_rt, marginal_loss_price_rt |
| `gen_by_fuel` | Generation by fuel | fuel_type, is_renewable, mw |
| `load_frcstd_7_day` | 7-day load forecast | forecast_area, forecast_load_mw |

### Required query parameters (all feeds):
- `startRow=1` — **REQUIRED**, omitting causes HTTP 400
- `rowCount` — how many rows to fetch
- `sort` — field to sort by
- `order` — `asc` or `desc`

### Authentication header:
```
Ocp-Apim-Subscription-Key: {your_api_key}
```

---

## Customization

### Add a new PNode
Change Config!B3 to any valid PJM pricing node ID. Find node IDs at https://dataminer2.pjm.com/feed/pnode/definition.

### Change row count
In `modSheets.bas`, edit the `rowCount` parameter in each refresh sub. For example, change `"rowCount", "50"` to `"rowCount", "100"` to fetch more history.

### Add a new feed
1. Create a new sheet with the feed's column headers
2. Create an Excel Table with a name like `tblYourFeed`
3. Add a new `Public Sub RefreshYourFeed()` in `modSheets.bas` following the pattern of existing subs
4. Add a button on the new sheet assigned to your new sub
5. Add a call to your new sub inside `RefreshAll()`
