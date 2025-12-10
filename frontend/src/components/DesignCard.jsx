import React from 'react'
import { formatDate } from '../utils/helpers'
import DesignPreview from './DesignPreview'

/**
 * Individual design card component
 * @param {Object} design - The design object
 * @param {Function} onEdit - Callback for editing the design
 * @param {Function} onAddToCart - Callback for adding to cart
 * @param {Function} onDelete - Callback for deleting the design
 */
export default function DesignCard({ design, onEdit, onAddToCart, onDelete }) {
  const meta = design.meta || {}
  const displayName = design.name || `${meta.company || 'Custom'} ${meta.model || ''}`.trim()

  return (
    <article className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      {/* Design Preview */}
      <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden relative mb-4">
        <DesignPreview design={design} />
      </div>

      {/* Design Info */}
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-gray-900 line-clamp-1" title={displayName}>
            {displayName}
          </h3>
          <p className="text-xs text-gray-500">
            Saved {formatDate(design.createdAt)}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(design)}
              className="flex-1 text-xs px-3 py-2 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition-colors"
              aria-label={`Edit ${displayName}`}
            >
              Edit
            </button>
            <button
              onClick={() => onAddToCart(design)}
              className="flex-1 text-xs px-3 py-2 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors"
              aria-label={`Add ${displayName} to cart`}
            >
              Add to Cart
            </button>
          </div>
          <button
            onClick={() => onDelete(design)}
            className="w-full text-xs px-3 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors"
            aria-label={`Delete ${displayName}`}
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  )
}
