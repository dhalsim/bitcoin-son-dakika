# Bitcoin Son Dakika Admin Panel - Setup & Operations

## Quick Setup Guide

### 1. Add Initial Admin
```bash
# Add your pubkey as the first admin
wrangler kv:key put --binding=EDITOR_PUBKEYS "admin_pubkeys" '["YOUR_PUBKEY_HERE"]'
```

### 2. Environment Check
Ensure these are set in Cloudflare:
- `EDITOR_PUBKEYS` KV namespace binding

### 3. Build & Deploy
```bash
# Build with React Router v7 server builds
npm run build

# Deploy to Cloudflare Pages
wrangler pages deploy
```

### 4. Access Admin Panel
Direct URL: `https://yoursite.pages.dev/functions/admin`

**Note:** Requires Nostr browser extension for authentication.

## User Management via CLI

### Add Users
```bash
# Add admin users
wrangler kv:key put --binding=EDITOR_PUBKEYS "admin_pubkeys" '["pubkey1", "pubkey2"]'

# Add editor users  
wrangler kv:key put --binding=EDITOR_PUBKEYS "editor_pubkeys" '["pubkey1", "pubkey2"]'
```

### View Current Users
```bash
# Check current admins
wrangler kv:key get --binding=EDITOR_PUBKEYS "admin_pubkeys"

# Check current editors
wrangler kv:key get --binding=EDITOR_PUBKEYS "editor_pubkeys"
```

### Remove Users
```bash
# Get current list, remove user, then update
wrangler kv:key get --binding=EDITOR_PUBKEYS "admin_pubkeys"
# Copy output, remove unwanted pubkey, then:
wrangler kv:key put --binding=EDITOR_PUBKEYS "admin_pubkeys" '["remaining_pubkey1", "remaining_pubkey2"]'
```

## Features Status

### ✅ Currently Working
- **Nostr Authentication** (NIP-98)
- **Admin User Management** (add/remove admins & editors)
- **Deployment Triggers** 
- **Role-based Access Control**

### 🚧 Planned Features
- **Editor Content Publishing** (add news articles)
- **Personal Article Integration** (editor's own Nostr posts)

## Troubleshooting

### Can't Access Admin Panel
1. Check if you have a Nostr browser extension installed
2. Verify your pubkey is in the admin or editor list:
   ```bash
   wrangler kv:key get --binding=EDITOR_PUBKEYS "admin_pubkeys"
   ```
3. Check browser console for authentication errors

### Deployment Issues
```bash
# Check build status
npm run build

# Check wrangler configuration
wrangler whoami
wrangler pages project list
```

### KV Storage Issues
```bash
# List all KV keys
wrangler kv:key list --binding=EDITOR_PUBKEYS

# Check KV namespace binding in wrangler.toml
cat wrangler.toml
```

## Development

For architecture details, implementation phases, and development guidelines, see: **[ADMIN_IMPLEMENTATION_PLAN.md](./ADMIN_IMPLEMENTATION_PLAN.md)**

To modify the admin interface:
1. Edit components in `/src/server/admin.tsx`
2. Build with `npm run build` (React Router v7 handles server rendering)
3. Deploy with `wrangler pages deploy`
