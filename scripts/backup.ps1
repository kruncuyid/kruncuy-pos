# KRUNCUY POS — Database Backup Script
# Usage: .\scripts\backup.ps1
# Scheduled: daily via Task Scheduler

param(
  [string]$OutputDir = ".\backups",
  [string]$DbName = "kruncuy",
  [string]$DbUser = "postgres",
  [string]$DbHost = "localhost"
)

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$filename = "kruncuy-backup-$timestamp.sql"
$filepath = Join-Path $OutputDir $filename

# Ensure backup directory exists
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

# Perform pg_dump
$env:PGPASSWORD = "database"
pg_dump -h $DbHost -U $DbUser -d $DbName -F p > $filepath 2>&1

if ($LASTEXITCODE -eq 0) {
  Write-Host "Backup created: $filepath"

  # Compress
  Compress-Archive -Path $filepath -DestinationPath "$filepath.zip" -Force
  Remove-Item $filepath

  # Retention: keep last 7 daily backups
  $limit = (Get-Date).AddDays(-7)
  Get-ChildItem $OutputDir -Filter "*.zip" | Where-Object { $_.LastWriteTime -lt $limit } | Remove-Item -Force

  Write-Host "Retention cleaned. Backups older than 7 days removed."
} else {
  Write-Host "Backup failed!"
  exit 1
}
