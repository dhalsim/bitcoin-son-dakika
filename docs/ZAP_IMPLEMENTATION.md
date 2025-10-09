# Zap Implementation

This document describes the Lightning Zap implementation according to NIP-57.

## Overview

The zap functionality allows users to send Lightning payments to content creators through Nostr events. The implementation follows the NIP-57 specification.

## Components

### 1. ZapDialog (`src/components/ZapDialog.tsx`)

- Main dialog for initiating zaps
- Allows users to select amount (preset or custom)
- Optional comment field
- Integrates with NIP-07 for signing zap requests

### 2. ZapInvoiceDialog (`src/components/ZapInvoiceDialog.tsx`)

- Displays the Lightning invoice with QR code
- Copy functionality for the invoice
- Download QR code as SVG
- Instructions for payment

### 3. Zap Utilities (`src/lib/zap-utils.ts`)

- `createZap()`: Complete zap flow
- `generateZapRequest()`: Creates zap request event (kind 9734)
- `sendZapRequest()`: Sends request to LNURL callback
- `hasUserZapped()`: Checks if user has zapped an event

### 4. Zap Receipt Handling (`src/lib/nip57.ts`)

- `getZaps()`: Fetches and validates zap receipts (kind 9735)
- `validateZapReceipt()`: Validates zap receipts
- `extractAmountFromBolt11()`: Extracts amount from Lightning invoice

## Flow

1. **User clicks zap button** → Opens ZapDialog
2. **User selects amount and comment** → Creates zap request
3. **NIP-07 signs the request** → Sends to LNURL callback
4. **Lightning invoice received** → Shows ZapInvoiceDialog
5. **User pays invoice** → Zap receipt published to relays
6. **UI updates** → Shows zap indicator and updated amounts

## Features

### Zap Indicators

- Zap button shows filled icon when user has zapped
- Orange color indicates user's zap
- Real-time updates when new zaps are received

### QR Code Generation

- Uses `qrcode` library for SVG generation
- Downloadable QR codes
- Copyable invoice text

### NIP-07 Integration

- Requires NIP-07 extension for signing
- Graceful fallback with error messages
- Automatic pubkey detection

## Dependencies

- `qrcode`: QR code generation
- `nostr-tools`: Nostr event handling
- NIP-07 browser extension: For signing zap requests

## Usage

```typescript
// Basic zap creation
const invoice = await createZap(event, 21, "Great post!", lnurl);

// Check if user has zapped
const hasZapped = hasUserZapped(eventId, userPubkey, zaps);

// Get zap receipts
const { zaps, totalAmount, count } = useZapReceipts(event);
```

## Future Improvements

1. **LNURL Integration**: Get LNURL from user profiles automatically
2. **Zap Splits**: Support for multiple recipients (NIP-57 zap tags)
3. **Private Zaps**: Encrypted zap requests
4. **Zap History**: Track user's zap history
5. **Zap Analytics**: Detailed zap statistics

## Testing

The implementation includes:

- Error handling for missing NIP-07 extension
- Validation of zap receipts
- Real-time zap receipt listening
- UI feedback for zap status

## Security Considerations

- Zap receipts are validated according to NIP-57
- Bolt11 invoices are parsed safely
- NIP-07 extension is required for signing
- No private keys are stored locally
