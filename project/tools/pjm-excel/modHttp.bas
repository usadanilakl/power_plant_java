Attribute VB_Name = "modHttp"
Option Explicit

' =============================================================================
' modHttp - HTTP request engine for PJM Data Miner API
' Uses MSXML2.XMLHTTP60 (add reference: Microsoft XML, v6.0)
' =============================================================================

Private Const API_BASE_URL As String = "https://api.pjm.com/api/v1/"

Public Function PjmApiRequest(feedName As String, params As String) As String
    ' Makes a GET request to PJM Data Miner API
    ' feedName: e.g. "rt_unverified_fivemin_lmps"
    ' params: query string e.g. "startRow=1&rowCount=50&pnode_id=33092371&..."
    ' Returns: raw JSON response text, or empty string on error

    Dim apiKey As String
    apiKey = GetApiKey()

    If apiKey = "" Then
        PjmApiRequest = ""
        Exit Function
    End If

    Dim url As String
    url = API_BASE_URL & feedName
    If params <> "" Then
        url = url & "?" & params
    End If

    Dim http As Object
    Set http = CreateObject("MSXML2.XMLHTTP.6.0")

    On Error GoTo NetworkError

    http.Open "GET", url, False
    http.setRequestHeader "Ocp-Apim-Subscription-Key", apiKey
    http.setRequestHeader "Accept", "application/json"
    http.send

    ' Check HTTP status
    Select Case http.Status
        Case 200
            PjmApiRequest = http.responseText

        Case 401
            MsgBox "PJM API returned 401 Unauthorized." & vbCrLf & _
                   "Check that your API key in Config!B2 is correct.", _
                   vbExclamation, "PJM API Error"
            PjmApiRequest = ""

        Case 403
            MsgBox "PJM API returned 403 Forbidden." & vbCrLf & _
                   "Your API key may not have access to this feed: " & feedName, _
                   vbExclamation, "PJM API Error"
            PjmApiRequest = ""

        Case 400
            MsgBox "PJM API returned 400 Bad Request for feed: " & feedName & vbCrLf & _
                   "Response: " & Left(http.responseText, 300), _
                   vbExclamation, "PJM API Error"
            PjmApiRequest = ""

        Case Else
            MsgBox "PJM API returned HTTP " & http.Status & " for feed: " & feedName & vbCrLf & _
                   "Response: " & Left(http.responseText, 300), _
                   vbExclamation, "PJM API Error"
            PjmApiRequest = ""
    End Select

    Set http = Nothing
    Exit Function

NetworkError:
    MsgBox "Network error connecting to PJM API:" & vbCrLf & _
           Err.Description, vbCritical, "PJM Connection Error"
    PjmApiRequest = ""
    If Not http Is Nothing Then Set http = Nothing
End Function

Public Function BuildQueryParams(ParamArray args() As Variant) As String
    ' Builds URL query string from key-value pairs
    ' Usage: BuildQueryParams("startRow", "1", "rowCount", "50", "pnode_id", "33092371")
    Dim i As Long
    Dim result As String
    result = ""

    For i = LBound(args) To UBound(args) Step 2
        If i + 1 <= UBound(args) Then
            If result <> "" Then result = result & "&"
            result = result & CStr(args(i)) & "=" & UrlEncode(CStr(args(i + 1)))
        End If
    Next i

    BuildQueryParams = result
End Function

Private Function UrlEncode(text As String) As String
    ' Simple URL encoding for query parameter values
    Dim result As String
    Dim i As Long
    Dim ch As String

    result = ""
    For i = 1 To Len(text)
        ch = Mid(text, i, 1)
        Select Case ch
            Case " "
                result = result & "%20"
            Case "/"
                result = result & "%2F"
            Case ":"
                result = result & "%3A"
            Case Else
                result = result & ch
        End Select
    Next i

    UrlEncode = result
End Function
