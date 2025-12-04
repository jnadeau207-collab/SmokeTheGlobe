# scripts/step6-etl-setup.ps1
# -----------------------------------------------
# Step 6: ETL environment setup (safe version)
#
# What this script does:
#   - Adds ETL-related env vars to .env and .env.example if missing
#   - Does NOT touch ETL Python files
#   - Does NOT touch docker-compose.yml
#
# We keep ETL code and Docker wiring manual for now to avoid
# fragile auto-editing crashes. This is the safest path for a solo dev.
# -----------------------------------------------

param(
    [string]$EnvFile = ".env",
    [string]$EnvExampleFile = ".env.example"
)

$ErrorActionPreference = "Stop"

Write-Host "== Step 6: ETL environment setup ==" -ForegroundColor Cyan

function Ensure-EnvFile {
    param(
        [string]$Path
    )

    if (-not (Test-Path $Path)) {
        Write-Host "  -> $Path not found, creating it..." -ForegroundColor Yellow
        New-Item -Path $Path -ItemType File -Force | Out-Null
    }
}

function Ensure-EnvEntry {
    param(
        [string]$FilePath,
        [string]$Key,
        [string]$Value
    )

    Ensure-EnvFile -Path $FilePath

    # Read once
    $content = Get-Content -Path $FilePath -Raw

    # Simple search: does a line starting with KEY= exist?
    $pattern = "^$([regex]::Escape($Key))="
    $exists = $content -match $pattern

    if ($exists) {
        Write-Host "  -> $Key already present in $FilePath" -ForegroundColor DarkGray
    }
    else {
        $line = "$Key=$Value"
        Write-Host "  -> Adding '$line' to $FilePath" -ForegroundColor Green
        Add-Content -Path $FilePath -Value "`n$line"
    }
}

# --------- ETL env vars we want to ensure exist ---------
$entries = @(
    @{ Key = "SUPABASE_URL";              Value = "" },
    @{ Key = "SUPABASE_SERVICE_ROLE_KEY"; Value = "" },
    @{ Key = "OPENAI_API_KEY";            Value = "" },
    @{ Key = "ETL_ENABLE_CA";             Value = "0 # Set to 1 to enable ETL for California." },
    @{ Key = "ETL_ENABLE_WA";             Value = "0 # Set to 1 to enable ETL for Washington." },
    @{ Key = "ETL_ENABLE_ON";             Value = "0 # Set to 1 to enable ETL for Ontario." }
)

# Optional header comment (only add once)
function Ensure-HeaderComment {
    param(
        [string]$FilePath
    )

    Ensure-EnvFile -Path $FilePath

    $header = "# ETL integration settings"
    $content = Get-Content -Path $FilePath -Raw

    if ($content -notmatch [regex]::Escape($header)) {
        Write-Host "  -> Adding ETL header comment to $FilePath" -ForegroundColor Green
        Add-Content -Path $FilePath -Value "`n$header"
    }
    else {
        Write-Host "  -> ETL header comment already present in $FilePath" -ForegroundColor DarkGray
    }
}

# --------- Apply to .env and .env.example ---------

$envFiles = @($EnvFile, $EnvExampleFile)

foreach ($file in $envFiles) {
    Write-Host ""
    Write-Host "Updating $file ..." -ForegroundColor Cyan

    Ensure-HeaderComment -FilePath $file

    foreach ($entry in $entries) {
        Ensure-EnvEntry -FilePath $file -Key $entry.Key -Value $entry.Value
    }
}

Write-Host ""
Write-Host "✅ Step 6 ETL env setup complete." -ForegroundColor Green
Write-Host "Next:" -ForegroundColor Cyan
Write-Host "  - Fill in SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (if you use Supabase)." -ForegroundColor Cyan
Write-Host "  - Fill in OPENAI_API_KEY when you want LLM-based parsing." -ForegroundColor Cyan
Write-Host "  - Set ETL_ENABLE_CA/WA/ON=1 when you’re ready to actually run ETL." -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: This script intentionally does *not* modify ETL Python files or docker-compose.yml." -ForegroundColor Yellow
Write-Host "      We’ll wire those up carefully by hand later so we don’t accidentally break your project." -ForegroundColor Yellow
