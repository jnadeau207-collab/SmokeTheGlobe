# fix-smoketheglobe.ps1
# Run this from the SmokeTheGlobe project root.

Write-Host "=== SmokeTheGlobe Fix Script ===" -ForegroundColor Cyan

# Move to script directory (project root)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
if ($scriptDir -and (Test-Path $scriptDir)) {
    Set-Location $scriptDir
}

# 1) Strip BOM from prisma/schema.prisma (this is causing P1012)
$schemaPath = "prisma\schema.prisma"
if (Test-Path $schemaPath) {
    Write-Host "Checking for BOM in $schemaPath ..."
    $bytes = [System.IO.File]::ReadAllBytes($schemaPath)
    if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
        Write-Host "BOM detected. Stripping it..."
        $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
        $text = $utf8NoBom.GetString($bytes, 3, $bytes.Length - 3)
        [System.IO.File]::WriteAllText($schemaPath, $text, $utf8NoBom)
        Write-Host "BOM removed from schema.prisma."
    } else {
        Write-Host "No BOM found in schema.prisma."
    }
} else {
    Write-Host "WARNING: prisma/schema.prisma not found." -ForegroundColor Yellow
}

# 2) Overwrite prisma/prisma.config.ts with a sane Prisma 7 config (with seed)
Write-Host "Rewriting prisma/prisma.config.ts ..."
$prismaConfigPath = "prisma\prisma.config.ts"
$prismaConfigContent = @"
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
"@
$prismaConfigContent | Set-Content -Path $prismaConfigPath -Encoding utf8
Write-Host "prisma.config.ts written."

# 3) Ensure Tailwind/PostCSS/Autoprefixer are installed
Write-Host "Checking for tailwindcss in package.json ..."
if (Test-Path "package.json") {
    $pkgRaw = Get-Content "package.json" -Raw
    if ($pkgRaw -notmatch '"tailwindcss"') {
        Write-Host "tailwindcss not found in package.json. Installing dev dependencies..."
        npm install -D tailwindcss postcss autoprefixer
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERROR: npm install for Tailwind/PostCSS failed." -ForegroundColor Red
            exit 1
        }
        Write-Host "Tailwind/PostCSS/Autoprefixer installed."
    } else {
        Write-Host "tailwindcss already present in package.json. Skipping install."
    }
} else {
    Write-Host "ERROR: package.json not found. Are you in the project root?" -ForegroundColor Red
    exit 1
}

# 4) Run Prisma + Dev server

Write-Host "`nRunning: npx prisma generate ..." -ForegroundColor Cyan
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: prisma generate failed. Check schema.prisma and prisma.config.ts." -ForegroundColor Red
    exit 1
}

Write-Host "`nRunning: npx prisma migrate reset --force (this will wipe and recreate the dev DB) ..." -ForegroundColor Cyan
npx prisma migrate reset --force
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: prisma migrate reset failed. Is Postgres running and DATABASE_URL correct?" -ForegroundColor Red
    exit 1
}

Write-Host "`nRunning: npx prisma db seed ..." -ForegroundColor Cyan
npx prisma db seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: prisma db seed failed. Seed may not be configured or may have errors." -ForegroundColor Yellow
} else {
    Write-Host "Seed completed."
}

Write-Host "`nStarting dev server: npm run dev" -ForegroundColor Cyan
npm run dev
