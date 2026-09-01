#!/bin/bash

# RICOS Docker Quick Launch Script
# Simple one-command startup with access instructions

set -e

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

clear

echo -e "${GREEN}${BOLD}"
echo "╔═══════════════════════════════════════════════════════╗"
echo "║          RICOS Disaster Management System            ║"
echo "║                 Docker Quick Launch                   ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker is not running!${NC}"
    echo "Please start Docker and try again."
    exit 1
fi

# Detect Docker Compose command (v1 or v2)
if docker compose version > /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose > /dev/null 2>&1; then
    DOCKER_COMPOSE="docker-compose"
else
    echo -e "${RED}❌ Error: Docker Compose is not installed!${NC}"
    exit 1
fi

# Check if this is first time
if ! docker volume ls | grep -q "ricos_proto_1_postgres_data"; then
    echo -e "${YELLOW}📦 First time setup detected...${NC}"
    echo ""
    echo "This will:"
    echo "  1. Build Docker images (may take 3-5 minutes)"
    echo "  2. Start PostgreSQL database"
    echo "  3. Run database migrations"
    echo "  4. Start all services"
    echo ""
    read -p "Continue? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
    
    echo ""
    echo -e "${BLUE}🔨 Building and starting services...${NC}"
    $DOCKER_COMPOSE up -d --build postgres
    
    echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
    sleep 15
    
    echo -e "${BLUE}🗃️  Running database migrations...${NC}"
    $DOCKER_COMPOSE run --rm backend_common npx prisma migrate deploy
    
    echo -e "${BLUE}🚀 Starting all services...${NC}"
    $DOCKER_COMPOSE up -d --build
else
    echo -e "${BLUE}🚀 Starting all services...${NC}"
    $DOCKER_COMPOSE up -d
fi

echo ""
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 5

# Check service status
echo ""
echo -e "${GREEN}✓ Services Status:${NC}"
$DOCKER_COMPOSE ps

echo ""
echo -e "${GREEN}${BOLD}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║                   🌐 ACCESS URLS                      ║${NC}"
echo -e "${GREEN}${BOLD}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}${BOLD}🖥️  FRONTEND (Main Application):${NC}"
echo -e "   ${GREEN}➜${NC} ${BOLD}http://localhost:5173${NC}"
echo ""
echo -e "${BLUE}${BOLD}🔧 BACKEND APIs:${NC}"
echo -e "   ${GREEN}➜${NC} Auth Service:     http://localhost:3000"
echo -e "   ${GREEN}➜${NC} User Service:     http://localhost:8080"
echo -e "   ${GREEN}➜${NC} Official Service: http://localhost:8081"
echo ""
echo -e "${BLUE}${BOLD}🗄️  DATABASE:${NC}"
echo -e "   ${GREEN}➜${NC} PostgreSQL: localhost:5432 (user: postgres, pass: 123)"
echo ""
echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}💡 Quick Commands:${NC}"
echo "   View logs:     $DOCKER_COMPOSE logs -f"
echo "   Stop services: $DOCKER_COMPOSE down"
echo "   Restart:       $DOCKER_COMPOSE restart"
echo ""
echo -e "${GREEN}✨ System is ready! Open your browser to get started.${NC}"
echo ""
