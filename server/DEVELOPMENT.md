# SmartSense Backend - Local Development Guide

## Prerequisites

- Node.js 20+ and npm
- Docker Desktop (for PostgreSQL, MQTT, Ollama)
- Git

## Development Setup

### 1. Start Infrastructure Services (Docker)

Start PostgreSQL and MQTT Broker using Docker:

```bash
cd server
docker-compose -f docker-compose.dev.yml up -d
```

This will start:
- **PostgreSQL** with TimescaleDB on port **5432**
- **Mosquitto** MQTT Broker on port **1883**

Check if services are running:
```bash
docker-compose -f docker-compose.dev.yml ps
```

Stop services:
```bash
docker-compose -f docker-compose.dev.yml down
```

### 2. Backend Setup

Navigate to backend directory:
```bash
cd server/backend
```

Install dependencies:
```bash
npm install
```

**Note**: `zeroconf` package is optional and may fail on Windows. This is expected and won't affect development.

Configure environment variables:
```bash
# Copy example env file
cp .env.example .env

# Configure Firebase credentials in .env:
# FIREBASE_PROJECT_ID=your-firebase-project-id
# FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Other settings are already configured for local development:
# DATABASE_URL=postgresql://smartsense:changeme@localhost:5432/smartsense
# MQTT_BROKER_URL=mqtt://localhost:1883
# OLLAMA_URL=http://localhost:11434
```

**Firebase Setup:**
1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate New Private Key"
3. Copy values from the JSON file to .env

Generate Prisma Client:
```bash
npx prisma generate
```

Run database migrations:
```bash
npx prisma migrate dev
```

Setup TimescaleDB (first time only):
```bash
npx prisma db execute --file prisma/timescaledb-setup.sql
```

Start backend in development mode:
```bash
npm run start:dev
```

The backend will be available at:
- **API**: http://localhost:3000
- **Swagger Documentation**: http://localhost:3000/api/docs

**Testing API with Swagger:**
1. Open http://localhost:3000/api/docs
2. Click "Authorize" button (top right)
3. Get Firebase ID Token:
   ```javascript
   // In browser console (if you have Firebase initialized)
   firebase.auth().currentUser.getIdToken().then(token => console.log(token))
   ```
4. Paste the token (without "Bearer " prefix)
5. Click "Authorize"
6. Now you can test any API endpoint

### 3. Sensor Node Setup (for testing)

Navigate to sensor-node directory:
```bash
cd sensor-node
```

Create Python virtual environment:
```bash
python -m venv venv
```

Activate virtual environment:
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

Install dependencies:
```bash
# For development (Windows/Mac without GPIO)
pip install -r requirements-dev.txt

# For production (Raspberry Pi)
pip install -r requirements.txt
```

Configure sensor node:
```yaml
# sensor-node/config.yaml
mode: "dev"  # Use dev mode for Windows development

mqtt:
  broker_host: "localhost"
  broker_port: 1883
```

Run sensor node:
```bash
python main.py
```

## Useful Commands

### Database

```bash
# Open Prisma Studio (Database GUI)
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Create new migration
npx prisma migrate dev --name <migration_name>

# Deploy migrations (production)
npx prisma migrate deploy

# Generate Prisma Client after schema changes
npx prisma generate

# View database directly
docker exec -it smartsense-db-dev psql -U smartsense -d smartsense

# Check TimescaleDB extension
docker exec -it smartsense-db-dev psql -U smartsense -d smartsense -c "SELECT extname, extversion FROM pg_extension WHERE extname = 'timescaledb';"

# View hypertables
docker exec -it smartsense-db-dev psql -U smartsense -d smartsense -c "SELECT * FROM timescaledb_information.hypertables;"
```

### MQTT

```bash
# Subscribe to all topics
mosquitto_sub -h localhost -t '#' -v

# Publish test message
mosquitto_pub -h localhost -t 'smartsense/test/status' -m '{"status":"online"}'

# View MQTT logs
docker logs smartsense-mqtt-dev -f
```

### Backend

```bash
# Start with hot-reload
npm run start:dev

# Build for production
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

### Docker Services

```bash
# Start services
docker-compose -f docker-compose.dev.yml up -d

# Stop services
docker-compose -f docker-compose.dev.yml down

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Restart a service
docker-compose -f docker-compose.dev.yml restart postgres
```

## Testing Data Flow

1. **Start infrastructure**: `docker-compose -f docker-compose.dev.yml up -d`
2. **Start backend**: `npm run start:dev` in `server/backend`
3. **Check Swagger**: Open http://localhost:3000/api/docs
4. **Start sensor node**: `python main.py` in `sensor-node`
5. **Check logs**: Backend should show "Received sensor data from [node_id]"
6. **View data**: Open Prisma Studio with `npx prisma studio`
7. **Test chart API** (with authentication):
   ```bash
   # Get Firebase token first
   TOKEN="your-firebase-id-token"

   curl -H "Authorization: Bearer $TOKEN" \
     "http://localhost:3000/api/sensors/nodes/sensor-node-01/chart?hours=24&points=100"
   ```

## Troubleshooting

### Port Already in Use

If ports 5432, 1883, or 3000 are already in use:

1. Stop conflicting services
2. Or change ports in `.env` file:
   ```
   POSTGRES_PORT=5433
   MQTT_PORT=1884
   PORT=3001
   ```

### Database Connection Failed

Check if PostgreSQL is running:
```bash
docker ps | grep smartsense-db-dev
```

Test connection:
```bash
docker exec -it smartsense-db-dev psql -U smartsense -d smartsense -c "SELECT version();"
```

### MQTT Connection Failed

Check if Mosquitto is running:
```bash
docker ps | grep smartsense-mqtt-dev
```

Test MQTT:
```bash
mosquitto_sub -h localhost -p 1883 -t test
```

### Prisma Migration Failed

1. Check database is running
2. Verify DATABASE_URL in .env
3. Try resetting: `npx prisma migrate reset`
4. If TimescaleDB setup fails: `npx prisma db execute --file prisma/timescaledb-setup.sql`

### Chart API Returns Empty Data

1. Check if sensor node is sending data
2. Verify data exists: `npx prisma studio`
3. Check TimescaleDB hypertable is created:
   ```bash
   docker exec -it smartsense-db-dev psql -U smartsense -d smartsense -c "SELECT * FROM timescaledb_information.hypertables;"
   ```

## Production Deployment

For production deployment, use the main docker-compose.yml:

```bash
docker-compose up -d
```

This will run all services in Docker containers.
