' ============================================================
'  Internal helper - creates the "Fertilizer Shop" Desktop icon.
'  Run once by "Install Fertilizer Shop.bat" - not meant to be
'  double-clicked directly.
' ============================================================
Set oFSO = CreateObject("Scripting.FileSystemObject")
Set oWS = CreateObject("WScript.Shell")

sScriptDir = oFSO.GetParentFolderName(WScript.ScriptFullName)   ' ...\FertilizerSystem\scripts
sRoot = oFSO.GetParentFolderName(sScriptDir)                    ' ...\FertilizerSystem

sLinkFile = oWS.SpecialFolders("Desktop") & "\Fertilizer Shop.lnk"
Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = "wscript.exe"
oLink.Arguments = """" & sScriptDir & "\_launch_hidden.vbs"""
oLink.WorkingDirectory = sRoot
oLink.IconLocation = sRoot & "\app.ico"
oLink.Description = "Open the Fertilizer Shop system"
oLink.Save
