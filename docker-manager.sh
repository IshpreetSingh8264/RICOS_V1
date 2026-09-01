#!/bin/bash

# RICOS Docker Setup Script
# This script helps you manage the Docker containers for the RICOS application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     RICOS Disaster Management System          ║${NC}"
echo -e "${GREEN}║           Docker Management Script            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed!${NC}"
    echo "Please install Docker from https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed!${NC}"
    echo "Please install Docker Compose from https://docs.docker.com/compose/install/"
    exit 1
fi

# Function to display menu
show_menu() {
    echo -e "${YELLOW}What would you like to do?${NC}"
    echo "1) Start all services (first time setup)"
    echo "2) Start all services (quick start)"
    echo "3) Stop all services"
    echo "4) Restart all services"
    echo "5) View logs (all services)"
    echo "6) View logs (specific service)"
    echo "7) Check service status"
    echo "8) Rebuild containers"
    echo "9) Clean up (remove containers and volumes)"
    echo "10) Run database migrations"
    echo "11) Access PostgreSQL shell"
    echo "0) Exit"
    echo ""
}

# Function to start services (first time)
check_port_5432_free() {
    if ss -ltn "sport = :5432" | tail -n +2 | grep -q .; then
        echo -e "${RED}Error: Port 5432 is already in use.${NC}"
        echo "Stop the process using port 5432, then try again."
        exit 1
    fi
}

# Function to start services (first time)
start_first_time() {
    check_port_5432_free
    echo -e "${GREEN}Starting services for the first time...${NC}"
    echo "This will:"
    echo "  - Build all Docker images"
    echo "  - Start PostgreSQL database"
    echo "  - Run database migrations"
    echo "  - Start all backend services"
    echo "  - Start frontend"
    echo ""
    
    docker-compose up -d --build postgres
    echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
    sleep 10
    
    echo -e "${GREEN}Running database migrations...${NC}"
    docker-compose run --rm backend_common npx prisma migrate deploy
    
    echo -e "${GREEN}Starting all services...${NC}"
    docker-compose up -d --build
    
    echo ""
    echo -e "${GREEN}✓ All services started successfully!${NC}"
    echo ""
    echo "Access your application at:"
    echo "  Frontend:         http://localhost:5173"
    echo "  Auth Backend:     http://localhost:3000"
    echo "  User Backend:     http://localhost:8080"
    echo "  Official Backend: http://localhost:8081"
    echo "  PostgreSQL:       localhost:5432"
    echo ""
}

# Function to start services (quick)
start_quick() {
    check_port_5432_free
    echo -e "${GREEN}Starting all services...${NC}"
    docker-compose up -d
    echo -e "${GREEN}✓ Services started!${NC}"
    echo ""
    show_urls
}

# Function to stop services
stop_services() {
    echo -e "${YELLOW}Stopping all services...${NC}"
    docker-compose down
    echo -e "${GREEN}✓ Services stopped!${NC}"
}

# Function to restart services
restart_services() {
    echo -e "${YELLOW}Restarting all services...${NC}"
    docker-compose restart
    echo -e "${GREEN}✓ Services restarted!${NC}"
}

# Function to view all logs
view_all_logs() {
    echo -e "${GREEN}Showing logs (press Ctrl+C to exit)...${NC}"
    docker-compose logs -f
}

# Function to view specific service logs
view_service_logs() {
    echo ""
    echo "Available services:"
    echo "  1) postgres"
    echo "  2) backend_common"
    echo "  3) backend_user"
    echo "  4) backend_official"
    echo "  5) frontend"
    echo ""
    read -p "Enter service number: " service_num
    
    case $service_num in
        1) SERVICE="postgres" ;;
        2) SERVICE="backend_common" ;;
        3) SERVICE="backend_user" ;;
        4) SERVICE="backend_official" ;;
        5) SERVICE="frontend" ;;
        *) echo -e "${RED}Invalid option${NC}"; return ;;
    esac
    
    echo -e "${GREEN}Showing logs for $SERVICE (press Ctrl+C to exit)...${NC}"
    docker-compose logs -f $SERVICE
}

# Function to check status
check_status() {
    echo -e "${GREEN}Service Status:${NC}"
    echo ""
    docker-compose ps
    echo ""
}

# Function to rebuild containers
rebuild_containers() {
    check_port_5432_free
    echo -e "${YELLOW}Rebuilding all containers...${NC}"
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    echo -e "${GREEN}✓ Containers rebuilt and started!${NC}"
}

# Function to clean up
cleanup() {
    echo -e "${RED}WARNING: This will remove all containers, images, and volumes!${NC}"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" = "yes" ]; then
        echo -e "${YELLOW}Cleaning up...${NC}"
        docker-compose down -v --rmi all
        echo -e "${GREEN}✓ Cleanup complete!${NC}"
    else
        echo "Cleanup cancelled."
    fi
}

# Function to run migrations
run_migrations() {
    echo -e "${GREEN}Running database migrations...${NC}"
    docker-compose run --rm backend_common npx prisma migrate deploy
    echo -e "${GREEN}✓ Migrations complete!${NC}"
}

# Function to access PostgreSQL
access_postgres() {
    echo -e "${GREEN}Accessing PostgreSQL shell...${NC}"
    echo "Database: ricos"
    echo "User: postgres"
    echo "Type 'exit' or press Ctrl+D to exit"
    echo ""
    docker-compose exec postgres psql -U postgres -d ricos
}

# Function to show URLs
show_urls() {
    echo "Access your application at:"
    echo "  Frontend:         http://localhost:5173"
    echo "  Auth Backend:     http://localhost:3000"
    echo "  User Backend:     http://localhost:8080"
    echo "  Official Backend: http://localhost:8081"
    echo "  PostgreSQL:       localhost:5432"
    echo ""
}

# Main menu loop
while true; do
    show_menu
    read -p "Enter your choice [0-11]: " choice
    echo ""
    
    case $choice in
        1) start_first_time ;;
        2) start_quick ;;
        3) stop_services ;;
        4) restart_services ;;
        5) view_all_logs ;;
        6) view_service_logs ;;
        7) check_status ;;
        8) rebuild_containers ;;
        9) cleanup ;;
        10) run_migrations ;;
        11) access_postgres ;;
        0) 
            echo -e "${GREEN}Goodbye!${NC}"
            exit 0
            ;;
        *) 
            echo -e "${RED}Invalid option. Please try again.${NC}"
            echo ""
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
    clear
done
