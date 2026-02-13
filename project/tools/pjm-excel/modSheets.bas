Attribute VB_Name = "modSheets"
Option Explicit

' =============================================================================
' modSheets - Per-sheet data loaders for PJM Data Miner feeds
' Requires: modConfig, modHttp, JsonConverter (VBA-JSON), Microsoft Scripting Runtime
' =============================================================================

' ---------------------------------------------------------------------------
' Public entry points (assign these to buttons)
' ---------------------------------------------------------------------------

Public Sub RefreshRT5Min()
    ' Real-time 5-minute LMP prices (last 50 intervals)
    If Not ValidateConfig() Then Exit Sub

    Dim sheetName As String: sheetName = "RT 5-Min LMP"
    Dim feedName As String: feedName = "rt_unverified_fivemin_lmps"

    Application.StatusBar = "Fetching RT 5-Min LMP data from PJM..."
    Application.ScreenUpdating = False

    Dim params As String
    params = BuildQueryParams( _
        "startRow", "1", _
        "rowCount", "50", _
        "pnode_id", GetPNodeId(), _
        "datetime_beginning_ept", BuildDateRange(0, 1), _
        "sort", "datetime_beginning_ept", _
        "order", "desc" _
    )

    Dim json As String
    json = PjmApiRequest(feedName, params)
    If json = "" Then GoTo Cleanup

    Dim items As Collection
    Set items = ParseItemsFromJson(json)
    If items Is Nothing Then GoTo Cleanup
    If items.Count = 0 Then
        WriteStatus sheetName, "No data returned"
        GoTo Cleanup
    End If

    ' Write to table: Datetime | PNode ID | PNode Name | Total LMP | Congestion | Loss
    Dim fields As Variant
    fields = Array("datetime_beginning_ept", "pnode_id", "pnode_name", _
                   "total_lmp_rt", "congestion_price_rt", "marginal_loss_price_rt")

    ' Fallback field names (PJM API has changed field names before)
    Dim fallbacks As Variant
    fallbacks = Array("", "", "", _
                      "itsced_lmp", "marginal_congestion", "marginal_loss")

    WriteItemsToTable sheetName, "tblRT5Min", items, fields, fallbacks
    SetLastRefresh sheetName

Cleanup:
    Application.StatusBar = False
    Application.ScreenUpdating = True
End Sub

Public Sub RefreshDAHourly()
    ' Day-ahead hourly LMP prices (today's 24 hours)
    If Not ValidateConfig() Then Exit Sub

    Dim sheetName As String: sheetName = "DA Hourly LMP"
    Dim feedName As String: feedName = "da_hrl_lmps"

    Application.StatusBar = "Fetching DA Hourly LMP data from PJM..."
    Application.ScreenUpdating = False

    Dim params As String
    params = BuildQueryParams( _
        "startRow", "1", _
        "rowCount", "25", _
        "pnode_id", GetPNodeId(), _
        "datetime_beginning_ept", BuildDateRange(0, 1), _
        "sort", "datetime_beginning_ept", _
        "order", "desc" _
    )

    Dim json As String
    json = PjmApiRequest(feedName, params)
    If json = "" Then GoTo Cleanup

    Dim items As Collection
    Set items = ParseItemsFromJson(json)
    If items Is Nothing Then GoTo Cleanup
    If items.Count = 0 Then
        WriteStatus sheetName, "No data returned"
        GoTo Cleanup
    End If

    Dim fields As Variant
    fields = Array("datetime_beginning_ept", "pnode_id", "pnode_name", _
                   "total_lmp_da", "congestion_price_da", "marginal_loss_price_da")

    Dim fallbacks As Variant
    fallbacks = Array("", "", "", _
                      "system_energy_price_da", "", "")

    WriteItemsToTable sheetName, "tblDAHourly", items, fields, fallbacks
    SetLastRefresh sheetName

Cleanup:
    Application.StatusBar = False
    Application.ScreenUpdating = True
End Sub

