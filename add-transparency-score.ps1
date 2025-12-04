Param(
  [string]$SchemaPath = "prisma\schema.prisma"
)

Write-Host "== Adding transparencyScore to StateLicense (if missing) =="

if (!(Test-Path $SchemaPath)) {
  throw "Cannot find $SchemaPath – adjust the path if your schema lives elsewhere."
}

$lines = Get-Content $SchemaPath
$startIdx = $null
$endIdx = $null

for ($i = 0; $i -lt $lines.Length; $i++) {
  if ($lines[$i] -match '^\s*model\s+StateLicense\b') {
    $startIdx = $i
    break
  }
}

if ($null -eq $startIdx) {
  throw "Could not find 'model StateLicense' in $SchemaPath."
}

for ($j = $startIdx + 1; $j -lt $lines.Length; $j++) {
  if ($lines[$j] -match '^\s*}') {
    $endIdx = $j
    break
  }
}

if ($null -eq $endIdx) {
  throw "Could not find the closing '}' for model StateLicense."
}

# Check if transparencyScore already exists in that model
$modelSlice = $lines[$startIdx..$endIdx]
if ($modelSlice -match 'transparencyScore') {
  Write-Host "transparencyScore already present on StateLicense – nothing to do."
} else {
  $insertLine = '  transparencyScore Float? @map("transparency_score")'
  $before = $lines[0..($endIdx - 1)]
  $after  = $lines[$endIdx..($lines.Length - 1)]
  $newLines = $before + $insertLine + $after
  Set-Content $SchemaPath -Value $newLines -Encoding utf8
  Write-Host "Added transparencyScore to StateLicense in $SchemaPath."
}
