# Pocketbase Backend for Hinghwa Dictionary

This directory contains the Pocketbase backend configuration and scripts for the multi-dialect dictionary system.

## Directory Structure

```
pocketbase/
├── pb_data/              # Pocketbase data directory (created at runtime, gitignored)
├── pb_migrations/        # Database migration files
├── pb_hooks/             # JavaScript/TypeScript hooks for custom logic
├── scripts/              # Utility scripts for setup and migration
├── SCHEMA.md             # Detailed schema documentation
├── README.md             # This file
└── pocketbase            # Pocketbase executable (download separately)
```

## Setup

### 1. Download Pocketbase

Download the appropriate Pocketbase executable for your system from https://pocketbase.io/docs/

```bash
# For Linux (example)
cd pocketbase
wget https://github.com/pocketbase/pocketbase/releases/download/v0.22.0/pocketbase_0.22.0_linux_amd64.zip
unzip pocketbase_0.22.0_linux_amd64.zip
chmod +x pocketbase

# For macOS (example)
# Download from https://pocketbase.io/docs/ and place the executable here
```

### 2. Initialize Collections

Use the provided migration scripts or manually create collections through the admin UI:

```bash
./pocketbase serve
```

Then visit `http://127.0.0.1:8090/_/` to access the admin UI.

#### Option A: Import Collections via Admin UI
1. Go to Settings > Import collections
2. Use the JSON schema from `scripts/collections.json`

#### Option B: Run Migration Scripts
Collections will be automatically created when you start Pocketbase with the migration files in `pb_migrations/`.

### 3. Create Admin Account

On first run, Pocketbase will prompt you to create an admin account.

### 4. Configure Environment

Create a `.env` file in the pocketbase directory:

```env
# API Configuration
PB_HOST=0.0.0.0
PB_PORT=8090

# Security
PB_ENCRYPTION_KEY=your-secret-encryption-key-here

# File Storage
PB_MAX_UPLOAD_SIZE=10485760  # 10MB in bytes

# Email (for verification and notifications)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=your-email@example.com
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@example.com
```

## Running Pocketbase

### Development Mode

```bash
./pocketbase serve
```

This starts the server at `http://127.0.0.1:8090`

### Production Mode

```bash
./pocketbase serve --http="0.0.0.0:8090"
```

### With Custom Data Directory

```bash
./pocketbase serve --dir=/path/to/data
```

## API Endpoints

Once running, the API is available at:

```
Base URL: http://127.0.0.1:8090/api/
```

### Key Endpoints

- `/api/collections/{collection}/records` - CRUD operations
- `/api/collections/users/auth-with-password` - Login
- `/api/collections/users/auth-refresh` - Refresh token
- `/api/collections/users/request-verification` - Request email verification
- `/api/files/{collection}/{record}/{filename}` - File access

### Example Requests

```javascript
// Search words
GET /api/collections/words/records?filter=(word~'兴化')&expand=dialect,contributor

// Get character pronunciations
GET /api/collections/character_pronunciations/records?filter=(character='abc123')&expand=character,dialect

// Create pronunciation
POST /api/collections/pronunciations/records
Body: {
  "content": "兴化",
  "ipa": "hiŋ˥˧hua˥˧",
  "dialect": "dialect_id",
  "audio": file,
  "contributor": "user_id"
}
```

## Hooks and Custom Logic

Place TypeScript/JavaScript files in `pb_hooks/` for:

- Custom authentication logic
- Data validation
- Business logic
- Event handlers
- Scheduled tasks

Example hook structure:

```javascript
// pb_hooks/main.pb.js
onRecordAfterCreateRequest((e) => {
  // Custom logic after record creation
  if (e.collection.name === "pronunciations") {
    // Award points to user
    // Update contribution count
    // Send notification
  }
}, "pronunciations")
```

## Data Migration

See `scripts/migration_guide.md` for detailed instructions on migrating data from the old Django backend.

### Migration Steps

1. Export data from Django database
2. Transform data to match new schema
3. Import data using provided scripts
4. Verify data integrity
5. Update file URLs and references

## Type Generation

Generate TypeScript types from your Pocketbase schema:

```bash
cd ../packages/services
pnpm typegen
```

This will generate types in `packages/services/types/pocketbase.ts`

## Backup and Restore

### Backup

```bash
./pocketbase admin backup
```

This creates a backup in `pb_data/backups/`

### Restore

```bash
./pocketbase admin restore backup_file.zip
```

## Security Considerations

1. **API Rules**: Configure collection rules properly in the admin UI
2. **CORS**: Configure CORS settings for your frontend domains
3. **Rate Limiting**: Consider using a reverse proxy (nginx) for rate limiting
4. **File Upload**: Validate file types and sizes
5. **Input Validation**: Implement validation in hooks
6. **Authentication**: Use JWT tokens with appropriate expiration

## Monitoring

Pocketbase includes built-in logging. Monitor logs for:

- Failed authentication attempts
- API errors
- Performance issues
- Storage usage

## Common Issues

### Port Already in Use

```bash
# Kill process on port 8090
lsof -ti:8090 | xargs kill -9
```

### Database Locked

Stop all Pocketbase instances and restart:

```bash
./pocketbase serve
```

### Migration Errors

Delete `pb_data` and start fresh (development only):

```bash
rm -rf pb_data
./pocketbase serve
```

## Resources

- [Pocketbase Documentation](https://pocketbase.io/docs/)
- [Pocketbase JavaScript SDK](https://github.com/pocketbase/js-sdk)
- [Pocketbase TypeScript](https://github.com/pocketbase/js-sdk#auto-cancellation)
- [Schema Documentation](./SCHEMA.md)

## Contributing

When adding new collections or modifying the schema:

1. Update `SCHEMA.md` with the changes
2. Create a migration file if needed
3. Update TypeScript types: `pnpm typegen`
4. Update API documentation
5. Test thoroughly before deploying