Public Sub RefreshRTHourly()
    ' Real-time hourly LMP prices (today's 24 hours)
    If Not ValidateConfig() Then Exit Sub

    Dim sheetName As String: sheetName = "RT Hourly LMP"
    Dim feedName As String: feedName = "rt_hrl_lmps"

    Application.StatusBar = "Fetching RT Hourly LMP data from PJM..."
    Application.ScreenUpdating = False

    Dim params As String
    params = BuildQueryParams( _
        "startRow", "1", _
        "rowCount", "25", _
        "pnode_id", GetPNodeId(), _
        "datetime_beginning_ept", BuildDateRange(0, 1), _
        "sort", "datetime_beginning_ept", _
        "order", "desc" _
    )

    Dim json As String
    json = PjmApiRequest(feedName, params)
    If json = "" Then GoTo Cleanup

    Dim items As Collection
    Set items = ParseItemsFromJson(json)
    If items Is Nothing Then GoTo Cleanup
    If items.Count = 0 Then
        WriteStatus sheetName, "No data returned"
        GoTo Cleanup
    End If

    Dim fields As Variant
    fields = Array("datetime_beginning_ept", "pnode_id", "pnode_name", _
                   "total_lmp_rt", "congestion_price_rt", "marginal_loss_price_rt")

    Dim fallbacks As Variant
    fallbacks = Array("", "", "", _
                      "itsced_lmp", "marginal_congestion", "marginal_loss")

    WriteItemsToTable sheetName, "tblRTHourly", items, fields, fallbacks
    SetLastRefresh sheetName

Cleanup:
    Application.StatusBar = False
    Application.ScreenUpdating = True
End Sub

Public Sub RefreshGenByFuel()
    ' Generation by fuel type
    If Not ValidateConfig() Then Exit Sub

    Dim sheetName As String: sheetName = "Gen By Fuel"
    Dim feedName As String: feedName = "gen_by_fuel"

    Application.StatusBar = "Fetching Gen By Fuel data from PJM..."
    Application.ScreenUpdating = False

    Dim params As String
    params = BuildQueryParams( _
        "startRow", "1", _
        "rowCount", "100", _
        "datetime_beginning_ept", BuildDateRange(0, 1), _
        "sort", "datetime_beginning_ept", _
        "order", "desc" _
    )

    Dim json As String
    json = PjmApiRequest(feedName, params)
    If json = "" Then GoTo Cleanup

    Dim items As Collection
    Set items = ParseItemsFromJson(json)
    If items Is Nothing Then GoTo Cleanup
    If items.Count = 0 Then
        WriteStatus sheetName, "No data returned"
        GoTo Cleanup
    End If

    ' Gen By Fuel columns: Datetime | Fuel Type | Is Renewable | MW
    Dim fields As Variant
    fields = Array("datetime_beginning_ept", "fuel_type", "is_renewable", "mw")

    Dim fallbacks As Variant
    fallbacks = Array("", "", "", "")

    WriteItemsToTable sheetName, "tblGenFuel", items, fields, fallbacks
    SetLastRefresh sheetName

Cleanup:
    Application.StatusBar = False
    Application.ScreenUpdating = True
End Sub

Public Sub RefreshLoadForecast()
    ' 7-day load forecast
    If Not ValidateConfig() Then Exit Sub

    Dim sheetName As String: sheetName = "Load Forecast"
    Dim feedName As String: feedName = "load_frcstd_7_day"

    Application.StatusBar = "Fetching Load Forecast data from PJM..."
    Application.ScreenUpdating = False

    Dim params As String
    params = BuildQueryParams( _
        "startRow", "1", _
        "rowCount", "200", _
        "evaluated_at_datetime_ept", BuildDateRange(0, 7), _
        "sort", "evaluated_at_datetime_ept", _
        "order", "desc" _
    )

    Dim json As String
    json = PjmApiRequest(feedName, params)
    If json = "" Then GoTo Cleanup

    Dim items As Collection
    Set items = ParseItemsFromJson(json)
    If items Is Nothing Then GoTo Cleanup
    If items.Count = 0 Then
        WriteStatus sheetName, "No data returned"
        GoTo Cleanup
    End If

    ' Load Forecast columns: Datetime | Area | Forecast Load MW
    Dim fields As Variant
    fields = Array("evaluated_at_datetime_ept", "forecast_area", _
                   "forecast_datetime_beginning_ept", "forecast_load_mw")

    Dim fallbacks As Variant
    fallbacks = Array("", "", "", "")

    WriteItemsToTable sheetName, "tblLoadForecast", items, fields, fallbacks
    SetLastRefresh sheetName

