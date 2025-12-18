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
 */
router.post('/webhook', shiprocketController.handleWebhook);

// For testing: respond to GET requests on /webhook
router.get('/webhook', (req, res) => {
  res.status(200).json({ message: 'Shiprocket webhook endpoint is active. Use POST to send data.' });
});

module.exports = router;
