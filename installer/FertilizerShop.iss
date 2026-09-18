; ============================================================
;  Fertilizer Shop - Windows installer (Inno Setup)
;
;  Compiles to a single Setup.exe that the sponsor double-clicks
;  once. It copies the deployment files, creates a Desktop +
;  Start Menu "Fertilizer Shop" icon, and finishes by running
;  scripts\_first_run.bat (installs Docker if missing, then
;  starts the app for the first time).
;
;  From then on the sponsor only ever uses that Desktop icon -
;  it checks GitHub for a newer version every time it's opened
;  and updates itself automatically (see scripts\update.bat and
;  scripts\_launch_hidden.vbs). A new Setup.exe is only needed
;  for a brand-new installation, never for routine updates.
;
;  HOW TO BUILD (developer machine, Windows):
;    1. Install Inno Setup (free): https://jrsoftware.org/isdl.php
;    2. Open this file in the Inno Setup Compiler (or right-click
;       it -> "Compile").
;    3. Find FertilizerShopSetup.exe in installer\dist\.
;
;  Bump #define MyAppVersion below to match VERSION/release.json
;  on each release, so Add/Remove Programs shows the right number
;  (this is just the installer's own label - the actual running
;  app version is controlled separately by the auto-updater).
; ============================================================

#define MyAppName "Fertilizer Shop"
#define MyAppVersion "1.2.0"
#define MyAppPublisher "Shriram Krushi Kendra"
#define MyAppIcon "..\app.ico"

[Setup]
AppId={{2686CDCA-F264-4136-B270-B18F3729C28A}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\Fertilizer Shop
DefaultGroupName=Fertilizer Shop
DisableProgramGroupPage=yes
DisableDirPage=yes
DisableReadyPage=no
OutputDir=dist
OutputBaseFilename=FertilizerShopSetup
SetupIconFile={#MyAppIcon}
UninstallDisplayIcon={app}\app.ico
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
Source: "..\docker-compose.yml"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\.env.example";      DestDir: "{app}"; Flags: ignoreversion
Source: "..\README.md";         DestDir: "{app}"; Flags: ignoreversion
Source: "..\app.ico";           DestDir: "{app}"; Flags: ignoreversion
Source: "..\scripts\*";         DestDir: "{app}\scripts"; Flags: ignoreversion recursesubdirs createallsubdirs

; Deliberately NOT included: .env and backups\ - those are created later, on
; this machine, by the scripts themselves (not by the installer), so Inno's
; uninstaller - which only ever removes files IT installed - leaves them
; alone automatically. Never add them here.

[Icons]
Name: "{group}\Fertilizer Shop"; Filename: "wscript.exe"; Parameters: """{app}\scripts\_launch_hidden.vbs"""; WorkingDir: "{app}"; IconFilename: "{app}\app.ico"; Comment: "Open the Fertilizer Shop system"
Name: "{commondesktop}\Fertilizer Shop"; Filename: "wscript.exe"; Parameters: """{app}\scripts\_launch_hidden.vbs"""; WorkingDir: "{app}"; IconFilename: "{app}\app.ico"; Comment: "Open the Fertilizer Shop system"
Name: "{group}\Uninstall Fertilizer Shop"; Filename: "{uninstallexe}"

[Run]
Filename: "{app}\scripts\_first_run.bat"; Description: "Finish setting up your Fertilizer Shop system"; Flags: postinstall shellexec skipifsilent