Cleanup:
    Application.StatusBar = False
    Application.ScreenUpdating = True
End Sub

Public Sub RefreshAll()
    ' Refresh all data sheets
    RefreshRT5Min
    RefreshDAHourly
    RefreshRTHourly
    RefreshGenByFuel
    RefreshLoadForecast
End Sub

' ---------------------------------------------------------------------------
' Private helpers
' ---------------------------------------------------------------------------

Private Function ParseItemsFromJson(json As String) As Collection
    ' Uses VBA-JSON (JsonConverter) to parse PJM response
    ' Returns the "items" array as a Collection of Dictionary objects
    On Error GoTo ParseError

    Dim parsed As Object
    Set parsed = JsonConverter.ParseJson(json)

    ' PJM response: { "items": [...], "totalRows": N }
    If TypeName(parsed) = "Dictionary" Then
        If parsed.Exists("items") Then
            Set ParseItemsFromJson = parsed("items")
        Else
            ' Maybe the response IS the array directly
            Set ParseItemsFromJson = New Collection
        End If
    ElseIf TypeName(parsed) = "Collection" Then
        Set ParseItemsFromJson = parsed
    Else
        Set ParseItemsFromJson = New Collection
    End If
    Exit Function

ParseError:
    MsgBox "Failed to parse PJM API response:" & vbCrLf & _
           Err.Description & vbCrLf & vbCrLf & _
           "First 200 chars: " & Left(json, 200), _
           vbExclamation, "PJM Parse Error"
    Set ParseItemsFromJson = Nothing
End Function

Private Sub WriteItemsToTable(sheetName As String, tableName As String, _
                               items As Collection, fields As Variant, fallbacks As Variant)
    ' Writes parsed items into the named Excel Table (ListObject)
    ' Clears existing data rows first, then populates

    On Error GoTo TableError

    Dim ws As Worksheet
    Set ws = ThisWorkbook.Sheets(sheetName)

    Dim tbl As ListObject
    Set tbl = ws.ListObjects(tableName)

    ' Clear existing data (keep headers)
    If Not tbl.DataBodyRange Is Nothing Then
        tbl.DataBodyRange.Delete
    End If

    ' Write each item as a row
    Dim item As Object
    Dim r As Long
    Dim c As Long
    Dim fieldName As String
    Dim fallbackName As String
    Dim cellValue As Variant

    r = 0
    For Each item In items
        r = r + 1

        ' Add a new row to the table
        If r = 1 Then
            ' First row - ListObject creates one blank row after clearing
            If tbl.DataBodyRange Is Nothing Then
                tbl.ListRows.Add
            End If
        Else
            tbl.ListRows.Add
        End If

        ' Fill columns
        For c = LBound(fields) To UBound(fields)
            fieldName = fields(c)
            fallbackName = ""
            If c <= UBound(fallbacks) Then fallbackName = fallbacks(c)

            cellValue = GetFieldValue(item, fieldName, fallbackName)
            tbl.DataBodyRange(r, c - LBound(fields) + 1).Value = cellValue
        Next c
    Next item

    Exit Sub

TableError:
    MsgBox "Error writing to table '" & tableName & "' on sheet '" & sheetName & "':" & vbCrLf & _
           Err.Description & vbCrLf & vbCrLf & _
           "Make sure the table exists with the correct name." & vbCrLf & _
           "See the PJM_EXCEL_SETUP.md guide for setup instructions.", _
           vbExclamation, "PJM Table Error"
End Sub

Private Function GetFieldValue(item As Object, fieldName As String, fallbackName As String) As Variant
    ' Reads a field from a Dictionary item, falling back to an alternate name
    On Error Resume Next

    If item.Exists(fieldName) Then
        GetFieldValue = item(fieldName)
    ElseIf fallbackName <> "" And item.Exists(fallbackName) Then
        GetFieldValue = item(fallbackName)
    Else
        GetFieldValue = ""
    End If
End Function

Private Sub WriteStatus(sheetName As String, msg As String)
    ' Writes a status message to cell B1 of the given sheet
    On Error Resume Next
    ThisWorkbook.Sheets(sheetName).Range("B1").Value = msg & " - " & Format(Now, "h:mm:ss AM/PM")
End Sub
