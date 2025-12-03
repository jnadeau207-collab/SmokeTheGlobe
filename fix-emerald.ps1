# fix-emerald.ps1
# Replace all occurrences of emerald-950 with emerald-900 in source files

$root = "C:\dev\fuckitweball-main\SmokeTheGlobe"

Set-Location $root

Write-Host "Scanning for files to patch under $root ..." -ForegroundColor Cyan

Get-ChildItem -Recurse -File -Include *.ts,*.tsx,*.js,*.jsx,*.css,*.scss,*.mdx |
  Where-Object {
    $_.FullName -notmatch '\\node_modules\\' -and
    $_.FullName -notmatch '\\.next\\'
  } |
  ForEach-Object {
    $path = $_.FullName
    try {
      $content = Get-Content -LiteralPath $path -Raw
      if ($content -like '*emerald-950*') {
        $newContent = $content -replace 'emerald-950', 'emerald-900'
        if ($newContent -ne $content) {
          $newContent | Set-Content -LiteralPath $path -Encoding utf8
          Write-Host "Patched: $path" -ForegroundColor Green
        }
      }
    } catch {
      Write-Host "Skipped (error): $path -> $($_.Exception.Message)" -ForegroundColor Yellow
    }
  }

Write-Host "Done replacing emerald-950 with emerald-900." -ForegroundColor Cyan
