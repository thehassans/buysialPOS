$WshShell = New-Object -comObject WScript.Shell
$StartupFolder = [Environment]::GetFolderPath("Startup")
$Shortcut = $WshShell.CreateShortcut("$StartupFolder\Launch BuysialPOS.lnk")
$Shortcut.TargetPath = "c:\Users\kjh\Desktop\Launch BuysialPOS.bat"
$Shortcut.WindowStyle = 7
$Shortcut.Save()
Write-Host "Startup shortcut created successfully."
