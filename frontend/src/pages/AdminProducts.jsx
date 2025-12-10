import React, { useEffect, useState, useRef } from 'react';
import productAPI from '../api/productAPI';
import mobileAPI from '../api/mobileAPI';
import uploadAPI from '../api/uploadAPI';

const DEFAULT_LIMIT = 10;

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(DEFAULT_LIMIT);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState('');
  const searchRef = useRef(null);

  // Form state for create / edit
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({
    title: '',
    brand: '',
    model: '',
    type: 'Glossy Metal',
    description: '',
    category: 'Designer',
    featured: false,
    variantPrice: '',
    variantStock: '',
    variantColor: '',
    images: []
  });
  const [previewUrls, setPreviewUrls] = useState([]);
  const [validationError, setValidationError] = useState('');
  const [companies, setCompanies] = useState([]);
  const [mobileModels, setMobileModels] = useState([]);

  useEffect(() => {
    fetchProducts();
    // also fetch companies/models to help the admin product form
    (async () => {
      try {
        const [cRes, mRes] = await Promise.all([mobileAPI.adminListCompanies(), mobileAPI.adminListModels()]);
        setCompanies(cRes.data?.data?.companies || []);
        setMobileModels(mRes.data?.data?.models || []);
      } catch (e) {
        // ignore, optional feature
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    // debounce search
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      setPage(1);
      fetchProducts(1, limit, search);
    }, 400);
    return () => clearTimeout(searchRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function fetchProducts(p = page, lim = limit, q = search) {
    setLoading(true);
    setError(null);
    try {
      const params = { page: p, limit: lim };
      if (q) params.search = q;
      const res = await productAPI.getProducts(params);
      if (res && res.data && res.data.data) {
        setProducts(res.data.data.products || []);
        setTotalPages(res.data.data.pagination?.totalPages || 1);
      } else {
        setProducts([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({
      title: '',
      brand: '',
      model: '',
      type: 'Glossy Metal',
      description: '',
      category: 'Designer',
      featured: false,
      variantPrice: '',
      variantStock: '',
      variantColor: '',
      images: []
    });
    setEditingProduct(null);
  }

  function openCreate() {
    resetForm();
    setShowForm(true);
  }

  function openEdit(product) {
    setEditingProduct(product);
    setForm({
      title: product.title || '',
      brand: product.brand || '',
      model: product.model || '',
      type: product.type || 'Glossy Metal',
      description: product.description || '',
      category: product.category || 'Designer',
      featured: !!product.featured,
      variantPrice: product.variants && product.variants[0] ? product.variants[0].price : '',
      variantStock: product.variants && product.variants[0] ? product.variants[0].stock : '',
      variantColor: product.variants && product.variants[0] ? product.variants[0].color : '',
      images: (product.variants && product.variants[0] && product.variants[0].images) || []
    });
    setShowForm(true);
  }

  async function handleDelete(productId) {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    try {
      setLoading(true);
      await productAPI.deleteProduct(productId);
      // refetch page
      fetchProducts();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to delete');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setValidationError('');
    // client-side validation to match backend validators
    if (!form.title || form.title.trim().length < 3) {
      setValidationError('Title must be at least 3 characters');
      setLoading(false);
      return;
    }
    if (!form.brand || form.brand.trim().length < 2) {
      setValidationError('Brand is required (min 2 chars)');
      setLoading(false);
      return;
    }
    if (!form.model || form.model.trim().length < 2) {
      setValidationError('Model is required (min 2 chars)');
      setLoading(false);
      return;
    }
    if (!form.description || form.description.trim().length < 10) {
      setValidationError('Description must be at least 10 characters');
      setLoading(false);
      return;
    }
    // variant validation (color required)
    if (!form.variantColor || form.variantColor.trim().length < 2) {
      setValidationError('Variant color is required (min 2 chars)');
      setLoading(false);
      return;
    }
    const payload = {
      title: form.title,
      brand: form.brand,
      model: form.model,
      type: form.type,
      description: form.description,
      category: form.category,
      featured: form.featured,
      variants: [
        {
          color: form.variantColor || '',
          price: parseFloat(form.variantPrice) || 0,
          stock: parseInt(form.variantStock || '0', 10) || 0
        }
      ]
    };

    try {
      // handle image uploads or include existing images
      if (form.images && form.images.length > 0) {
        if (form.images[0] instanceof File) {
          // Pass raw File list; uploadAPI builds FormData with the correct field name
          const uploadRes = await uploadAPI.uploadImages(form.images);
          const uploadedFiles = uploadRes?.data?.data?.files
            || uploadRes?.data?.files
            || uploadRes?.data
            || [];

          const filesArray = Array.isArray(uploadedFiles) ? uploadedFiles : (uploadedFiles.files || []);

          payload.variants[0].images = (filesArray || []).map((u) => ({
            url: u.url || u.secure_url || '',
            publicId: u.public_id || u.publicId || '',
          }));
        } else {
          // existing image objects (editing): forward them as-is (map to url/publicId)
          payload.variants[0].images = form.images || [];
        }
      }

      if (editingProduct) {
        await productAPI.updateProduct(editingProduct._id, payload);
      } else {
        await productAPI.createProduct(payload);
      }

      setShowForm(false);
      resetForm();
      fetchProducts(1, limit, search);
    } catch (err) {
      console.error(err);
      // prefer server-provided validation messages when available
      const server = err.response?.data;
      if (server) {
        if (server.message) setError(server.message);
        else if (server.errors && Array.isArray(server.errors)) setError(server.errors.map(e=>e.msg || e.message).join('; '));
        else setError(JSON.stringify(server));
      } else {
        setError(err.message || 'Failed to save product');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e) {
    const files = Array.from(e.target.files || []);
    setForm((prev) => ({ ...prev, images: files }));
  }

  // create previews for selected files or existing image objects
  useEffect(() => {
    const urls = [];
    const objectUrls = [];
    (form.images || []).forEach((img) => {
      if (img instanceof File) {
        const url = URL.createObjectURL(img);
        urls.push(url);
        objectUrls.push(url);
      } else if (img && (img.url || img.secure_url)) {
        urls.push(img.url || img.secure_url);
      } else if (typeof img === 'string') {
        urls.push(img);
      }
    });
    setPreviewUrls(urls);
    return () => {
      objectUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [form.images]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Admin - Products</h1>
        <div className="flex items-center gap-3">
          <input
            className="border rounded px-3 py-2"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded">New Product</button>
        </div>
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      <div className="bg-white shadow rounded overflow-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left">Title</th>
              <th className="px-4 py-2 text-left">Brand</th>
              <th className="px-4 py-2 text-left">Model</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Price</th>
              <th className="px-4 py-2 text-left">Stock</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-6 text-center">Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center">No products found</td></tr>
            ) : (
              products.map((p) => {
                const prices = (p.variants || []).map(v => v.price || 0);
                const lowest = prices.length ? Math.min(...prices) : 0;
                const totalStock = (p.variants || []).reduce((s, v) => s + (v.stock || 0), 0);
                return (
                  <tr key={p._id} className="border-t">
                    <td className="px-4 py-3">{p.title}</td>
                    <td className="px-4 py-3">{p.brand}</td>
                    <td className="px-4 py-3">{p.model}</td>
                    <td className="px-4 py-3">{p.type}</td>
                    <td className="px-4 py-3">${lowest.toFixed(2)}</td>
                    <td className="px-4 py-3">{totalStock}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(p)} className="px-3 py-1 bg-yellow-400 rounded">Edit</button>
                        <button onClick={() => handleDelete(p._id)} className="px-3 py-1 bg-red-500 text-white rounded">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
        <div className="flex gap-2">
          <button className="px-3 py-1 border rounded" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
          <button className="px-3 py-1 border rounded" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
        </div>
      </div>

      {/* Form modal / panel */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-6 z-50">
          <div className="bg-white rounded shadow w-full max-w-6xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{editingProduct ? 'Edit Product' : 'Create Product'}</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-gray-600">Close</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input required minLength={3} placeholder="Title" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} className="border p-2 rounded" />
                {/* Brand can be chosen from registered companies or typed */}
                <div className="flex gap-2">
                  <select value={form.brand} onChange={(e) => setForm({...form, brand: e.target.value})} className="border p-2 rounded flex-1">
                    <option value="">Choose brand (or type)</option>
                    {companies.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                  </select>
                  <input placeholder="Or enter brand" value={form.brand} onChange={(e) => setForm({...form, brand: e.target.value})} className="border p-2 rounded flex-1" />
                </div>
                {/* Model can be chosen from registered models or typed */}
                <div className="flex gap-2">
                  <select value={form.model} onChange={(e) => setForm({...form, model: e.target.value})} className="border p-2 rounded flex-1">
                    <option value="">Choose model (or type)</option>
                    {mobileModels.map(m => <option key={m._id} value={m.name}>{m.name}</option>)}
                  </select>
                  <input placeholder="Or enter model" value={form.model} onChange={(e) => setForm({...form, model: e.target.value})} className="border p-2 rounded flex-1" />
                </div>
                <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} className="border p-2 rounded">
                  <option>Glossy Metal</option>
                  <option>Glossy Metal + Gel</option>
                </select>
              </div>

              <textarea required minLength={10} placeholder="Description" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="w-full border p-2 rounded" rows={3} />

              <div className="grid grid-cols-3 gap-3">
                <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className="border p-2 rounded">
                  <option>Designer</option>
                  <option>Plain</option>
                  <option>Customizable</option>
                </select>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({...form, featured: e.target.checked})} /> Featured</label>
                <input type="file" accept="image/*" multiple onChange={handleFileChange} className="border p-2 rounded" />
              </div>

              {/* image previews */}
              {previewUrls && previewUrls.length > 0 && (
                <div className="flex gap-2 mt-2 overflow-auto">
                  {previewUrls.map((src, idx) => (
                    <img key={idx} src={src} alt={`preview-${idx}`} className="w-20 h-20 object-cover rounded border" />
                  ))}
                </div>
              )}

              {/* validation error */}
              {validationError && <div className="text-red-600">{validationError}</div>}

              <div className="grid grid-cols-3 gap-3">
                <input required placeholder="Variant color" minLength={2} value={form.variantColor} onChange={(e) => setForm({...form, variantColor: e.target.value})} className="border p-2 rounded" />
                <input required placeholder="Variant price" value={form.variantPrice} onChange={(e) => setForm({...form, variantPrice: e.target.value})} className="border p-2 rounded" />
                <input required placeholder="Variant stock" value={form.variantStock} onChange={(e) => setForm({...form, variantStock: e.target.value})} className="border p-2 rounded" />
              </div>

              <div className="flex items-center gap-2 justify-end">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
