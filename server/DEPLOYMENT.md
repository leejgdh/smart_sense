# SmartSense - Production Deployment Guide

## Overview

SmartSense uses Docker Compose for production deployment with modular configuration:
- **Core Services** (`docker-compose.yml`): PostgreSQL, MQTT, Backend, Frontend
- **Optional Services**: Nginx, Ollama (separate compose files)

## Prerequisites

- Docker Engine 20.10+
- Docker Compose v2.0+
- 2GB+ RAM available
- 10GB+ disk space

## Quick Start

### 1. Clone and Configure

```bash
cd server/backend
cp .env.example .env
# Edit .env with production values

# IMPORTANT: Configure Firebase credentials
# Get these from Firebase Console > Project Settings > Service Accounts
nano .env
```

Required Firebase configuration:
- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- `FIREBASE_CLIENT_EMAIL`: Service account email
- `FIREBASE_PRIVATE_KEY`: Service account private key (keep \n for newlines)

### 2. Start Core Services

```bash
# Start PostgreSQL, MQTT, Backend, Frontend
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 3. Initialize Database

```bash
# Access backend container
docker exec -it smartsense-backend sh

# Run Prisma migrations
npx prisma migrate deploy

# Setup TimescaleDB extension and hypertable
npx prisma db execute --file prisma/timescaledb-setup.sql

# Exit container
exit
```

Verify database:
```bash
docker exec -it smartsense-db psql -U smartsense -d smartsense -c "\dt"
docker exec -it smartsense-db psql -U smartsense -d smartsense -c "SELECT * FROM timescaledb_information.hypertables;"
```

## Optional Services

### Ollama AI Service

If you want AI-powered insights:

```bash
# Start Ollama
docker-compose -f docker-compose.ollama.yml up -d

# Pull AI model (inside container)
docker exec -it smartsense-ollama ollama pull phi3:mini

# Verify
curl http://localhost:11434/api/tags
```

**Note**: Requires GPU for optimal performance. Remove `deploy` section in `docker-compose.ollama.yml` for CPU-only mode.

### Nginx Reverse Proxy

If you need reverse proxy with SSL:

```bash
# Configure SSL certificates first
mkdir -p config/nginx/ssl
# Add your SSL certificates to config/nginx/ssl/

# Start Nginx
docker-compose -f docker-compose.nginx.yml up -d
```

## Architecture

```
┌─────────────────┐
│  Sensor Nodes   │
│  (Raspberry Pi) │
└────────┬────────┘
         │ MQTT (1883)
         v
┌─────────────────┐      ┌──────────────┐
│  MQTT Broker    │◄────►│  Backend API │
│  (Mosquitto)    │      │  (NestJS)    │
└─────────────────┘      └──────┬───────┘
                                │
                                v
                         ┌──────────────┐
                         │  PostgreSQL  │
                         │  TimescaleDB │
                         └──────────────┘
                                │
                                v
                         ┌──────────────┐
                         │   Frontend   │
                         │   (Next.js)  │
                         └──────────────┘
```

## Service Ports

| Service    | Port  | Description                |
|------------|-------|----------------------------|
| Frontend   | 3001  | Web UI                     |
| Backend    | 3000  | REST API                   |
| PostgreSQL | 5432  | Database                   |
| MQTT       | 1883  | MQTT Broker                |
| MQTT WS    | 9001  | MQTT WebSocket             |
| Ollama     | 11434 | AI Service (optional)      |
| Nginx HTTP | 80    | Reverse Proxy (optional)   |
| Nginx HTTPS| 443   | Reverse Proxy (optional)   |

## Environment Variables

Create `.env` file in `server/backend/` directory:

```bash
# Node Environment
NODE_ENV=production

# Server
PORT=3000

# Database (TimescaleDB)
DATABASE_URL=postgresql://smartsense:CHANGE_ME@localhost:5432/smartsense

# MQTT Broker
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_CLIENT_ID=smartsense-backend

# Ollama AI
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=phi3:mini

# Firebase Authentication (REQUIRED)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"

# CORS
CORS_ORIGIN=http://your-server-ip:5000

# Logging
LOG_LEVEL=info
```

**Important**:
- Change `CHANGE_ME` database password
- Configure Firebase credentials from Firebase Console
- Update `CORS_ORIGIN` with your frontend URL

## Common Operations

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f postgres
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Update Services

```bash
# Pull latest images
docker-compose pull

# Rebuild and restart
docker-compose up -d --build
```

### Database Backup

```bash
# Backup
docker exec smartsense-db pg_dump -U smartsense smartsense > backup_$(date +%Y%m%d).sql

# Restore
cat backup_20250101.sql | docker exec -i smartsense-db psql -U smartsense smartsense
```

### Database Schema Changes

```bash
# Access backend container
docker exec -it smartsense-backend sh

# Deploy migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# View schema in Prisma Studio (development only)
npx prisma studio
```

## Monitoring

### Health Checks

```bash
# Backend health
curl http://localhost:3000/health

# API documentation (Swagger)
curl http://localhost:3000/api/docs

# Ollama health (if running)
curl http://localhost:11434/api/tags

# Database connection
docker exec smartsense-db pg_isready -U smartsense

# TimescaleDB extension
docker exec smartsense-db psql -U smartsense -d smartsense -c "SELECT extname, extversion FROM pg_extension WHERE extname = 'timescaledb';"
```

### MQTT Monitoring

```bash
# Subscribe to all topics
docker exec smartsense-mqtt mosquitto_sub -t '#' -v

# System stats
docker exec smartsense-mqtt mosquitto_sub -t '$SYS/#' -v
```

## Troubleshooting

### Backend Can't Connect to Database

1. Check if PostgreSQL is running:
   ```bash
   docker-compose ps postgres
   ```

2. Check database logs:
   ```bash
   docker-compose logs postgres
   ```

3. Verify DATABASE_URL in backend:
   ```bash
   docker exec smartsense-backend env | grep DATABASE
   ```

### MQTT Connection Failed

1. Check Mosquitto logs:
   ```bash
   docker-compose logs mosquitto
   ```

2. Test MQTT connection:
   ```bash
   mosquitto_pub -h localhost -p 1883 -t test -m "hello"
   ```

### Container Won't Start

1. Check logs:
   ```bash
   docker-compose logs <service-name>
   ```

2. Check resource usage:
   ```bash
   docker stats
   ```

3. Clean up and restart:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

## Security Recommendations

1. **Change Default Passwords**: Update all passwords in `.env`
2. **Firebase Authentication**: Ensure Firebase credentials are properly configured
3. **API Security**: All endpoints are protected with Firebase JWT tokens
4. **Enable MQTT Authentication**: Configure `mosquitto.conf`
5. **Use SSL/TLS**: Enable HTTPS with Nginx
6. **Firewall Rules**: Only expose necessary ports
7. **Regular Updates**: Keep Docker images updated
8. **Backup Strategy**: Regular database backups
9. **Secure Firebase Keys**: Never commit `.env` file to version control

## Scaling

### Horizontal Scaling

For high traffic, consider:
- Multiple backend instances behind load balancer
- Database replication
- Separate MQTT cluster

### Vertical Scaling

Increase Docker resource limits in `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

## Maintenance

### Log Rotation

Docker handles log rotation automatically, but you can configure:

```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Cleanup

```bash
# Remove unused containers, networks, images
docker system prune -a

# Remove volumes (WARNING: deletes data)
docker-compose down -v
```

## Support

For issues or questions:
- GitHub Issues: https://github.com/your-org/smartsense/issues
- Documentation: See README.md
