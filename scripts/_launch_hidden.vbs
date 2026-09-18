' ============================================================
'  This is what the "Fertilizer Shop" icon actually runs, every
'  day. No visible window. It:
'   1. quietly checks GitHub for a newer version and applies it
'      (backing up the database first, rolling back on failure)
'   2. makes sure the app is running
'   3. opens it in the browser
'  Shows a friendly message only if something goes wrong.
' ============================================================
Dim oFSO, oWS, sScriptDir, sUpdateBat, sStartBat, sCmd, exitCode
Dim Q : Q = Chr(34)   ' one double-quote character, used to build paths-with-spaces safely

Set oFSO = CreateObject("Scripting.FileSystemObject")
Set oWS = CreateObject("WScript.Shell")

sScriptDir = oFSO.GetParentFolderName(WScript.ScriptFullName)
sUpdateBat = sScriptDir & "\update.bat"
sStartBat = sScriptDir & "\_start_silent.bat"

' Step 1: auto-update check (safe no-op if already current, offline, or Docker isn't up yet)
' Built as:  cmd /c ""<path>\update.bat" --quiet"
sCmd = "cmd /c " & Q & Q & sUpdateBat & Q & " --quiet" & Q
oWS.Run sCmd, 0, True

' Step 2: make sure the app is actually running (windowStyle 0 = hidden, wait = True)
exitCode = oWS.Run(Q & sStartBat & Q, 0, True)

If exitCode = 0 Then
  oWS.Run "http://localhost:8080"
Else
  MsgBox "The Fertilizer Shop system is taking longer than usual to start." & vbCrLf & vbCrLf & _
         "Please make sure your computer finished starting up, wait a minute, " & _
         "and open the icon again." & vbCrLf & vbCrLf & _
         "If this keeps happening, call your developer.", _
         vbExclamation, "Fertilizer Shop"
End If
