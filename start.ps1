# Set UTF-8 encoding for proper Unicode handling
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "🚀 Starting Green Code Optimizer..." -ForegroundColor Cyan

# Check Backend
Write-Host "`n🔍 Checking Backend..." -ForegroundColor Yellow
Set-Location ".\2_backend"
node check_env.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend check failed!" -ForegroundColor Red
    Set-Location ".."
    exit 1
}
Set-Location ".."

# Check Frontend
Write-Host "`n🔍 Checking Frontend..." -ForegroundColor Yellow
Set-Location ".\1_frontend"
node check_env.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend check failed!" -ForegroundColor Red
    Set-Location ".."
    exit 1
}
Set-Location ".."

Write-Host "`n✅ All checks passed!" -ForegroundColor Green
Write-Host "`nStarting services..." -ForegroundColor Cyan

# Start Backend in new window with UTF-8 encoding
Start-Process powershell -ArgumentList "-NoExit", "-Command", "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; `$OutputEncoding = [System.Text.Encoding]::UTF8; cd '.\2_backend'; npm run dev"

# Start Frontend in new window with UTF-8 encoding
Start-Process powershell -ArgumentList "-NoExit", "-Command", "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; `$OutputEncoding = [System.Text.Encoding]::UTF8; cd '.\1_frontend'; npm run dev"

Write-Host "`n✨ Services started in separate windows!" -ForegroundColor Green
Write-Host "Backend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
