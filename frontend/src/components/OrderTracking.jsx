import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { formatPrice } from "../utils/helpers";
import { io } from "socket.io-client";

/* ---------------------------
   Small presentational pieces
   --------------------------- */
const ProductItem = ({ item }) => {
  const [imageSrc, setImageSrc] = useState(item.image || "/placeholder-image.svg");

  const handleImageError = () => {
    setImageSrc("/placeholder-image.svg");
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 border-b pb-4 last:border-b-0">
      <img
        src={imageSrc}
        alt={item.title || "Product image"}
        className="w-20 h-20 sm:w-16 sm:h-16 object-cover rounded mx-auto sm:mx-0"
        loading="lazy"
        onError={handleImageError}
      />
      <div className="flex-1 text-center sm:text-left">
        <h4 className="font-medium text-gray-900">{item.title}</h4>
        <p className="text-sm text-gray-600 mt-1">
          Size: {item.model || "N/A"} | Color: {item.color || "N/A"} | Seller:{" "}
          {item.brand || "N/A"}
        </p>
        <p className="text-sm font-medium text-gray-900 mt-1">
          {formatPrice(item.price)} x {item.quantity}
        </p>
      </div>
    </div>
  );
};

const TimelineStep = ({ index, step, isCompleted, isCurrent, formatDate }) => (
  <div className="flex items-start space-x-4">
    <div className="flex flex-col items-center">
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
          isCompleted ? "bg-green-500 text-white shadow-lg" : "bg-gray-200 text-gray-500"
        } ${isCurrent ? "ring-4 ring-green-200" : ""}`}
        role="img"
        aria-label={`Step ${index + 1}: ${step.label}`}
      >
        {isCompleted ? (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <span className="text-sm font-medium">{index + 1}</span>
        )}
      </div>

      {index < 3 && <div className={`w-0.5 h-8 mt-2 ${isCompleted ? "bg-green-500" : "bg-gray-200"}`} />}
    </div>

    <div className="flex-1 pb-8">
      <p className={`font-medium ${isCompleted ? "text-green-600" : "text-gray-500"}`}>
        {step.label}
        {isCurrent && (
          <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Current
          </span>
        )}
      </p>

      <p className="text-sm text-gray-600 mt-1">{step.description}</p>
      {step.date && <p className="text-sm text-gray-500 mt-1">{formatDate(step.date)}</p>}
    </div>
  </div>
);

/* ---------------------------
   Main component
   --------------------------- */
function OrderTracking({ order, onCancel, onChat }) {
  // local state
  const [trackingData, setTrackingData] = useState(order);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // keep local tracking data in sync when prop changes
  useEffect(() => {
    setTrackingData(order);
  }, [order]);

  // Real-time updates via socket.io
  useEffect(() => {
    if (!order?._id) return;
    const sock = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000');
    sock.emit('joinOrderRoom', order._id);
    sock.on('orderStatusUpdate', (data) => {
      if (data.orderId === order._id) {
        setTrackingData((prev) => ({ ...prev, status: data.status, trackingNumber: data.trackingNumber, notes: data.notes }));
      }
    });
    return () => {
      sock.emit('leaveOrderRoom', order._id);
      sock.disconnect();
    };
  }, [order?._id]);

  // derived timeline steps
  const steps = useMemo(
    () => [
      {
        label: "Order Confirmed",
        date: trackingData?.createdAt,
        status: "confirmed",
        description: "Your order has been confirmed and is being prepared.",
      },
      {
        label: "Shipped",
        date: trackingData?.shippedAt,
        status: "shipped",
        description: "Your order has been shipped and is on its way.",
      },
      {
        label: "Out For Delivery",
        date: trackingData?.outForDeliveryAt,
        status: "out_for_delivery",
        description: "Your order is out for delivery and will arrive soon.",
      },
      {
        label: "Delivered",
        date: trackingData?.deliveredAt || trackingData?.estimatedDelivery,
        status: "delivered",
        description: "Your order has been successfully delivered.",
      },
    ],
    [trackingData]
  );

  // map status to index
  const getCurrentStepIndex = useCallback(() => {
    const s = trackingData?.status;
    switch (s) {
      case "confirmed":
        return 0;
      case "processing":
      case "shipped":
        return 1;
      case "out_for_delivery":
        return 2;
      case "delivered":
        return 3;
      default:
        return 0;
    }
  }, [trackingData?.status]);

  const currentStepIndex = getCurrentStepIndex();

  // safe date formatter
  const formatDate = useCallback((dateString) => {
    if (!dateString) return null;
    try {
      const d = new Date(dateString);
      return d.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  }, []);

  // refresh tracking data (simulated). Replace with real API call.
  const refreshTrackingData = useCallback(async () => {
    if (!trackingData?.id) return;
    setIsRefreshing(true);
    setError(null);

    try {
      // Example: real API call would go here
      // const res = await fetch(`/api/orders/${trackingData.id}/tracking`);
      // if (!res.ok) throw new Error('network');
      // const updated = await res.json();
      // setTrackingData(updated);

      // simulated update for demo
      await new Promise((r) => setTimeout(r, 1000));
      setTrackingData((prev) => ({ ...prev, lastUpdated: new Date().toISOString() }));
    } catch (err) {
      setError("Failed to refresh tracking data. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  }, [trackingData?.id]);

  // auto-refresh for active orders
  useEffect(() => {
    if (!trackingData) return;
    if (["delivered", "cancelled"].includes(trackingData.status)) return;

    const id = setInterval(refreshTrackingData, 30000);
    return () => clearInterval(id);
  }, [trackingData, refreshTrackingData]);

  // cancel handler
  const handleCancel = useCallback(async () => {
    if (!trackingData?.id) return;
    if (trackingData.status === "delivered") return;

    setIsLoading(true);
    setError(null);

    try {
      // If you have an API: await fetch(`/api/orders/${trackingData.id}/cancel`, { method: 'POST' })
      await onCancel?.(trackingData.id);
      // optimistic update
      setTrackingData((prev) => ({ ...prev, status: "cancelled" }));
    } catch {
      setError("Failed to cancel order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [trackingData?.id, trackingData?.status, onCancel]);

  const handleChat = useCallback(() => {
    onChat?.(trackingData?.id);
  }, [trackingData?.id, onChat]);

  // UI when no order
  if (!trackingData) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm border">
        <div className="text-center py-8">
          <p className="text-gray-500">No order data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-sm border">
      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600" aria-label="Dismiss error">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2 sm:mb-0">Order #{trackingData.id || "N/A"}</h2>

        <button
          onClick={refreshTrackingData}
          disabled={isRefreshing}
          className="flex items-center px-3 py-2 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Refresh tracking data"
        >
          <svg className={`w-4 h-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Order Details */}
      <section className="mb-8" aria-labelledby="order-details-heading">
        <h3 id="order-details-heading" className="text-lg font-semibold mb-4">
          Order Details
        </h3>

        <div className="space-y-4">
          {(trackingData.items || []).map((itm, idx) => (
            <ProductItem key={itm.id || idx} item={itm} />
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="mb-8" aria-labelledby="tracking-heading">
        <h3 id="tracking-heading" className="text-lg font-semibold mb-4">
          Order Tracking
        </h3>

        <div className="space-y-6">
          {steps.map((step, idx) => {
            const isCompleted = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <TimelineStep
                key={step.status}
                index={idx}
                step={step}
                isCompleted={isCompleted}
                isCurrent={isCurrent}
                formatDate={formatDate}
              />
            );
          })}
        </div>
      </section>

      {/* See all updates */}
      <div className="mb-6">
        <button
          className="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          onClick={() => {
            /* open history modal or navigate */
          }}
        >
          See All Updates
        </button>
      </div>

      {/* Delivery note */}
      {currentStepIndex < 2 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>

            <p className="text-sm text-blue-700">Delivery executive details will be available once your order is out for delivery.</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {trackingData.status !== "delivered" && trackingData.status !== "cancelled" && (
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1 sm:flex-none bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            aria-label="Cancel order"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Cancelling...
              </span>
            ) : (
              "Cancel Order"
            )}
          </button>
        )}

        <button
          onClick={handleChat}
          className="flex-1 sm:flex-none bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
          aria-label="Chat with customer support"
        >
          Chat with us
        </button>
      </div>

      {/* Last updated */}
      {trackingData.lastUpdated && (
        <div className="mt-4 text-xs text-gray-500 text-center">Last updated: {formatDate(trackingData.lastUpdated)}</div>
      )}
    </div>
  );
}

OrderTracking.propTypes = {
  order: PropTypes.object,
  onCancel: PropTypes.func,
  onChat: PropTypes.func,
};

export default React.memo(OrderTracking);
