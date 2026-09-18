' ============================================================
'  This is what the Desktop "Fertilizer Shop" icon actually runs.
'  Starts the containers with no visible black window, waits for
'  the app to be ready, then opens it in the browser. Shows a
'  friendly message only if something goes wrong.
' ============================================================
Set oFSO = CreateObject("Scripting.FileSystemObject")
Set oWS = CreateObject("WScript.Shell")

sScriptDir = oFSO.GetParentFolderName(WScript.ScriptFullName)

' windowStyle 0 = hidden, waitOnReturn True = block until it finishes
exitCode = oWS.Run("""" & sScriptDir & "\_start_silent.bat""", 0, True)

If exitCode = 0 Then
  oWS.Run "http://localhost:8080"
Else
  MsgBox "The Fertilizer Shop system is taking longer than usual to start." & vbCrLf & vbCrLf & _
         "Please make sure your computer finished starting up, wait a minute, " & _
         "and double-click the icon again." & vbCrLf & vbCrLf & _
         "If this keeps happening, call your developer.", _
         vbExclamation, "Fertilizer Shop"
End If
