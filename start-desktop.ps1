# IT Cert Simulator - Desktop Launcher
# This script starts all required services and launches the desktop app

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  IT Cert Simulator - Desktop Launcher" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start Backend
Write-Host "[1/3] Starting Backend..." -ForegroundColor Yellow
$backend = Start-Process -FilePath "bun" -ArgumentList "run", "dev" -WorkingDirectory "$root\backend" -PassThru -WindowStyle Hidden
Write-Host "      Backend started (PID: $($backend.Id))" -ForegroundColor Green

# Wait for backend to be ready
Start-Sleep -Seconds 2

# Start Frontend
Write-Host "[2/3] Starting Frontend..." -ForegroundColor Yellow
$frontend = Start-Process -FilePath "bun" -ArgumentList "run", "dev" -WorkingDirectory "$root\frontend" -PassThru -WindowStyle Hidden
Write-Host "      Frontend started (PID: $($frontend.Id))" -ForegroundColor Green

# Wait for frontend to be ready
Write-Host "      Waiting for frontend to be ready..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# Start Tauri
Write-Host "[3/3] Launching Desktop App..." -ForegroundColor Yellow
$tauri = Start-Process -FilePath "cargo" -ArgumentList "tauri", "dev", "--no-watch" -WorkingDirectory $root -PassThru -Wait

# Cleanup when Tauri exits
Write-Host ""
Write-Host "Shutting down services..." -ForegroundColor Yellow

if (!$backend.HasExited) {
    Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue
    Write-Host "      Backend stopped" -ForegroundColor Green
}

if (!$frontend.HasExited) {
    Stop-Process -Id $frontend.Id -Force -ErrorAction SilentlyContinue
    Write-Host "      Frontend stopped" -ForegroundColor Green
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Cyan
