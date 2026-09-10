$ErrorActionPreference='Stop'
try { $w = New-Object -ComObject Word.Application; $w.Visible=$false; Write-Output ('Word available: '+$w.Version); $w.Quit() } catch { Write-Output ('Word unavailable: '+$_.Exception.Message) }
