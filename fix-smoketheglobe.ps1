# fix-smoketheglobe.ps1
$ErrorActionPreference = "Stop"

Write-Host "==== SmokeTheGlobe one-shot fix ====" -ForegroundColor Cyan

# Ensure we're in the project root (where package.json lives)
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: package.json not found. Run this script from the SmokeTheGlobe folder." -ForegroundColor Red
    exit 1
}

# UTF-8 without BOM encoding helper
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Write-FileUtf8NoBom {
    param(
        [string]$Path,
        [string]$Content
    )

    $fullPath = (Resolve-Path -LiteralPath $Path).Path
    [System.IO.File]::WriteAllText($fullPath, $Content, $utf8NoBom)
}

function Fix-FileEncoding {
    param(
        [string]$Path
    )

    if (Test-Path -LiteralPath $Path) {
        Write-Host "Fixing text file: $Path"
        $content = Get-Content -LiteralPath $Path -Raw

        # Strip any U+FEFF BOM characters in the text itself
        $bomChar = [char]0xFEFF
        $content = $content -replace [string]$bomChar, ""

        # Rewrite as UTF-8 without BOM
        Write-FileUtf8NoBom -Path $Path -Content $content
    }
    else {
        Write-Host "Skipping missing file: $Path" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "==== Ensuring Postgres (db) container is running ====" -ForegroundColor Cyan
try {
    docker compose up -d db | Out-Host
}
catch {
    Write-Host "docker compose failed, trying docker-compose ..." -ForegroundColor Yellow
    docker-compose up -d db | Out-Host
}

Write-Host ""
Write-Host "==== Updating package.json Prisma versions (7.0.1) ====" -ForegroundColor Cyan
$pkgPath = "package.json"
$pkgJson = Get-Content -LiteralPath $pkgPath -Raw | ConvertFrom-Json

if (-not $pkgJson.dependencies) {
    $pkgJson | Add-Member -MemberType NoteProperty -Name dependencies -Value @{}
}
if (-not $pkgJson.devDependencies) {
    $pkgJson | Add-Member -MemberType NoteProperty -Name devDependencies -Value @{}
}

$pkgJson.dependencies."@prisma/client" = "7.0.1"
$pkgJson.devDependencies."prisma" = "7.0.1"

$newPkgJson = $pkgJson | ConvertTo-Json -Depth 10
Write-FileUtf8NoBom -Path $pkgPath -Content $newPkgJson

Write-Host ""
Write-Host "==== Fixing key text files (UTF-8 no BOM) ====" -ForegroundColor Cyan

$filesToFix = @(
    ".env",
    ".env.local",
    ".env.example",
    "prisma\schema.prisma",
    "prisma.config.ts",
    "prisma\prisma.config.ts",
    "prisma\seed.ts"
)

foreach ($f in $filesToFix) {
    Fix-FileEncoding -Path $f
}

Write-Host ""
Write-Host "==== Cleaning old Next.js build (.next) ====" -ForegroundColor Cyan
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "Removed .next folder."
}
else {
    Write-Host ".next folder not found, nothing to clean."
}

Write-Host ""
Write-Host "==== Reinstalling Prisma packages (7.0.1) ====" -ForegroundColor Cyan
npm uninstall prisma @prisma/client | Out-Host
npm install -D prisma@7.0.1 | Out-Host
npm install @prisma/client@7.0.1 | Out-Host

Write-Host ""
Write-Host "==== Prisma generate and migrate deploy ====" -ForegroundColor Cyan
npx prisma generate
npx prisma migrate deploy

Write-Host ""
Write-Host "==== All done. Next step: run 'npm run dev' from this folder. ====" -ForegroundColor Green
