Attribute VB_Name = "modConfig"
Option Explicit

' =============================================================================
' modConfig - Configuration helpers for PJM Data Miner Excel Workbook
' Reads settings from the "Config" sheet cells
' =============================================================================

Private Const CONFIG_SHEET As String = "Config"

Public Function GetApiKey() As String
    ' API Key is in Config!B2
    On Error GoTo ErrHandler
    GetApiKey = Trim(CStr(ThisWorkbook.Sheets(CONFIG_SHEET).Range("B2").Value))
    Exit Function
ErrHandler:
    GetApiKey = ""
End Function

Public Function GetPNodeId() As String
    ' PNode ID is in Config!B3, default 33092371 (ComEd zone aggregate)
    On Error GoTo ErrHandler
    Dim val As String
    val = Trim(CStr(ThisWorkbook.Sheets(CONFIG_SHEET).Range("B3").Value))
    If val = "" Then val = "33092371"
    GetPNodeId = val
    Exit Function
ErrHandler:
    GetPNodeId = "33092371"
End Function

Public Function GetRefreshInterval() As Long
    ' Auto-refresh interval in minutes, from Config!B4. 0 = off
    On Error GoTo ErrHandler
    Dim val As Variant
    val = ThisWorkbook.Sheets(CONFIG_SHEET).Range("B4").Value
    If IsNumeric(val) Then
        GetRefreshInterval = CLng(val)
    Else
        GetRefreshInterval = 0
    End If
    Exit Function
ErrHandler:
    GetRefreshInterval = 0
End Function

Public Sub SetLastRefresh(Optional sheetName As String = "")
    ' Writes the current timestamp to Config!B5 and optionally to a sheet's "Last Updated" cell
    On Error Resume Next
    Dim ts As String
    ts = Format(Now, "M/D/YYYY h:mm:ss AM/PM")

    ThisWorkbook.Sheets(CONFIG_SHEET).Range("B5").Value = ts

    ' Also update the individual sheet's Last Updated cell (B1)
    If sheetName <> "" Then
        ThisWorkbook.Sheets(sheetName).Range("B1").Value = ts
    End If
End Sub

Public Function BuildDateRange(Optional daysBack As Long = 0, Optional daysForward As Long = 1) As String
    ' Builds PJM date range string: "M/D/YYYY HH:MMtoM/D/YYYY HH:MM"
    ' PJM API uses EPT (Eastern Prevailing Time) dates
    Dim startDate As Date
    Dim endDate As Date
    startDate = Date - daysBack
    endDate = Date + daysForward

    BuildDateRange = Format(startDate, "M/D/YYYY") & " 00:00to" & Format(endDate, "M/D/YYYY") & " 00:00"
End Function

Public Function ValidateConfig() As Boolean
    ' Returns True if config is valid, shows MsgBox if not
    If GetApiKey() = "" Then
        MsgBox "PJM API Key is not configured." & vbCrLf & vbCrLf & _
               "Please paste your Ocp-Apim-Subscription-Key into Config sheet cell B2.", _
               vbExclamation, "PJM Data Miner"
        ValidateConfig = False
        Exit Function
    End If
    ValidateConfig = True
End Function
