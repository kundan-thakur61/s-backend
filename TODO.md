# TODO - Shiprocket SKU Fix

## Issue
- Shiprocket API returns 422 Unprocessable Entity error
- Error: "Product SKU should be between 1 to 50 characters"
- Long SKUs from custom orders were exceeding the 50 character limit

## Solution Applied
- Added SKU truncation logic in `backend/routes/shiprocket.js`
- For regular orders: Truncate SKUs longer than 50 chars to last 40 chars
- For custom orders: Truncate SKUs longer than 50 chars to last 40 chars
- Added logging when truncation occurs

## Files Modified
- `backend/routes/shiprocket.js`: Added SKU validation and truncation for both regular and custom order items

## Testing
- [ ] Test create-shipment endpoint with long SKU
- [ ] Verify Shiprocket accepts the truncated SKU
- [ ] Confirm shipment creation succeeds

## Status
- [x] Code changes applied
- [ ] Testing completed
- [ ] Issue resolved
