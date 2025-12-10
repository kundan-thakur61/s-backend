import React from 'react';

const ThemeShowcase = ({ theme, model, models = [], onModelChange }) => {
  const posterUrl = theme?.assets?.posterUrl || theme?.posterUrl || theme?.posterImage;
  const frameUrl = model?.images?.[0]?.url;
  const accentColor = theme?.variables?.accentColor || theme?.accentColor || '#0ea5e9';
  const tagline = theme?.variables?.tagline || theme?.tagline || 'Live mock preview';
  const price = theme?.basePrice ?? theme?.variables?.price;

  return (
    <div className="bg-white shadow rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Preview</p>
          <h3 className="text-lg font-semibold text-gray-900 mt-1">{theme?.name || 'Theme preview'}</h3>
          <p className="text-sm text-gray-500">Slug: {theme?.key || '—'}</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">{price ? `₹${price}` : 'Price not set'}</p>
        </div>
        {models.length > 0 && (
          <select
            className="border rounded-lg px-3 py-2 text-sm"
            value={model?._id || ''}
            onChange={(e) => onModelChange?.(e.target.value)}
          >
            <option value="">Pick frame</option>
            {models.map((m) => (
              <option key={m._id} value={m._id}>{m.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="relative mx-auto w-56 h-[420px] bg-gray-100 rounded-[30px] overflow-hidden shadow-inner">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={`${theme?.name || 'Theme'} poster`}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">Poster preview</div>
        )}

        {frameUrl && (
          <img
            src={frameUrl}
            alt={`${model?.name || 'Phone'} frame`}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: accentColor }} />
          {tagline}
        </span>
        {model?.name && <span className="text-gray-500">Frame: {model.name}</span>}
      </div>
    </div>
  );
};

export default ThemeShowcase;