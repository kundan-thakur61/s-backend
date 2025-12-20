const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/adminMiddleware');
const shiprocketController = require('../controllers/shiprocketController');

/**
 * Public routes (accessible to authenticated users)
 */

// Track shipment - users can track their own orders
router.get('/track/:orderId', authMiddleware, shiprocketController.trackShipment);

// Check serviceability - users can check if delivery is available to their pincode
router.get('/check-serviceability', shiprocketController.checkServiceability);

/**
 * Admin-only routes
 */

// Create shipment in Shiprocket
router.post(
  '/create-shipment',
  authMiddleware,
  adminMiddleware,
  shiprocketController.createShipment
);

// Assign courier and generate AWB
router.post(
  '/assign-courier',
  authMiddleware,
  adminMiddleware,
  shiprocketController.assignCourier
);

// Get recommended couriers for a shipment
router.get(
  '/recommended-couriers/:orderId',
  authMiddleware,
  adminMiddleware,
  shiprocketController.getRecommendedCouriers
);

// Request pickup for shipment
router.post(
  '/request-pickup',
  authMiddleware,
  adminMiddleware,
  shiprocketController.requestPickup
);

// Cancel shipment
router.post(
  '/cancel-shipment',
  authMiddleware,
  adminMiddleware,
  shiprocketController.cancelShipment
);

// Generate shipping label
router.post(
  '/generate-label',
  authMiddleware,
  adminMiddleware,
  shiprocketController.generateLabel
);

// Generate manifest
router.post(
  '/generate-manifest',
  authMiddleware,
  adminMiddleware,
  shiprocketController.generateManifest
);

// Get pickup locations
router.get(
  '/pickup-locations',
  authMiddleware,
  adminMiddleware,
  shiprocketController.getPickupLocations
);

/**
 * Webhook endpoint (no authentication - verified by Shiprocket)
 * This endpoint receives status updates from Shiprocket
// Webhook endpoint (no authentication - verified by Shiprocket)
 */
router.post('/logistics-webhook', shiprocketController.handleWebhook);
router.get('/logistics-webhook', (req, res) => {
  res.json({ message: 'Logistics webhook endpoint is active' });
});


module.exports = router;
