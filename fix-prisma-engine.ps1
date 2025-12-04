# fix-prisma-engine.ps1
param()

Write-Host "== Fixing Prisma engineType and regenerating client =="

$repoRoot = Split-Path $MyInvocation.MyCommand.Path -Parent
Set-Location $repoRoot

$schemaPath = "prisma\schema.prisma"

if (-not (Test-Path $schemaPath)) {
    Write-Error "Could not find prisma/schema.prisma at $schemaPath"
    exit 1
}

Write-Host "Updating $schemaPath (removing engineType = 'client' if present)..."

(Get-Content $schemaPath) |
  Where-Object { $_ -notmatch 'engineType\s*=\s*"client"' } |
  Set-Content $schemaPath

Write-Host "Running: npx prisma generate"
npx prisma generate

Write-Host "`nDone. Now run: npm run dev -- --webpack"
