import React from 'react';

const reasonOptions = [
  'I want to change the contact details',
  'I was hoping for a shorter delivery time',
  'I want to change the payment option',
  'I want to change the size/color/type',
  'My reasons are not listed here',
  "I'm worried about the ratings/reviews",
  'I want to change the delivery address',
  'Price of the product has now decreased'
];

export default function CancellationReasonModal({
  isOpen,
  onClose,
  onSubmit,
  selectedReason,
  onReasonChange,
  comment,
  onCommentChange,
  loading = false,
  error
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-xl rounded-lg bg-white shadow-xl border border-gray-200">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">1</p>
              <h3 className="text-lg font-semibold text-gray-900">Easy Cancellation</h3>
              <p className="text-sm text-gray-500">Tell us why you are cancelling so we can improve.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close cancellation reason dialog"
            >
              ×
            </button>
          </div>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div>
            <label htmlFor="cancel-reason" className="block text-sm font-medium text-gray-700">
              Reason for Cancellation <span className="text-red-500">*</span>
            </label>
            <select
              id="cancel-reason"
              value={selectedReason}
              onChange={(e) => onReasonChange(e.target.value)}
              className="mt-1 block w-full rounded border border-gray-300 bg-white py-2 px-3 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value="">Select Reason</option>
              {reasonOptions.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
            {error && (
              <p className="mt-1 text-xs text-red-600" role="alert">
                {error}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="cancel-comment" className="block text-sm font-medium text-gray-700">
              Comments <span className="text-red-500">*</span>
            </label>
            <textarea
              id="cancel-comment"
              value={comment}
              onChange={(e) => onCommentChange(e.target.value)}
              rows={3}
              placeholder="Let us know if there is anything we can do"
              className="mt-1 block w-full rounded border border-gray-300 py-2 px-3 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">2</p>
            <h4 className="text-sm font-semibold text-gray-900">Refund Modes</h4>
            <p className="text-sm text-gray-500">
              Refunds are processed back to the original payment method once the cancellation is confirmed.
            </p>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-400"
          >
            Do not cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
          >
            {loading ? 'Submitting...' : 'Cancel Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
