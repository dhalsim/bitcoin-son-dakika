# Nostr Note Statistics Implementation Plan

## Overview

This document outlines the plan for implementing note statistics from the Nostr network, including replies, reposts, likes, dislikes, and emoji reactions.

## Current Implementation Status

✅ **Completed:**
- Event-based statistics collection (returns actual events, not just counts)
- Separate NIP-specific functions for better modularity
- Callback-based approach with automatic caching
- React components for easy integration
- Support for all major Nostr NIPs (10, 18, 22, 25, 30)

## Architecture

### 1. Core Statistics Engine (`src/lib/event-statistics.ts`)

**Functions:**
- `getEventStatistics()` - Main function that orchestrates all NIP queries
- Uses callback-based approach for real-time updates
- Automatically handles caching through individual NIP functions

**Supported Statistics:**
- **Replies**: NIP-10 (kind 1) + NIP-22 (kind 30023)
- **Quotes**: NIP-10 q tags
- **Reposts**: NIP-18 (kind 6)
- **Reactions**: NIP-25 (kind 7) - likes/dislikes
- **Emoji Reactions**: NIP-30 emoji tags

### 2. NIP-Specific Functions

**NIP-10 (`src/lib/nip10.ts`):**
- `getKind1Replies()` - Get replies to kind 1 notes
- `getKind1Quotes()` - Get quotes of kind 1 notes

**NIP-18 (`src/lib/nip18.ts`):**
- `getReposts()` - Get reposts of any event

**NIP-22 (`src/lib/nip22.ts`):**
- `getArticleReplies()` - Get replies to articles (kind 30023)

**NIP-25 (`src/lib/nip25.ts`):**
- `getReactions()` - Get likes, dislikes, and emoji reactions

### 3. React Components

**EventStatistics (`src/components/EventStatistics.tsx`):**
- Uses the `useEventStatistics` hook
- Clean, responsive design with loading states

**SimpleEventStatistics (`src/components/SimpleEventStatistics.tsx`):**
- Direct callback-based approach (no hook needed)
- Same UI as EventStatistics but simpler implementation

## Usage Examples

### Option 1: Using the Hook
```tsx
import { useEventStatistics } from "@/hooks/useEventStatistics";

function MyComponent({ event }) {
  const { statistics, loading, error } = useEventStatistics(event);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      Replies: {statistics?.replies.length || 0}
      Likes: {statistics?.likes.length || 0}
    </div>
  );
}
```

### Option 2: Direct Callback Approach (Recommended)
```tsx
import { SimpleEventStatistics } from "@/components/SimpleEventStatistics";

<SimpleEventStatistics 
  event={nostrEvent}
  className="my-custom-styles"
/>
```

### Option 3: Direct Function Call
```tsx
import { getEventStatistics } from "@/lib/event-statistics";

getEventStatistics(event, relays, (stats) => {
  console.log('Replies:', stats.replies.length);
  console.log('Likes:', stats.likes.length);
  // Update your UI here
});
```

## Event-Based System

### Statistics Structure
```typescript
type EventStatistics = {
  replies: NostrEvent[];      // Array of reply events
  quotes: NostrEvent[];       // Array of quote events  
  reposts: NostrEvent[];      // Array of repost events
  likes: NostrEvent[];        // Array of like reaction events
  dislikes: NostrEvent[];     // Array of dislike reaction events
  emojis: {
    [emoji: string]: NostrEvent[]; // Array of emoji reaction events
  };
};
```

### Benefits
- **Full Event Data**: Access to complete event information, not just counts
- **Real-time Updates**: Callbacks provide live updates as data arrives
- **Caching**: Automatic caching through individual NIP functions
- **Modularity**: Each NIP has its own function for better maintainability

## Relay Strategy

### Default Relays
The implementation uses a curated list of reliable relays:
- `wss://relay.nostr.band`
- `wss://relay.damus.io`
- `wss://nos.lol`
- `wss://relay.primal.net`
- `wss://relay.snort.social`
- `wss://nostr.bitcoiner.social`
- `wss://nostr.mom`
- `wss://nostr-pub.wellorder.net`
- `wss://relay.nos.social`

### Query Strategy
1. **Parallel Queries**: All NIP functions query simultaneously
2. **Callback-Based**: Each function calls back when data is ready
3. **Caching**: Each NIP function handles its own caching
4. **Error Handling**: Graceful fallback if relays fail

## Performance Optimizations

### 1. Smart Caching
- Each NIP function caches its results independently
- Cache invalidation handled per function
- Uses existing cache infrastructure

### 2. Real-time Updates
- Callbacks provide immediate updates
- No need for polling or subscriptions
- Background updates through relay subscriptions

### 3. Event-Based Processing
- Only process events you need
- Full event data available for advanced features
- Efficient memory usage

## Integration Points

### 1. NewsCard Component
Statistics are integrated into the NewsCard component:
```tsx
<NewsCard 
  title="Bitcoin News"
  nostrEvent={event} // Pass Nostr event for statistics
  // ... other props
/>
```

### 2. Article Pages
Can be added to article detail pages for engagement metrics.

### 3. Profile Pages
Show statistics for user's posts.

## Future Enhancements

### 1. Advanced Analytics
- Time-based statistics (hourly, daily trends)
- User engagement metrics
- Viral content detection
- Event content analysis

### 2. Performance Improvements
- Implement NIP-45 when widely supported
- Add WebSocket connections for real-time updates
- Implement server-side caching

### 3. UI Enhancements
- Animated statistics counters
- Detailed statistics modal
- Export statistics data
- Event preview on hover

### 4. Additional NIPs
- NIP-42: Authentication for private statistics
- NIP-50: Search integration
- Custom NIPs for advanced metrics

## Testing Strategy

### 1. Unit Tests
- Test individual NIP functions
- Test statistics calculation logic
- Test error handling
- Test caching behavior

### 2. Integration Tests
- Test with real Nostr relays
- Test real-time updates
- Test performance under load

### 3. User Testing
- Test UI responsiveness
- Test with various event types
- Test error scenarios

## Monitoring & Analytics

### 1. Performance Metrics
- Query response times
- Cache hit rates
- Relay availability

### 2. User Engagement
- Statistics view counts
- Real-time update usage
- Error rates

## Security Considerations

### 1. Relay Security
- Validate relay URLs
- Handle malicious relay responses
- Rate limiting for queries

### 2. Data Privacy
- Don't log sensitive event data
- Respect user privacy settings
- Secure WebSocket connections

## Deployment Checklist

- [ ] Test with real Nostr events
- [ ] Verify relay connectivity
- [ ] Test real-time updates
- [ ] Performance testing
- [ ] Error handling validation
- [ ] UI responsiveness testing
- [ ] Documentation updates

## Conclusion

This implementation provides a robust foundation for Nostr note statistics with:
- Event-based data collection
- Modular NIP-specific functions
- Callback-based real-time updates
- Clean UI integration
- Performance optimizations
- Future extensibility

The new system is more flexible and provides access to full event data, making it suitable for advanced analytics and real-time features. 