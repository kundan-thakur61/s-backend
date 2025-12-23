# Fix Payment Redirect Issue

## Tasks
- [x] Update Razorpay payment success handler to use window.location.href instead of navigate()
- [x] Update COD success navigation for consistency
- [ ] Test the fix to ensure proper redirection after payment

## Context
The issue is that the page is not redirecting to "order-success" after successful online payment. This is likely due to React Router's navigate() function not working properly in mobile webviews or when Razorpay opens in a different context. Using window.location.href will ensure reliable navigation across all devices.
