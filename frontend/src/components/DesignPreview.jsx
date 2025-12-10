import React from 'react'
import { SCREEN_RECT } from '../utils/helpers'

/**
 * Renders a preview of a custom design with proper scaling and positioning
 * @param {Object} design - The design object containing imgSrc, frame, and transform
 */
export default function DesignPreview({ design }) {
  if (!design.imgSrc) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400">
        <span className="text-sm">No preview available</span>
      </div>
    )
  }

  // Calculate preview dimensions and scaling
  const PREVIEW_WIDTH = 260
  const SCALE_FACTOR = 160 / PREVIEW_WIDTH
  
  const screenArea = {
    left: SCREEN_RECT.left * SCALE_FACTOR,
    top: SCREEN_RECT.top * SCALE_FACTOR,
    width: SCREEN_RECT.width * SCALE_FACTOR,
    height: SCREEN_RECT.height * SCALE_FACTOR
  }

  const transform = design.transform || { x: 0, y: 0, scale: 1 }
  
  const imageStyle = {
    position: 'absolute',
    left: `${screenArea.left + (screenArea.width / 2)}px`,
    top: `${screenArea.top + (screenArea.height / 2)}px`,
    transform: `translate(-50%, -50%) translate(${transform.x * SCALE_FACTOR}px, ${transform.y * SCALE_FACTOR}px) scale(${transform.scale})`,
    width: `${PREVIEW_WIDTH * SCALE_FACTOR}px`
  }

  const screenStyle = {
    position: 'absolute',
    left: screenArea.left,
    top: screenArea.top,
    width: screenArea.width,
    height: screenArea.height,
    overflow: 'hidden',
    background: '#fff'
  }

  return (
    <>
      {/* Screen area with user image */}
      <div style={screenStyle}>
        <img
          src={design.imgSrc}
          alt={design.name || 'Custom design'}
          style={imageStyle}
          className="select-none"
          draggable={false}
        />
      </div>
      
      {/* Frame overlay */}
      {design.frame && (
        <img
          src={design.frame}
          alt="Phone case frame"
          className="absolute inset-0 w-full h-full object-cover select-none"
          draggable={false}
        />
      )}
    </>
  )
}
