import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getUserProfile, updateProfile } from '../redux/slices/authSlice';
import authAPI from '../api/authAPI';
import customDesignAPI from '../api/customDesignAPI'
import { useNavigate } from 'react-router-dom'
import { useDispatch as useReduxDispatch } from 'react-redux'
import { addToCart } from '../redux/slices/cartSlice'
import { formatDate, SCREEN_RECT } from '../utils/helpers'
import { PageLoader } from '../components/Loader';
import { toast } from 'react-toastify';

export default function Profile() {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);

  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [addingAddress, setAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ name: '', phone: '', street: '', city: '', state: '', zipCode: '', country: 'India' });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const reduxDispatch = useReduxDispatch();

  const [designs, setDesigns] = useState([]);
  const [designsLoading, setDesignsLoading] = useState(true);

  useEffect(() => {
    if (!user) dispatch(getUserProfile());
    // load user's saved designs
    if (user) loadDesigns();
  }, [dispatch, user]);

  const loadDesigns = async () => {
    setDesignsLoading(true);
    try {
      const res = await customDesignAPI.getMyDesigns();
      setDesigns(res.data?.designs || []);
    } catch (e) {
      console.debug('failed to load designs', e);
    } finally {
      setDesignsLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await dispatch(updateProfile({ name: form.name, phone: form.phone }));
      if (updateProfile.fulfilled.match(result)) {
        toast.success('Profile updated');
        dispatch(getUserProfile());
      } else {
        toast.error(result.payload || 'Update failed');
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      await authAPI.addAddress(newAddress);
      toast.success('Address added');
      setNewAddress({ name: '', phone: '', street: '', city: '', state: '', zipCode: '', country: 'India' });
      setAddingAddress(false);
      dispatch(getUserProfile());
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to add address');
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await authAPI.deleteAddress(id);
      toast.success('Address removed');
      dispatch(getUserProfile());
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete address');
    }
  };

  const handleEditDesign = (d) => {
    try {
      sessionStorage.setItem('currentDesign', JSON.stringify({ frame: d.frame || '/frames/frame-1.svg', imgSrc: d.imgSrc, transform: d.transform, meta: d.meta }));
      sessionStorage.setItem('editingCustomId', 'custom_' + d._id);
    } catch (e) { console.debug('failed to set editing keys', e); }
    const meta = d.meta || {};
    const hasMeta = !!(meta.company || meta.model || meta.type);
    const pid = encodeURIComponent(`${meta.company || ''}__${meta.model || ''}__${meta.type || ''}`);
    if (hasMeta) navigate(`/customizer/${pid}`); else navigate('/customizer');
  }

  const handleAddDesignToCart = (d) => {
    const id = `custom_${d._id}`;
    const product = { _id: id, title: `${d.meta?.company || 'Custom'} ${d.meta?.model || ''} - Custom Cover`, images: [d.frame || '/frames/frame-1.svg'], design: { frame: d.frame, imgSrc: d.imgSrc, transform: d.transform, meta: d.meta, savedId: d._id } };
    const variant = { _id: `v_${d._id}`, name: d.meta?.type || 'Custom Cover', price: (d.meta?.type || '').toLowerCase() === 'glass' ? 699 : 399, stock: 100, color: d.meta?.type || 'Custom' };
    reduxDispatch(addToCart({ product, variant, quantity: 1 }));
    toast.success('Design added to cart');
  }

  const handleDeleteDesign = async (d) => {
    if (!confirm('Delete this design?')) return;
    try {
      await customDesignAPI.deleteDesign(d._id);
      toast.success('Design deleted');
      loadDesigns();
    } catch (e) { toast.error('Delete failed'); }
  }

  if (loading && !user) return <PageLoader />;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">My Profile</h2>

      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full name</label>
            <input name="name" value={form.name} onChange={handleChange} className="mt-1 block w-full border rounded px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input name="email" value={form.email} disabled className="mt-1 block w-full border rounded px-3 py-2 bg-gray-50" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} className="mt-1 block w-full border rounded px-3 py-2" />
          </div>

          <div className="flex items-center space-x-2">
            <button disabled={saving} type="submit" className="bg-primary-600 text-white px-4 py-2 rounded disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Addresses</h3>
          <button onClick={() => setAddingAddress((v) => !v)} className="text-sm px-3 py-1 border rounded">
            {addingAddress ? 'Cancel' : 'Add Address'}
          </button>
        </div>

        {addingAddress && (
          <form onSubmit={handleAddAddress} className="space-y-2 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input placeholder="Name" required value={newAddress.name} onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })} className="border rounded px-2 py-1" />
              <input placeholder="Phone" required value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} className="border rounded px-2 py-1" />
              <input placeholder="Street" value={newAddress.street} onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })} className="border rounded px-2 py-1 col-span-2" />
              <input placeholder="City" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} className="border rounded px-2 py-1" />
              <input placeholder="State" value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} className="border rounded px-2 py-1" />
              <input placeholder="Zip code" value={newAddress.zipCode} onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })} className="border rounded px-2 py-1" />
              <input placeholder="Country" value={newAddress.country} onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })} className="border rounded px-2 py-1" />
            </div>
            <div>
              <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded">Add Address</button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {(user?.addresses || []).length === 0 && (
            <div className="text-sm text-gray-600">No saved addresses yet.</div>
          )}

          {(user?.addresses || []).map((addr) => (
            <div key={addr._id || addr.id || `${addr.street}-${addr.phone}`} className="border rounded p-3 flex items-start justify-between">
              <div>
                <div className="font-medium">{addr.name} {addr.isDefault ? <span className="text-xs text-green-600 ml-2">(Default)</span> : null}</div>
                <div className="text-sm text-gray-700">{addr.phone}</div>
                <div className="text-sm text-gray-600 mt-1">{[addr.street, addr.city, addr.state, addr.zipCode, addr.country].filter(Boolean).join(', ')}</div>
              </div>

              <div className="flex flex-col items-end space-y-2">
                <button onClick={() => handleDeleteAddress(addr._id || addr.id)} className="text-sm text-red-600">Delete</button>
              </div>
            </div>
          ))}
        </div>
          </div>

          {/* My saved designs panel */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">My Saved Designs</h3>
              <button onClick={() => navigate('/my-designs')} className="text-sm px-3 py-1 border rounded">Manage</button>
            </div>

            {designsLoading ? (
              <div className="text-sm text-gray-600 p-6">Loading designs…</div>
            ) : (
              <div>
                {designs.length === 0 ? (
                  <div className="text-sm text-gray-600">You have no saved designs yet. Create a design in the Customizer and it will appear here.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {designs.slice(0,6).map(d => (
                      <div key={d._id} className="bg-gray-50 rounded p-3 border relative">
                        <div className="w-full h-40 bg-gray-100 rounded overflow-hidden relative mb-3">
                          {d.imgSrc && (
                            (() => {
                              const thumbW = 260; const scale = 160/thumbW;
                              const sx = SCREEN_RECT.left * scale; const sy = SCREEN_RECT.top * scale; const sw = SCREEN_RECT.width * scale; const sh = SCREEN_RECT.height * scale;
                              const t = d.transform || { x:0,y:0,scale:1 };
                              const style = { position:'absolute', left:`${sx + (sw/2)}px`, top:`${sy + (sh/2)}px`, transform:`translate(-50%,-50%) translate(${t.x*scale}px, ${t.y*scale}px) scale(${t.scale})`, width:`${thumbW*scale}px` };
                              return (
                                <>
                                  <div style={{position:'absolute', left:sx, top:sy, width:sw, height:sh, overflow:'hidden', background:'#fff'}}>
                                    <img src={d.imgSrc} alt={d.name||'design'} style={style} />
                                  </div>
                                  {d.frame && <img src={d.frame} alt="frame" className="absolute inset-0 w-full h-full object-cover" />}
                                </>
                              )
                            })()
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-sm line-clamp-1">{d.name || `${d.meta?.company || 'Custom'} ${d.meta?.model || ''}`}</div>
                            <div className="text-xs text-gray-500">Saved {formatDate(d.createdAt)}</div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex space-x-2">
                              <button onClick={() => handleEditDesign(d)} className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded">Edit</button>
                              <button onClick={() => handleAddDesignToCart(d)} className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded">Add to cart</button>
                            </div>
                            <button onClick={() => handleDeleteDesign(d)} className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded">Delete</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
    </div>
  );
}
