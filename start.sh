#!/bin/bash

echo "🚀 Starting Green Code Optimizer..."

# Check Backend
echo ""
echo "🔍 Checking Backend..."
cd 2_backend
node check_env.js
if [ $? -ne 0 ]; then
    echo "❌ Backend check failed!"
    exit 1
fi
cd ..

# Check Frontend
echo ""
echo "🔍 Checking Frontend..."
cd 1_frontend
node check_env.js
if [ $? -ne 0 ]; then
    echo "❌ Frontend check failed!"
    exit 1
fi
cd ..

echo ""
echo "✅ All checks passed!"
echo ""
echo "Starting services..."

# Start Backend in background
cd 2_backend
npm run dev &
BACKEND_PID=$!
cd ..

# Start Frontend in background
cd 1_frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✨ Both services are running!"
echo "Backend: http://localhost:3000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services..."

# Handle Ctrl+C
trap "echo ''; echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM

# Wait for both processes
wait
