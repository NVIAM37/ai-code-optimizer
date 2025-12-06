Write-Host "🚀 STARTING INTEGRATION TEST SUITE..." -ForegroundColor Cyan

# 1. Verify Backend
Write-Host "`n[1/2] Verifying Backend..." -ForegroundColor Yellow
node verify_backend.js
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend Verified" -ForegroundColor Green
} else {
    Write-Host "❌ Backend Verification Failed" -ForegroundColor Red
    exit 1
}

# 2. Verify Supervisor
Write-Host "`n[2/2] Verifying Supervisor..." -ForegroundColor Yellow
python test_supervisor.py
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Supervisor Verified" -ForegroundColor Green
} else {
    Write-Host "❌ Supervisor Verification Failed" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅✅ SYSTEM INTEGRITY VERIFIED ✅✅" -ForegroundColor Green
exit 0
