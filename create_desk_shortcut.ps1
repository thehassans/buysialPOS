$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("C:\Users\kjh\Desktop\BuysialPOS Offline.lnk")
$Shortcut.TargetPath = "C:\Users\kjh\Desktop\buysialErp\StartPOS.bat"
$Shortcut.IconLocation = "C:\Users\kjh\Desktop\buysialErp\public\favicon.png"
$Shortcut.WorkingDirectory = "C:\Users\kjh\Desktop\buysialErp"
$Shortcut.WindowStyle = 7
$Shortcut.Save()
