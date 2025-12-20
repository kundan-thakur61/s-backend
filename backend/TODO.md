# TODO: Fix Shiprocket Shipment Creation Issues

## Problem
- Multiple successful shipment creations for the same order ID (69469543ee2ad30fd8966111)
- GET /api/shiprocket/recommended-couriers returning 400 "Shipment not created yet" after successful creates
- Suggests order.save() not persisting shiprocket.shipmentId or race condition

## Steps
- [x] Add logging in createShipment after order.save() to confirm persistence
- [x] Add logging in getRecommendedCouriers to see the order.shiprocket state
- [x] Add a unique index on shiprocket.shipmentId in the Order model to prevent duplicates at DB level
- [x] Update the frontend to check shipmentData state before creating to avoid unnecessary calls
