#!/bin/bash

# Exit immediately if a command exits with a non-zero status. We will disable it when checking explicitly.
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting RICOS Application Stack...${NC}"

is_port_5432_in_use() {
    if command -v ss &> /dev/null; then
        ss -ltnH "sport = :5432" | grep -q .
        return $?
    fi

    if command -v netstat &> /dev/null; then
        netstat -ltn 2>/dev/null | grep -q ":5432 "
        return $?
    fi

    return 1
}

start_postgres_container() {
    if command -v docker-compose &> /dev/null; then
        docker-compose up -d postgres
    else
        docker compose up -d postgres
    fi
}

# 1. Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker and try again.${NC}"
    exit 1
fi

# 2. Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo -e "${RED}Docker daemon is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# 3. Start PostgreSQL via Docker Compose if not running
echo -e "${YELLOW}Checking Database Container (ricos_db)...${NC}"
# Temporarily disable exit on error for the check
set +e
CONTAINER_RUNNING=$(docker ps -q -f name=^/ricos_db$)
DB_PORT_PUBLISHED=$(docker port ricos_db 5432/tcp 2>/dev/null)
set -e

if [ -n "$CONTAINER_RUNNING" ]; then
    if [ -n "$DB_PORT_PUBLISHED" ]; then
        echo -e "${GREEN}Database container 'ricos_db' is already running on localhost:5432.${NC}"
    else
        echo -e "${YELLOW}Database container is running but not published on host port 5432. Recreating it...${NC}"
        docker rm -f ricos_db

        if is_port_5432_in_use; then
            echo -e "${RED}Port 5432 is already in use. Refusing to start database container.${NC}"
            echo "Stop the process using port 5432 and run ./run-app.sh again."
            exit 1
        fi

        start_postgres_container
    fi
else
    if is_port_5432_in_use; then
        echo -e "${RED}Port 5432 is already in use. Refusing to start database container.${NC}"
        echo "Stop the process using port 5432 and run ./run-app.sh again."
        exit 1
    fi

    echo -e "${YELLOW}Starting database container...${NC}"
    start_postgres_container
fi

# 4. Wait for PostgreSQL to be ready
echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
RETRIES=30
set +e
docker exec ricos_db pg_isready -U postgres -d ricos > /dev/null 2>&1
READY_STATUS=$?
until [ $READY_STATUS -eq 0 ] || [ $RETRIES -eq 0 ]; do
  echo "Waiting for postgres server, $((RETRIES--)) remaining attempts..."
  sleep 1
  docker exec ricos_db pg_isready -U postgres -d ricos > /dev/null 2>&1
  READY_STATUS=$?
done
set -e

if [ $RETRIES -eq 0 ]; then
  echo -e "${RED}Failed to connect to PostgreSQL database.${NC}"
  exit 1
fi
echo -e "${GREEN}PostgreSQL is ready!${NC}"

# 5. Setup and start Backend
echo -e "${YELLOW}Setting up Backend...${NC}"
cd BE

echo "Setting up Python virtual environment..."
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}python3 is not installed. Please install Python 3 and try again.${NC}"
    exit 1
fi

if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi

if [ ! -f ".venv/bin/activate" ]; then
    echo -e "${RED}Failed to create Python virtual environment at BE/.venv.${NC}"
    exit 1
fi

# Activate venv so backend child processes can use it
# shellcheck disable=SC1091
source .venv/bin/activate

if ! python -m pip --version &> /dev/null; then
    echo -e "${RED}pip is not available inside BE/.venv. Please check your Python installation.${NC}"
    exit 1
fi

if [ -f "requirements.txt" ]; then
    set +e
    python -m pip install -r requirements.txt
    PIP_STATUS=$?
    if [ $PIP_STATUS -ne 0 ]; then
        echo -e "${YELLOW}Retrying Python dependency install...${NC}"
        python -m pip install -r requirements.txt
        PIP_STATUS=$?
    fi
    set -e

    if [ $PIP_STATUS -ne 0 ]; then
        echo -e "${RED}Failed to install Python dependencies from BE/requirements.txt.${NC}"
        exit 1
    fi
fi

echo "Installing Backend Dependencies (if any)..."
npm install --no-fund --no-audit

echo "Generating Prisma Client and applying migrations..."
npx prisma generate
npx prisma migrate deploy

echo "Starting Backend Microservices (in background)..."
npm run start:all &
BE_PID=$!
cd ..

# 6. Setup and start Frontend
echo -e "${YELLOW}Setting up Frontend...${NC}"
cd FE
echo "Installing Frontend Dependencies (if any)..."
npm install --no-fund --no-audit

echo "Starting Frontend (in background)..."
npm run dev &
FE_PID=$!
cd ..

echo -e "${GREEN}===============================================${NC}"
echo -e "${GREEN}RICOS Application Stack is currently starting!${NC}"
echo -e "${GREEN}Frontend will be accessible at usually http://localhost:5173${NC}"
echo -e "${GREEN}Backend microservices are running.${NC}"
echo -e "${GREEN}Database is running in Docker.${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all services.${NC}"
echo -e "${GREEN}===============================================${NC}"

# Handle termination gracefully
cleanup() {
    echo -e "\n${YELLOW}Stopping services...${NC}"
    kill $BE_PID 2>/dev/null || true
    kill $FE_PID 2>/dev/null || true
    echo -e "${GREEN}All local services stopped.${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for background processes to keep script running
wait $BE_PID
wait $FE_PID
