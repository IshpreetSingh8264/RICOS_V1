# 🚀 RICOS Docker Quick Start Guide

## Prerequisites Check
```bash
# Verify Docker installation
docker --version
docker-compose --version

# Check available ports
sudo lsof -i :3000,5173,5432,8080,8081
```

## 🎯 First Time Setup (5 minutes)

### Step 1: Navigate to project directory
```bash
cd /home/jaiveer/Desktop/GNE_HACK/RICOS_PROTO_1
```

### Step 2: Run the setup script
```bash
./docker-manager.sh
```

### Step 3: Select option 1
- This will build all images (~3-5 minutes)
- Start PostgreSQL database
- Run migrations automatically
- Start all services

### Step 4: Access the application
Open your browser:
- Frontend: http://localhost:5173
- Backend APIs: 3000, 8080, 8081

## 🏃 Daily Usage

### Starting the system
```bash
./docker-manager.sh
# Select option 2 (Quick start)
```

Or manually:
```bash
docker-compose up -d
```

### Stopping the system
```bash
./docker-manager.sh
# Select option 3 (Stop)
```

Or manually:
```bash
docker-compose down
```

### Viewing logs
```bash
./docker-manager.sh
# Select option 5 or 6
```

Or manually:
```bash
docker-compose logs -f
```

## 🛠️ Development Mode (with hot reload)

For active development with auto-reload on code changes:

```bash
# Start in development mode
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop
docker-compose -f docker-compose.dev.yml down
```

## 📊 Health Check

Verify all services are running:
```bash
docker-compose ps

# Should show:
# ricos_postgres          running
# ricos_backend_common    running (healthy)
# ricos_backend_user      running (healthy)
# ricos_backend_official  running (healthy)
# ricos_frontend          running (healthy)
```

Test endpoints:
```bash
curl http://localhost:5173/health  # Frontend
curl http://localhost:3000/health  # Auth backend
curl http://localhost:8080/health  # User backend
curl http://localhost:8081/health  # Official backend
```

## 🔧 Common Operations

### Database migrations
```bash
docker-compose run --rm backend_common npx prisma migrate deploy
```

### Access database shell
```bash
docker-compose exec postgres psql -U postgres -d ricos
```

### Rebuild after code changes
```bash
# Backend
docker-compose up -d --build backend_common

# Frontend
docker-compose up -d --build frontend
```

### View specific service logs
```bash
docker-compose logs -f backend_user
docker-compose logs -f frontend
```

## ❌ Troubleshooting

### Port already in use
```bash
# Find process using port
sudo lsof -i :5173
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>
```

### Database connection failed
```bash
# Restart PostgreSQL
docker-compose restart postgres

# Wait 10 seconds, then restart backends
docker-compose restart backend_common backend_user backend_official
```

### Services not starting
```bash
# Check logs for errors
docker-compose logs

# Complete restart
docker-compose down
docker-compose up -d
```

### Clean slate (nuclear option)
```bash
./docker-manager.sh
# Select option 9 (Clean up)
# Then option 1 (First time setup)
```

## 📁 Project Structure

```
RICOS_PROTO_1/
├── docker-compose.yml          # Production configuration
├── docker-compose.dev.yml      # Development configuration
├── docker-manager.sh           # Interactive management tool
├── DOCKER_README.md            # Detailed documentation
├── DOCKER_QUICK_START.md       # This file
├── .env.example                # Environment template
├── BE/
│   ├── Dockerfile              # Production backend image
│   ├── Dockerfile.dev          # Development backend image
│   └── ...
└── FE/
    ├── Dockerfile              # Production frontend image
    ├── Dockerfile.dev          # Development frontend image
    ├── nginx.conf              # Nginx configuration
    └── ...
```

## 🎓 Tips

1. **Use docker-manager.sh** for all operations - it's user-friendly
2. **Development mode** (`docker-compose.dev.yml`) auto-reloads on code changes
3. **Production mode** (`docker-compose.yml`) is optimized for performance
4. **Check logs** first when debugging issues
5. **Keep PostgreSQL data** even after `docker-compose down` (uses volumes)

## 🔗 URLs Reference

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | React application |
| Auth API | http://localhost:3000 | Authentication & JWT |
| User API | http://localhost:8080 | User/News/Map endpoints |
| Official API | http://localhost:8081 | NGO/Govt/Volunteer |
| PostgreSQL | localhost:5432 | Database (postgres/123) |

## 📞 Need Help?

1. Check service status: `docker-compose ps`
2. View logs: `docker-compose logs [service]`
3. Restart service: `docker-compose restart [service]`
4. Complete reset: `docker-compose down -v && docker-compose up -d`

---

**Happy Coding! 🎉**
