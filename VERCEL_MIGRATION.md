# Migration from Cloudflare Workers to Vercel Edge Functions

This document outlines the migration from Cloudflare Workers to Vercel Edge Functions for the Bitcoin Son Dakika project.

## Key Changes

### 1. Function Structure
- **Cloudflare Workers**: Used `onRequestGet()`, `onRequestPost()` functions
- **Vercel Edge Functions**: Use `GET()`, `POST()`, `OPTIONS()` exports

### 2. Environment Variables
- **Cloudflare Workers**: Accessed via `context.env`
- **Vercel Edge Functions**: Accessed via `process.env`

### 3. Request Handling
- **Cloudflare Workers**: Received `context` object with `request` and `env`
- **Vercel Edge Functions**: Receive `Request` object directly

## File Structure

```
api/
├── admin.ts              # Main admin API
├── deploy-trigger.ts     # Deployment trigger
├── types.ts              # TypeScript types
└── utils.ts              # Shared utilities
```

## Environment Variables

Set these in your Vercel project:

1. **MASTER_ADMIN_PRIVATEKEY**: Your master admin private key
2. **VERCEL_DEPLOY_HOOK_URL**: Vercel deployment webhook URL

## API Endpoints

### Admin API (`/api/admin`)
- `GET`: Fetch public admin data (no auth required)
- `POST`: Admin operations (requires NIP-98 auth)
- `OPTIONS`: CORS preflight

### Deploy Trigger (`/api/deploy-trigger`)
- `POST`: Trigger deployment (requires editor/admin role)
- `OPTIONS`: CORS preflight

### Debug API (`/api/debug-admin`)
- `GET`: Test Nostr sets fetching
- `POST`: Test authentication

## Deployment

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy to Vercel:
   ```bash
   vercel
   ```

3. Set environment variables in Vercel dashboard or via CLI:
   ```bash
   vercel env add MASTER_ADMIN_PRIVATEKEY
   vercel env add VERCEL_DEPLOY_HOOK_URL
   ```

## Testing

Test the endpoints:

```bash
# Test admin data fetching
curl https://your-domain.vercel.app/api/admin

# Test debug endpoint
curl https://your-domain.vercel.app/api/debug-admin

# Test with authentication
curl -X POST https://your-domain.vercel.app/api/admin \
  -H "Content-Type: application/json" \
  -H "Authorization: Nostr <your-nostr-auth-token>" \
  -d '{"action": "add-editor-pubkey", "pubkey": "test-pubkey"}'
```

## Differences from Cloudflare Workers

1. **Runtime**: Vercel Edge Functions use V8 isolates
2. **Cold Starts**: Generally faster than Cloudflare Workers
3. **Global Variables**: No `globalThis` context like Cloudflare Workers
4. **WebSocket Support**: Limited compared to Cloudflare Workers
5. **KV Storage**: Use Vercel KV instead of Cloudflare KV

## Nostr Integration

The functions maintain the same Nostr integration:
- NIP-98 authentication
- Nostr relay communication
- Event publishing and fetching
- User role management via Nostr sets

## Troubleshooting

1. **Environment Variables**: Ensure all required env vars are set in Vercel
2. **CORS**: CORS headers are included in all responses
3. **Authentication**: NIP-98 auth tokens must be valid and recent
4. **Relay Connectivity**: Check relay URLs and connectivity

## Next Steps

1. Deploy to Vercel
2. Test all endpoints
3. Update frontend to use new API URLs
4. Monitor performance and logs
5. Set up proper deployment webhooks 