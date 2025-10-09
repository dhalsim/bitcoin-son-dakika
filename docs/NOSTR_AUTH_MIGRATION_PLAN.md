## Nostr Auth Migration Plan (Provider Architecture)

### 🎯 **MIGRATION COMPLETE!**

The migration from `window.nostr.js` to a modern Provider architecture has been **successfully completed**. The application now uses a clean, extensible system with full TypeScript support and React Context API integration.

## TODO List

### ✅ **COMPLETED TASKS**

#### **Core Migration (Complete)**

- [x] **Core Nostr Auth Migration**: Migrated from window.nostr.js to Provider architecture
- [x] **Provider Architecture**: Generic NostrProvider<T> interface with extensible architecture
- [x] **Context API**: NostrAuthContext with comprehensive state management and hooks
- [x] **Auth Intents**: Three auth intents (log_in, read_pubkey, sign_event) with appropriate UX
- [x] **Login Modal**: Turkish UI, intent-based behavior, and clean modal flow
- [x] **NIP-07 Provider**: Full implementation with capability detection and NIP-07 support
- [x] **Component Migration**: All major components migrated (admin, ZapDialog, FollowButton, UserContext, UserMenu)
- [x] **Utility Functions**: admin/utils.ts, zap-utils.ts, nip10.ts, nip18.ts, nip25.ts accept auth callbacks as parameters
- [x] **UserMenu Integration**: UserMenu integrated across app including admin panel for consistent UX
- [x] **Window.nostr Removal**: window.nostr.js preload and script references removed from root.tsx
- [x] **Persistence**: LocalStorageCache integration for login state
- [x] **Error Handling**: All error messages in Turkish with proper fallbacks
- [x] **File Cleanup**: Complete removal of nip07.ts file and fix all import dependencies

#### **Architecture Improvements (Complete)**

- [x] **Provider State Restoration**: Provider restoration on mount implemented
- [x] **TypeScript Integration**: Full type safety with generics and proper return types
- [x] **Context Hooks**: Stable useCallback functions prevent infinite loops
- [x] **Performance Optimization**: Optimized with useMemo for computed values
- [x] **Suppress Logic Removal**: Removed unnecessary suppress pubkey prompt functionality

### 🔄 **OPTIONAL FUTURE ENHANCEMENTS**

#### **Provider Expansion**

- [ ] **Implement loginWithNsec**: Add Nsec provider for private key login
- [ ] **Implement loginWithNip46**: Add NIP-46 remote signer support
- [ ] **Implement NostrConnect**: Add NostrConnect provider

#### **System Polish**

- [x] **Remove window.nostr.js file**: Remove public/window.nostr.js file if completely unused
- [ ] **Enhanced UserContext integration**: Consider using provider.getRelays() more consistently
- [ ] **Comprehensive error handling**: Add more specific error messages for different failure scenarios

#### **Testing & Validation**

- [ ] **End-to-end testing**: Test all auth flows with/without NIP-07 installed
- [ ] **Cross-component consistency**: Ensure all components use Context consistently
- [ ] **Error scenarios**: Test behavior when extension unavailable/permission denied

#### **Documentation**

- [ ] **Update README**: Provider architecture, new Context API, login flow
- [ ] **Provider Guide**: Guide to add new Providers (NIP-46/NostrConnect ready)
- [ ] **Security Documentation**: Security notes (nsec handling, permissions)

### 🎯 **MIGRATION STATUS: COMPLETE**

The core migration from `window.nostr.js` to Provider architecture is **100% complete**. All remaining items are optional future enhancements that do not affect the core functionality.

The system now provides:

- ✅ **Clean Architecture**: No legacy dependencies, fully Provider-based
- ✅ **Type Safety**: Complete TypeScript integration with generics
- ✅ **User Experience**: Intuitive login modal with Turkish UI
- ✅ **Extensibility**: Ready for additional providers (NIP-46, Nsec, etc.)
- ✅ **Performance**: Optimized React hooks and state management
- ✅ **Consistency**: Unified auth flow across all components
