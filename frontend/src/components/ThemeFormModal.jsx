import React, { useEffect, useMemo, useState } from 'react';
import ThemeShowcase from './ThemeShowcase';

const EMPTY_FORM = {
  name: '',
  key: '',
  description: '',
  basePrice: '',
  accentColor: '#0ea5e9',
  textColor: '#111827',
  tagline: '',
  badges: '',
  mobileCompanyId: '',
  mobileModelId: '',
  posterUrl: '',
  posterPublicId: '',
  active: false,
  category: '',
  categoryId: '',
};

const normalizeInitial = (theme = {}) => {
  const variables = theme.variables || {};
  const posterUrl = theme.assets?.posterUrl || theme.posterUrl || theme.posterImage || '';
  return {
    name: theme.name || '',
    key: theme.key || '',
    description: theme.description || '',
    basePrice: theme.basePrice ?? variables.price ?? '',
    accentColor: variables.accentColor || '#0ea5e9',
    textColor: variables.textColor || '#111827',
    tagline: variables.tagline || theme.tagline || '',
    badges: Array.isArray(variables.badges) ? variables.badges.join(', ') : '',
    mobileCompanyId: theme.mobileCompanyId?._id || theme.mobileCompanyId || '',
    mobileModelId: theme.mobileModelId?._id || theme.mobileModelId || '',
    posterUrl,
    posterPublicId: theme.assets?.posterPublicId || '',
    active: !!theme.active,
    categoryId: theme.categoryId?._id || theme.categoryId || '',
    category: theme.category || '',
  };
};

const ThemeFormModal = ({
  open,
  onClose,
  onSubmit,
  initialData,
  companies = [],
  models = [],
  onPosterUpload,
  isSaving = false,
  validateKey,
}) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(initialData ? normalizeInitial(initialData) : EMPTY_FORM);
      setError('');
    }
  }, [open, initialData]);

  const filteredModels = useMemo(() => {
    if (!form.mobileCompanyId) return models;
    return models.filter((m) => m.company?._id === form.mobileCompanyId || m.company === form.mobileCompanyId);
  }, [models, form.mobileCompanyId]);

  useEffect(() => {
    if (form.mobileModelId && filteredModels.every((m) => m._id !== form.mobileModelId)) {
      setForm((prev) => ({ ...prev, mobileModelId: filteredModels[0]?._id || '' }));
    }
  }, [filteredModels, form.mobileModelId]);

  if (!open) return null;

  const handlePosterChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !onPosterUpload) return;
    setUploading(true);
    setError('');
    try {
      const uploaded = await onPosterUpload(file);
      setForm((prev) => ({ ...prev, posterUrl: uploaded.url, posterPublicId: uploaded.publicId || '' }));
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const name = form.name.trim();
    const key = form.key.trim().toLowerCase();
    if (!name || !key) {
      setError('Name and slug are required');
      return;
    }
    if ((!initialData || key !== (initialData.key || '').toLowerCase()) && validateKey && !validateKey(key, initialData?._id)) {
      setError('Slug already exists');
      return;
    }

    const payload = {
      name,
      key,
      description: form.description?.trim() || undefined,
      basePrice: form.basePrice === '' ? undefined : Number(form.basePrice),
      categoryId: form.categoryId || undefined,
      category: form.category || undefined,
      mobileCompanyId: form.mobileCompanyId || undefined,
      mobileModelId: form.mobileModelId || undefined,
      active: form.active,
      assets: form.posterUrl ? { posterUrl: form.posterUrl, posterPublicId: form.posterPublicId } : undefined,
      variables: {
        accentColor: form.accentColor,
        textColor: form.textColor,
        tagline: form.tagline,
        badges: form.badges
          .split(',')
          .map((b) => b.trim())
          .filter(Boolean),
        price: form.basePrice === '' ? undefined : Number(form.basePrice),
      },
    };

    const result = await onSubmit(payload);
    if (result?.success) {
      onClose?.();
    } else if (result?.error) {
      setError(result.error);
    }
  };

  const selectedModel = filteredModels.find((m) => m._id === form.mobileModelId) || null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center px-4 py-8 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Theme builder</p>
            <h2 className="text-xl font-semibold text-gray-900">{initialData ? 'Edit theme' : 'Create a new theme'}</h2>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900">Close</button>
        </div>

        <div className="grid lg:grid-cols-2 gap-0">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Name</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  minLength={2}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Slug</label>
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.key}
                  onChange={(e) => setForm((prev) => ({ ...prev, key: e.target.value }))}
                  placeholder="devotional"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Shown at /themes/&lt;slug&gt;</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Base price (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.basePrice}
                  onChange={(e) => setForm((prev) => ({ ...prev, basePrice: e.target.value }))}
                  placeholder="299"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-1">Accent color</label>
                  <input
                    type="color"
                    className="w-full h-10 border rounded-lg"
                    value={form.accentColor}
                    onChange={(e) => setForm((prev) => ({ ...prev, accentColor: e.target.value }))}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-1">Text color</label>
                  <input
                    type="color"
                    className="w-full h-10 border rounded-lg"
                    value={form.textColor}
                    onChange={(e) => setForm((prev) => ({ ...prev, textColor: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Tagline</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={form.tagline}
                onChange={(e) => setForm((prev) => ({ ...prev, tagline: e.target.value }))}
                placeholder="Sacred art, modern finishes"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Description</label>
              <textarea
                rows={3}
                className="w-full border rounded-lg px-3 py-2"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Short description for the theme detail page"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Mobile company</label>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.mobileCompanyId}
                  onChange={(e) => setForm((prev) => ({ ...prev, mobileCompanyId: e.target.value, mobileModelId: '' }))}
                >
                  <option value="">Optional</option>
                  {companies.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Mobile model</label>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.mobileModelId}
                  onChange={(e) => setForm((prev) => ({ ...prev, mobileModelId: e.target.value }))}
                  disabled={filteredModels.length === 0}
                >
                  <option value="">Choose model</option>
                  {filteredModels.map((m) => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Used for live frame preview</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Badges (comma separated)</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={form.badges}
                onChange={(e) => setForm((prev) => ({ ...prev, badges: e.target.value }))}
                placeholder="Spiritual, Mandala, Festive"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={form.active}
                  onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
                />
                Mark as active theme
              </label>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold">Poster image</label>
              <div className="flex items-center gap-3">
                <input type="file" accept="image/*" onChange={handlePosterChange} disabled={uploading} />
                {uploading && <span className="text-sm text-blue-600">Uploading…</span>}
              </div>
              {form.posterUrl && (
                <div className="w-28 h-28 border rounded-lg overflow-hidden">
                  <img src={form.posterUrl} alt="Poster" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {error && <div className="text-red-600 text-sm">{error}</div>}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-60"
                disabled={isSaving || uploading}
              >
                {isSaving ? 'Saving…' : initialData ? 'Save changes' : 'Create theme'}
              </button>
            </div>
          </form>

          <div className="border-t lg:border-l lg:border-t-0 p-6 bg-gray-50">
            <ThemeShowcase
              theme={{ ...form, assets: { posterUrl: form.posterUrl }, variables: { accentColor: form.accentColor, textColor: form.textColor, tagline: form.tagline, price: form.basePrice } }}
              model={selectedModel}
              models={filteredModels}
              onModelChange={(id) => setForm((prev) => ({ ...prev, mobileModelId: id }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeFormModal;