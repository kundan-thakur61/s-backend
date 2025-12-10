import React, { useState, useRef, useCallback } from 'react';

const FrameCustomizer = ({ selectedModel, onSave }) => {
  const [userImage, setUserImage] = useState(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);

  // Screen rectangle for the phone frame (adjust based on your frame images)
  const SCREEN_RECT = { left: 20, top: 80, width: 260, height: 440 };

  const handleImageUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUserImage(e.target.result);
        setTransform({ x: 0, y: 0, scale: 1 });
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (!userImage) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  }, [userImage, transform]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !userImage) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setTransform(prev => ({ ...prev, x: newX, y: newY }));
  }, [isDragging, dragStart, userImage]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const zoomIn = useCallback(() => {
    setTransform(prev => ({ ...prev, scale: Math.min(prev.scale * 1.2, 5) }));
  }, []);

  const zoomOut = useCallback(() => {
    setTransform(prev => ({ ...prev, scale: Math.max(prev.scale / 1.2, 0.1) }));
  }, []);

  const fitToFrame = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
  }, []);

  const exportAsPNG = useCallback(() => {
    if (!selectedModel) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 300;
    canvas.height = 600;

    // Load frame image
    const frameImg = new Image();
    frameImg.crossOrigin = 'anonymous';
    frameImg.onload = () => {
      ctx.drawImage(frameImg, 0, 0, 300, 600);

      // Draw user image if exists
      if (userImage) {
        const userImg = new Image();
        userImg.crossOrigin = 'anonymous';
        userImg.onload = () => {
          ctx.save();
          ctx.translate(SCREEN_RECT.left + SCREEN_RECT.width / 2, SCREEN_RECT.top + SCREEN_RECT.height / 2);
          ctx.scale(transform.scale, transform.scale);
          ctx.translate(transform.x, transform.y);
          ctx.drawImage(userImg, -userImg.width / 2, -userImg.height / 2);
          ctx.restore();

          // Download the image
          canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selectedModel.name.replace(/\s+/g, '_')}_custom_cover.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          });
        };
        userImg.src = userImage;
      } else {
        // Download frame only
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${selectedModel.name.replace(/\s+/g, '_')}_frame.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });
      }
    };
    frameImg.src = selectedModel.framePath;
  }, [selectedModel, userImage, transform]);

  const sendToBackend = useCallback(async () => {
    if (!selectedModel) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 300;
    canvas.height = 600;

    // Load frame image
    const frameImg = new Image();
    frameImg.crossOrigin = 'anonymous';
    frameImg.onload = async () => {
      ctx.drawImage(frameImg, 0, 0, 300, 600);

      // Draw user image if exists
      if (userImage) {
        const userImg = new Image();
        userImg.crossOrigin = 'anonymous';
        userImg.onload = async () => {
          ctx.save();
          ctx.translate(SCREEN_RECT.left + SCREEN_RECT.width / 2, SCREEN_RECT.top + SCREEN_RECT.height / 2);
          ctx.scale(transform.scale, transform.scale);
          ctx.translate(transform.x, transform.y);
          ctx.drawImage(userImg, -userImg.width / 2, -userImg.height / 2);
          ctx.restore();

          // Convert to blob and send to backend
          canvas.toBlob(async (blob) => {
            const formData = new FormData();
            formData.append('design', blob, 'custom_design.png');
            formData.append('company', selectedModel.company || 'Unknown');
            formData.append('model', selectedModel.name);

            try {
              const response = await fetch('/api/custom-designs', {
                method: 'POST',
                body: formData,
              });

              if (response.ok) {
                const result = await response.json();
                alert(`Design saved successfully! Path: ${result.path}`);
                onSave && onSave({ image: userImage, transform, model: selectedModel });
              } else {
                alert('Failed to save design');
              }
            } catch (error) {
              console.error('Error saving design:', error);
              alert('Error saving design');
            }
          });
        };
        userImg.src = userImage;
      } else {
        alert('Please upload an image first');
      }
    };
    frameImg.src = selectedModel.framePath;
  }, [selectedModel, userImage, transform, onSave]);

  if (!selectedModel) {
    return <div className="text-center p-8">Please select a phone model first</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Customize Your {selectedModel.name} Cover</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Canvas Preview */}
        <div className="flex justify-center">
          <div
            ref={canvasRef}
            className="relative w-[300px] h-[600px] bg-gray-100 border-2 border-gray-300 cursor-move select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* User Image */}
            {userImage && (
              <img
                src={userImage}
                alt="User design"
                className="absolute"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) scale(${transform.scale}) translate(${transform.x}px, ${transform.y}px)`,
                  transformOrigin: 'center center',
                  maxWidth: 'none',
                  maxHeight: 'none',
                  pointerEvents: 'none',
                }}
              />
            )}

            {/* Phone Frame Overlay */}
            <img
              src={selectedModel.framePath}
              alt="Phone frame"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div className="border-2 border-dashed border-gray-300 p-6 text-center cursor-pointer hover:border-gray-400 transition-colors rounded-lg">
                <div className="text-4xl mb-2">📷</div>
                <p className="text-gray-600">Click to upload your image</p>
              </div>
            </label>
          </div>

          {/* Transform Controls */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Adjust Image</h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={zoomIn}
                className="p-3 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Zoom In
              </button>
              <button
                onClick={zoomOut}
                className="p-3 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Zoom Out
              </button>
            </div>
            <button
              onClick={fitToFrame}
              className="w-full p-3 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Fit to Frame
            </button>
          </div>

          {/* Actions */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Actions</h3>
            <div className="space-y-2">
              <button
                onClick={exportAsPNG}
                className="w-full p-3 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Download PNG
              </button>
              <button
                onClick={sendToBackend}
                className="w-full p-3 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                Send to Backend
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">How to use:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Upload your image</li>
              <li>• Drag to move the image</li>
              <li>• Use zoom buttons to resize</li>
              <li>• Download or send to backend</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrameCustomizer;
