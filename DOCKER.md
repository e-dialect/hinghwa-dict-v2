# Docker Deployment Guide

This guide explains how to run the Hinghwa Dictionary stack using Docker Compose.

## Architecture

The stack consists of:

1. **Pocketbase** - Backend database and API (Port 8090)
2. **Audio Service** - Audio synthesis microservice (Port 8001)
3. **Mobile App** - uni-app H5 development server (Port 3000)
4. **Web App** - Nuxt 3 web application (Port 3001)
5. **Nginx** - Reverse proxy (Ports 80/443, production only)

## Prerequisites

- Docker 20.10+ and Docker Compose 2.0+
- At least 4GB RAM available
- Ports 8090, 8001, 3000, 3001 available

## Quick Start

### Development Mode

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Edit .env and set secure values
nano .env

# 3. Start all services
docker-compose up -d

# 4. Check status
docker-compose ps

# 5. View logs
docker-compose logs -f
```

Services will be available at:
- Pocketbase Admin: http://localhost:8090/_/
- Pocketbase API: http://localhost:8090/api/
- Audio Service: http://localhost:8001/
- Mobile App (H5): http://localhost:3000/
- Web App: http://localhost:3001/

### Production Mode

```bash
# Start with production profile
docker-compose --profile production up -d

# This includes Nginx reverse proxy
```

## Individual Services

### Start Only Pocketbase

```bash
docker-compose up -d pocketbase
```

### Start Only Audio Service

```bash
docker-compose up -d audio-service
```

### Rebuild Services

```bash
# Rebuild all
docker-compose build

# Rebuild specific service
docker-compose build audio-service
```

## Initial Setup

### 1. Setup Pocketbase

First time setup:

```bash
# Access Pocketbase admin UI
open http://localhost:8090/_/

# Create admin account when prompted
```

### 2. Create Collections

Option A: Use admin UI to create collections manually following `pocketbase/SCHEMA.md`

Option B: Import collections (if you have a schema export):

```bash
# Export from existing instance
docker-compose exec pocketbase /pb/pocketbase admin export backup.zip

# Import to new instance
docker-compose exec pocketbase /pb/pocketbase admin import backup.zip
```

### 3. Add Phoneme Audio Files

Place phoneme MP3 files in `audio-service/phonemes/`:

```bash
mkdir -p audio-service/phonemes
# Copy your phoneme files here
# Files should be named like: heng1.mp3, hua2.mp3, etc.
```

### 4. Run Data Migration

If migrating from Django:

```bash
# Install dependencies
cd pocketbase/scripts
npm install

# Run migration
node migrate.js --step=all
```

See `pocketbase/scripts/migration_guide.md` for details.

## Configuration

### Environment Variables

Edit `.env` file:

```bash
# Pocketbase
POCKETBASE_ENCRYPTION_KEY=your-secret-key-here

# Audio Service
PHONEME_DIR=/app/phonemes
OUTPUT_DIR=/app/output

# Apps
NODE_ENV=development
POCKETBASE_URL=http://pocketbase:8090
AUDIO_SERVICE_URL=http://audio-service:8001
```

### Volumes

Data is persisted in:
- `pocketbase/pb_data/` - Pocketbase database and files
- `audio-service/output/` - Generated audio files
- `audio-service/phonemes/` - Phoneme source files

## Networking

Services communicate via the `hinghwa-network` bridge network:

- Services can reference each other by container name
- Example: `http://pocketbase:8090` from other containers
- External access via host ports

## Health Checks

All services have health checks:

```bash
# Check health status
docker-compose ps

# Services should show "healthy" status
```

## Troubleshooting

### Pocketbase Won't Start

```bash
# Check logs
docker-compose logs pocketbase

# Common issues:
# - Port 8090 already in use
# - Permissions on pb_data directory
# - Invalid encryption key
```

### Audio Service Errors

```bash
# Check logs
docker-compose logs audio-service

# Common issues:
# - Missing phoneme files
# - FFmpeg not installed (should be in Docker image)
# - Disk space for output files
```

### App Won't Connect to Pocketbase

```bash
# Verify network
docker network inspect hinghwa-dict-v2_hinghwa-network

# Check if services are on same network
# Ensure POCKETBASE_URL uses container name, not localhost
```

### Port Conflicts

```bash
# Find process using port
lsof -i :8090

# Kill process or change port in docker-compose.yml
```

## Maintenance

### Backup Data

```bash
# Backup Pocketbase
docker-compose exec pocketbase /pb/pocketbase admin backup /pb/pb_data/backups/

# Copy backup out
docker cp hinghwa-pocketbase:/pb/pb_data/backups/backup.zip ./backup.zip

# Backup audio files
tar -czf audio-backup.tar.gz audio-service/output/ audio-service/phonemes/
```

### Restore Data

```bash
# Stop services
docker-compose down

# Restore Pocketbase data
rm -rf pocketbase/pb_data
unzip backup.zip -d pocketbase/pb_data

# Restore audio files
tar -xzf audio-backup.tar.gz

# Restart
docker-compose up -d
```

### Update Services

```bash
# Pull latest images
docker-compose pull

# Rebuild custom services
docker-compose build

# Restart with new versions
docker-compose up -d
```

### Clean Up

```bash
# Stop and remove containers
docker-compose down

# Remove volumes (WARNING: deletes data)
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

## Monitoring

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f pocketbase

# Last 100 lines
docker-compose logs --tail=100
```

### Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df
```

## Production Deployment

### Security Checklist

- [ ] Change default encryption key
- [ ] Use strong admin password
- [ ] Configure firewall rules
- [ ] Enable HTTPS with SSL certificates
- [ ] Set up regular backups
- [ ] Configure rate limiting
- [ ] Review Pocketbase access rules
- [ ] Disable debug modes

### SSL/HTTPS

Place SSL certificates in `nginx/ssl/`:

```bash
nginx/ssl/
├── cert.pem
└── key.pem
```

Configure `nginx/nginx.conf` for HTTPS.

### Scaling

For high traffic:

```bash
# Scale audio service
docker-compose up -d --scale audio-service=3

# Use load balancer (Nginx/HAProxy)
# Add Redis for caching
# Use CDN for static files
```

## Development

### Local Development Without Docker

If you prefer not to use Docker:

```bash
# Start Pocketbase
cd pocketbase
./pocketbase serve

# Start Audio Service
cd audio-service
pip install -r requirements.txt
uvicorn main:app --reload

# Start Mobile App
cd apps/mobile
pnpm dev:h5

# Start Web App
cd apps/web
pnpm dev
```

### Hot Reload

Development containers have hot reload enabled:
- Code changes are reflected immediately
- No need to rebuild containers

## Support

For issues:
1. Check logs: `docker-compose logs`
2. Review documentation in `docs/`
3. Check GitHub issues
4. Pocketbase docs: https://pocketbase.io/docs/

## Next Steps

After setup:
1. Create admin account in Pocketbase
2. Import initial dialect data
3. Run data migration if applicable
4. Test API endpoints
5. Configure mobile/web apps
6. Add content and test features
