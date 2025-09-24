# Redis Caching Strategy for Blossom Protocol

## Overview

Our Redis caching system optimizes Blossom server operations by maintaining server health status, blob availability, and server lists. This ensures fast blob retrieval and efficient server failover.

## Redis Keys Structure

### 1. Server Health & Availability

#### `blossom:last-good:<sha256>` → `<serverUrl>`

- **Purpose**: Stores the last working server for a specific blob
- **TTL**: None (persistent until server fails)
- **Updated**: On successful blob fetch/upload/mirror
- **Cleared**: When that server fails or blob is deleted from it
- **Rationale**: Immutable blobs don't change, so working servers stay working

#### `blossom:bad:<sha256>:<server>` → `"1"`

- **Purpose**: Flags a server as unhealthy for a specific blob
- **TTL**: None (persistent until server succeeds)
- **Set**: When server returns non-2xx for blob operations
- **Cleared**: On successful operations or when marked as good
- **Rationale**: Failed servers stay failed until they work again

### 2. Server Lists & Configuration

#### `blossom:cached-servers` → `JSON.stringify(servers[])`

- **Purpose**: Fallback server list when Nostr `kind:10063` is unavailable
- **TTL**: 7 days (`60 * 60 * 24 * 7`)
- **Updated**: When admins update Blossom server list via `handleUpdateBlossomServers`
- **Used**: As final fallback in `api/file.ts` when user servers aren't available

#### `blossom-blob-list-<server>` → `JSON.stringify(BlobDescriptor[])`

- **Purpose**: Caches blob lists from individual servers
- **TTL**: None (persistent until invalidated)
- **Updated**: On successful `/list` operations
- **Cleared**: On upload/mirror/delete operations to that server
- **Rationale**: Blob lists are immutable until new operations occur

### 4. Aggregate File List Cache (for `/api/file/list`)

#### `blossom:list:aggregate` → `JSON.stringify(BlobListItem[])`

- **Purpose**: Caches the final response of `/api/file/list` to avoid re-merging per-server lists on every request
- **TTL**: None (persistent until invalidated)
- **Updated**: On demand when `/api/file/list` is requested and the key is missing
- **Cleared**: Whenever any `blossom-blob-list-<server>` is updated/cleared (upload, mirror, delete), so the next request rebuilds the aggregate
- **Rationale**: Centralized, coherent cache with simple invalidation

### 3. Blob Metadata

#### `blossom:blurhash:<sha256>` → `JSON.stringify({blurhash, width, height, contentType})`

- **Purpose**: Stores BlurHash metadata for progressive image loading
- **TTL**: None (persistent until manually cleared)
- **Updated**: During image upload with optimization
- **Used**: In `HEAD /api/file/<sha256>` responses
- **Rationale**: BlurHash is immutable for a given blob

## Cache Update Mechanisms

### Read Operations (`api/file.ts` and `/api/file/list`)

#### Server Selection Priority:

For `/api/file/<sha256>` (fetch):

1. **Last-good server** (`blossom:last-good:<sha256>`)
2. **User's server list** (from Nostr `kind:10063`)
3. **Cached servers** (`blossom:cached-servers`)
4. **Empty array** (no servers available)

For `/api/file/list` (aggregate list):

1. **Servers**: read `blossom:cached-servers`; if missing, fetch Nostr kind:10063 and set cache
2. **Per-server blob lists**: read `blossom-blob-list-<server>`
   - If missing, fetch signed `GET /list/<pubkey>` and set either JSON array or the sentinel string `"null"` when no blobs / unavailable
3. **Aggregate**: merge per-server caches into a hash→servers map; enrich with `blurhash`, `last-good`, and `bad` flags
4. **Aggregate cache**: store the final array at `blossom:list:aggregate` with no TTL

#### On Successful Fetch:

```javascript
await markServerGood(sha256, server);
// Sets: blossom:last-good:<sha256> → server (no TTL - persistent)
// Clears: blossom:bad:<sha256>:<server>
```

#### On Failed Fetch:

```javascript
await markServerBad(sha256, server);
// Sets: blossom:bad:<sha256>:<server> → "1" (no TTL - persistent)
```

### Write Operations

#### Upload Success (`handleUploadBlossomMedia`):

```javascript
// Cache updates on success - sequential to ensure consistency
await markServerGood(sha256, server);
await redis.del(getServerCacheKey(server));
await redis.del(getBadServerKey(sha256, server));
```

#### Mirror Success (`handleMirrorBlossomMedia`):

```javascript
// Cache updates on success - sequential to ensure consistency
await markServerGood(sha256, server);
await redis.del(getServerCacheKey(server));
await redis.del(getBadServerKey(sha256, server));
```

#### Delete Success (`handleDeleteBlossomMedia`):

```javascript
if (result.success) {
  await markServerBad(sha256, server); // Mark as bad
  await redis.del(getServerCacheKey(server)); // Clear blob list cache

  // If this was the last-good server, clear it
  const lastGood = await redis.get(getLastGoodKey(sha256));
  if (lastGood === server) {
    await redis.del(getLastGoodKey(sha256));
  }
}
```

#### Aggregate List Invalidation

```javascript
// When any write operation modifies blobs on a server
await redis.del(getServerCacheKey(server)); // blossom-blob-list-<server>
await redis.del("blossom:list:aggregate");
```

#### Server List Update (`handleUpdateBlossomServers`):

```javascript
const _7daysInSeconds = 60 * 60 * 24 * 7;

await redis.set(getCachedServersKey(), JSON.stringify(servers), {
  expiration: { type: "EX", value: _7daysInSeconds },
});
// Sets: blossom:cached-servers → servers (7 days TTL)
```

## TTL Strategy Rationale

### No TTL (Persistent) - Immutable Data:

- **Last-good servers**: Immutable blobs don't change, so working servers stay working
- **Bad server flags**: Failed servers stay failed until they work again
- **Blob lists**: Immutable until new operations occur (upload/mirror/delete)
- **BlurHash metadata**: Immutable for a given blob

### Long TTL (7 days) - Configuration Data:

- **Cached servers**: Stable configuration that rarely changes, but can be updated by admins

## Cache Invalidation Strategy

### Automatic Invalidation:

- **Write operations**: Clear relevant caches immediately
- **Failed operations**: Mark servers as bad with short TTL
- **Successful operations**: Update last-good and clear bad flags

### Manual Invalidation:

- **Server list updates**: Clear cached servers and update
- **Blob deletion**: Clear all related caches
- **Admin actions**: Clear specific server caches

## Performance Benefits

1. **Fast blob retrieval**: Last-good server lookup in ~1ms
2. **Reduced server load**: Skip known bad servers
3. **Efficient fallback**: Cached server lists when Nostr is down
4. **Progressive loading**: BlurHash metadata for instant placeholders
5. **Consistent state**: Cache invalidation ensures data accuracy

## Error Handling

- **Redis failures**: Graceful degradation to direct server queries
- **Cache misses**: Fallback to next server in priority list
- **Stale data**: TTL ensures eventual consistency
- **Network issues**: Bad server flags prevent repeated failures

This caching strategy ensures high availability, fast performance, and consistent data across all Blossom operations.
