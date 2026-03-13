# Clean start script for Next.js development
Write-Host "🔥 Cleaning up Next.js processes and locks..." -ForegroundColor Yellow

# Kill any existing Next.js processes on common ports
$ports = 3000, 3001, 3002, 3003, 3004, 3005
foreach ($port in $ports) {
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "🔫 Killing process on port $port (PID: $($process.OwningProcess))" -ForegroundColor Red
        Stop-Process -Id $process.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

# Remove .next directory completely
Write-Host "🧹 Removing .next directory..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# Remove node_modules/.cache if it exists
Write-Host "🧹 Removing node_modules cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue

# Start fresh
Write-Host "🚀 Starting Next.js development server..." -ForegroundColor Green
npm run dev
