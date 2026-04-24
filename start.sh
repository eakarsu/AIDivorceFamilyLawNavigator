#!/bin/bash

echo "============================================"
echo "  AI Divorce & Family Law Navigator"
echo "  Starting Application..."
echo "============================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Kill processes on ports 3000 and 3001
echo -e "${YELLOW}Cleaning up ports...${NC}"
for PORT in 3000 3001; do
  PID=$(lsof -ti:$PORT 2>/dev/null)
  if [ ! -z "$PID" ]; then
    echo -e "  Killing process on port $PORT (PID: $PID)"
    kill -9 $PID 2>/dev/null
    sleep 1
  fi
done
echo -e "${GREEN}Ports cleaned.${NC}"
echo ""

# Check PostgreSQL
echo -e "${YELLOW}Checking PostgreSQL...${NC}"
if ! pg_isready -q 2>/dev/null; then
  echo -e "${RED}PostgreSQL is not running. Starting it...${NC}"
  brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null
  sleep 3
fi
echo -e "${GREEN}PostgreSQL is running.${NC}"
echo ""

# Create database if it doesn't exist
echo -e "${YELLOW}Setting up database...${NC}"
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'divorce_law_navigator'" 2>/dev/null | grep -q 1 || \
  createdb -U postgres divorce_law_navigator 2>/dev/null || \
  psql -tc "SELECT 1 FROM pg_database WHERE datname = 'divorce_law_navigator'" 2>/dev/null | grep -q 1 || \
  createdb divorce_law_navigator 2>/dev/null
echo -e "${GREEN}Database ready.${NC}"
echo ""

# Install dependencies
echo -e "${YELLOW}Installing server dependencies...${NC}"
cd server && npm install --silent 2>&1 | tail -1
echo -e "${GREEN}Server dependencies installed.${NC}"

echo -e "${YELLOW}Installing client dependencies...${NC}"
cd ../client && npm install --silent 2>&1 | tail -1
echo -e "${GREEN}Client dependencies installed.${NC}"
cd ..
echo ""

# Seed database
echo -e "${YELLOW}Seeding database...${NC}"
cd server && node seed.js
cd ..
echo -e "${GREEN}Database seeded successfully.${NC}"
echo ""

# Start backend with hot reload (nodemon)
echo -e "${BLUE}Starting backend server on port 3001...${NC}"
cd server && npx nodemon --watch . --ext js,json index.js &
BACKEND_PID=$!
cd ..
sleep 2

# Start frontend with hot reload (Vite)
echo -e "${BLUE}Starting frontend on port 3000...${NC}"
cd client && npx vite --port 3000 &
FRONTEND_PID=$!
cd ..

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Application is running!${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e "  Frontend:  ${BLUE}http://localhost:3000${NC}"
echo -e "  Backend:   ${BLUE}http://localhost:3001${NC}"
echo -e "  Login:     ${YELLOW}demo@example.com / password123${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "  ${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Handle shutdown
cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down...${NC}"
  kill $BACKEND_PID 2>/dev/null
  kill $FRONTEND_PID 2>/dev/null
  for PORT in 3000 3001; do
    PID=$(lsof -ti:$PORT 2>/dev/null)
    if [ ! -z "$PID" ]; then
      kill -9 $PID 2>/dev/null
    fi
  done
  echo -e "${GREEN}All services stopped.${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for both processes
wait
