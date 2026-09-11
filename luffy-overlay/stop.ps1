Get-CimInstance Win32_Process |
  Where-Object { $_.CommandLine -like '*luffy-overlay*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
