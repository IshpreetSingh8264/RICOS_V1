# RICOS Docker Setup

This directory contains Docker configuration for running the entire RICOS Disaster Management System in containers.

## 🐳 Architecture

The Docker setup includes:
- **PostgreSQL Database** (Port 5432)
- **Backend Common Service** - Auth/JWT (Port 3000)
- **Backend User Service** - User APIs (Port 8080)
- **Backend Official Service** - NGO/Govt/Volunteer APIs (Port 8081)
- **Frontend** - React/Vite Application (Port 5173)

All services communicate through a Docker bridge network named `ricos_network`, allowing them to reference each other by service name as if they were on localhost.

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose V2+
- At least 4GB RAM available for Docker
- Ports 3000, 5173, 5432, 8080, 8081 available

## 🚀 Quick Start

### Option 1: Using the Management Script (Recommended)

```bash
# Make the script executable (first time only)
chmod +x docker-manager.sh

# Run the interactive menu
./docker-manager.sh
```

Select option **1** for first-time setup, which will:
1. Build all Docker images
2. Start PostgreSQL
3. Run database migrations
4. Start all services

### Option 2: Manual Docker Compose Commands

```bash
# First time setup
docker-compose up -d --build postgres
sleep 10  # Wait for PostgreSQL to be ready
docker-compose run --rm backend_common npx prisma migrate deploy
docker-compose up -d --build

# Subsequent starts
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f
```

## 🌐 Access URLs

After starting the services:

- **Frontend**: http://localhost:5173
- **Auth API**: http://localhost:3000
- **User Backend**: http://localhost:8080  
- **Official Backend**: http://localhost:8081
- **PostgreSQL**: localhost:5432 (user: postgres, password: 123, database: ricos)

## 📦 Services Configuration

### PostgreSQL (postgres)
- Image: `postgres:16-alpine`
- Database: `ricos`
- Credentials: postgres/123
- Data persistence: Docker volume `postgres_data`

### Backend Services
All backend services are built from the same Dockerfile but run different entry points:
- **Common**: `node dist/apps/common/main.js`
- **User**: `node dist/apps/user_backend/main.js`
- **Official**: `node dist/apps/official_backend/main.js`

Environment variables are configured in `docker-compose.yml`.

### Frontend
- Built with multi-stage Dockerfile
- Served by Nginx
- Includes reverse proxy rules for API calls
- Static assets cached for 1 year

## 🔧 Management Commands

### Using docker-manager.sh

```bash
./docker-manager.sh
```

Menu options:
1. **Start all services (first time)** - Complete setup with migrations
2. **Start all services (quick)** - Start existing containers
3. **Stop all services** - Graceful shutdown
4. **Restart all services** - Restart without rebuilding
5. **View logs (all)** - Tail all service logs
6. **View logs (specific)** - Tail single service logs
7. **Check status** - Show running containers
8. **Rebuild containers** - Fresh build from scratch
9. **Clean up** - Remove everything (containers, volumes, images)
10. **Run migrations** - Execute Prisma migrations
11. **PostgreSQL shell** - Access database CLI

### Manual Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f [service_name]

# Rebuild specific service
docker-compose build [service_name]

# Execute command in running container
docker-compose exec backend_common sh

# Run migrations
docker-compose run --rm backend_common npx prisma migrate deploy

# Access PostgreSQL
docker-compose exec postgres psql -U postgres -d ricos

# Scale services (if needed)
docker-compose up -d --scale backend_user=2
```

## 🔍 Troubleshooting

### Services won't start
```bash
# Check logs for errors
docker-compose logs

# Verify ports are available
sudo lsof -i :3000
sudo lsof -i :5173
sudo lsof -i :5432
sudo lsof -i :8080
sudo lsof -i :8081
```

### Database connection issues
```bash
# Ensure PostgreSQL is healthy
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Verify migrations ran
docker-compose run --rm backend_common npx prisma migrate status
```

### Frontend can't reach backend
- Check if backend services are running: `docker-compose ps`
- Verify network connectivity: `docker network inspect ricos_network`
- Check Nginx proxy configuration in `FE/nginx.conf`

### Prisma schema changes
```bash
# After modifying schema.prisma
docker-compose run --rm backend_common npx prisma migrate dev --name your_migration_name

# Or for production
docker-compose run --rm backend_common npx prisma migrate deploy
```

### Complete reset
```bash
# Nuclear option - removes everything
docker-compose down -v --rmi all
rm -rf BE/node_modules FE/node_modules
./docker-manager.sh
# Select option 1 (first time setup)
```

## 🏗️ Development Workflow

### Making code changes

**Backend changes:**
```bash
# Edit code in BE/ directory
docker-compose restart backend_common  # or backend_user, backend_official
# Or rebuild if needed
docker-compose up -d --build backend_common
```

**Frontend changes:**
```bash
# Edit code in FE/ directory
docker-compose up -d --build frontend
```

**Database schema changes:**
```bash
# Edit BE/prisma/schema.prisma
docker-compose run --rm backend_common npx prisma migrate dev --name your_change
docker-compose restart backend_common backend_user backend_official
```

### Viewing real-time logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend_user

# Last 100 lines
docker-compose logs --tail=100 frontend
```

## 🔐 Environment Variables

Environment variables are defined in `docker-compose.yml`. For sensitive data, create a `.env` file:

```env
# .env file (create in project root)
PERPLEXITY_API_KEY=your_key_here
OPENROUTER_API_KEY=your_key_here
JWT_SECRET=your_secret_here
POSTGRES_PASSWORD=your_password_here
```

Then reference in docker-compose.yml:
```yaml
environment:
  PERPLEXITY_API_KEY: ${PERPLEXITY_API_KEY}
```

## 📊 Monitoring

### Health checks
All services have health checks configured:
```bash
# Check health status
docker-compose ps

# Manually test endpoints
curl http://localhost:3000/health
curl http://localhost:8080/health  
curl http://localhost:8081/health
curl http://localhost:5173/health
```

### Resource usage
```bash
# View resource consumption
docker stats

# View specific container
docker stats ricos_frontend
```

## 🔄 Updates and Maintenance

### Updating dependencies

**Backend:**
```bash
# Update package.json
cd BE
npm update

# Rebuild containers
docker-compose up -d --build backend_common backend_user backend_official
```

**Frontend:**
```bash
# Update package.json
cd FE
npm update

# Rebuild container
docker-compose up -d --build frontend
```

### Database backups
```bash
# Backup database
docker-compose exec postgres pg_dump -U postgres ricos > backup_$(date +%Y%m%d).sql

# Restore database
docker-compose exec -T postgres psql -U postgres ricos < backup_20231116.sql
```

## 🚀 Production Deployment

For production, consider:

1. **Use production environment variables**
2. **Enable HTTPS with reverse proxy (Nginx/Traefik)**
3. **Set up automated backups**
4. **Configure log aggregation**
5. **Use Docker secrets for sensitive data**
6. **Set resource limits** in docker-compose.yml:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '0.5'
         memory: 512M
   ```

## 📝 File Structure

```
RICOS_PROTO_1/
├── docker-compose.yml          # Main orchestration file
├── docker-manager.sh           # Interactive management script
├── .env                        # Environment variables (create this)
├── BE/
│   ├── Dockerfile              # Backend container definition
│   ├── .dockerignore          # Files to exclude from build
│   └── ...                     # Backend source code
└── FE/
    ├── Dockerfile              # Frontend container definition
    ├── nginx.conf              # Nginx reverse proxy config
    ├── .dockerignore          # Files to exclude from build
    └── ...                     # Frontend source code
```

## 🆘 Support

If you encounter issues:
1. Check service logs: `docker-compose logs [service]`
2. Verify all containers are running: `docker-compose ps`
3. Check Docker resources: `docker stats`
4. Ensure ports aren't in use: `sudo lsof -i :[port]`
5. Try a clean rebuild: `./docker-manager.sh` → option 8

## 📄 License

Part of the RICOS Disaster Management System.
