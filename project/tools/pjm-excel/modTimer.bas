Attribute VB_Name = "modTimer"
Option Explicit

' =============================================================================
' modTimer - Auto-refresh timer using Application.OnTime
' =============================================================================

Private mNextRunTime As Date
Private mIsRunning As Boolean

Public Sub StartAutoRefresh()
    ' Start the auto-refresh timer based on Config sheet interval
    Dim interval As Long
    interval = GetRefreshInterval()

    If interval <= 0 Then
        MsgBox "Auto-refresh interval is set to 0 (off)." & vbCrLf & _
               "Set a value in Config!B4 (1, 2, 5, 10, 15, or 30 minutes).", _
               vbInformation, "PJM Auto-Refresh"
        Exit Sub
    End If

    If mIsRunning Then
        MsgBox "Auto-refresh is already running." & vbCrLf & _
               "Click 'Stop Auto-Refresh' first to change the interval.", _
               vbInformation, "PJM Auto-Refresh"
        Exit Sub
    End If

    mIsRunning = True

    ' Immediate first refresh
    RefreshAll

    ' Schedule next run
    ScheduleNext interval

    MsgBox "Auto-refresh started." & vbCrLf & _
           "Interval: every " & interval & " minute(s)." & vbCrLf & _
           "Click 'Stop Auto-Refresh' to stop.", _
           vbInformation, "PJM Auto-Refresh"
End Sub

Public Sub StopAutoRefresh()
    ' Stop the auto-refresh timer
    If Not mIsRunning Then
        MsgBox "Auto-refresh is not running.", vbInformation, "PJM Auto-Refresh"
        Exit Sub
    End If

    On Error Resume Next
    Application.OnTime EarliestTime:=mNextRunTime, _
                       Procedure:="AutoRefreshTick", _
                       Schedule:=False
    On Error GoTo 0

    mIsRunning = False

    MsgBox "Auto-refresh stopped.", vbInformation, "PJM Auto-Refresh"
End Sub

Public Sub AutoRefreshTick()
    ' Called by Application.OnTime - do NOT call manually
    If Not mIsRunning Then Exit Sub

    ' Refresh all sheets
    RefreshAll

    ' Reschedule
    Dim interval As Long
    interval = GetRefreshInterval()
    If interval > 0 And mIsRunning Then
        ScheduleNext interval
    Else
        mIsRunning = False
    End If
End Sub

Public Function IsAutoRefreshRunning() As Boolean
    IsAutoRefreshRunning = mIsRunning
End Function

Private Sub ScheduleNext(intervalMinutes As Long)
    mNextRunTime = Now + TimeSerial(0, intervalMinutes, 0)
    Application.OnTime EarliestTime:=mNextRunTime, _
                       Procedure:="AutoRefreshTick", _
                       Schedule:=True
End Sub
