import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import mobileAPI from '../api/mobileAPI';

export default function AdminMobileManagement() {
  const { type } = useParams();
  const initialTab = type === 'models' ? 'models' : type === 'frames' ? 'frames' : 'companies';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [companies, setCompanies] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', company: '', description: '' });

  const [frameSelection, setFrameSelection] = useState({ companyId: '', modelId: '' });
  const [frameMessage, setFrameMessage] = useState('');
  const [frameUploading, setFrameUploading] = useState(false);
  const frameInputRef = useRef(null);

  useEffect(() => {
    if (type && ['companies', 'models', 'frames'].includes(type) && type !== activeTab) {
      setActiveTab(type);
    }
  }, [type, activeTab]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!frameSelection.companyId && companies.length > 0) {
      setFrameSelection((prev) => {
        if (prev.companyId) return prev;
        return { ...prev, companyId: companies[0]._id };
      });
    }
  }, [companies, frameSelection.companyId]);

  useEffect(() => {
    if (frameSelection.companyId && !companies.some((company) => company._id === frameSelection.companyId)) {
      setFrameSelection({ companyId: '', modelId: '' });
    }
  }, [companies, frameSelection.companyId]);

  const filteredFrameModels = useMemo(() => {
    if (!frameSelection.companyId) return [];
    return models.filter((m) => m.company?._id === frameSelection.companyId);
  }, [models, frameSelection.companyId]);

  useEffect(() => {
    if (!frameSelection.companyId) {
      if (frameSelection.modelId) {
        setFrameSelection((prev) => ({ ...prev, modelId: '' }));
      }
      return;
    }
    if (!filteredFrameModels.length) {
      if (frameSelection.modelId) {
        setFrameSelection((prev) => ({ ...prev, modelId: '' }));
      }
      return;
    }
    const hasSelected = filteredFrameModels.some((m) => m._id === frameSelection.modelId);
    if (!hasSelected) {
      setFrameSelection((prev) => ({ ...prev, modelId: filteredFrameModels[0]._id }));
    }
  }, [filteredFrameModels, frameSelection.companyId, frameSelection.modelId]);

  const selectedFrameModel = useMemo(() => {
    return models.find((m) => m._id === frameSelection.modelId) || null;
  }, [models, frameSelection.modelId]);

  async function fetchData() {
    setLoading(true);
    setError('');
    try {
      const [cRes, mRes] = await Promise.all([mobileAPI.adminListCompanies(), mobileAPI.adminListModels()]);
      setCompanies(cRes.data?.data?.companies || []);
      setModels(mRes.data?.data?.models || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  function handleTabChange(tab) {
    setActiveTab(tab);
    setError('');
    setFrameMessage('');
    setShowForm(false);
  }

  function openCreate() {
    setEditing(null);
    setForm({ name: '', company: activeTab === 'models' ? (companies?.[0]?._id || '') : '', description: '' });
    setShowForm(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({
      name: item.name || '',
      company: activeTab === 'models' ? (item.company?._id || '') : '',
      description: item.description || ''
    });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'models' && !form.company) throw new Error('Company is required');
      if (activeTab === 'companies') {
        if (editing) await mobileAPI.adminUpdateCompany(editing._id, { name: form.name, description: form.description });
        else await mobileAPI.adminCreateCompany({ name: form.name, description: form.description });
      } else {
        if (editing) await mobileAPI.adminUpdateModel(editing._id, form);
        else await mobileAPI.adminCreateModel(form);
      }
      setShowForm(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, entityLabel) {
    if (!window.confirm(`Delete this ${entityLabel}?`)) return;
    setLoading(true);
    setError('');
    try {
      if (entityLabel === 'company') await mobileAPI.adminDeleteCompany(id);
      else await mobileAPI.adminDeleteModel(id);
      fetchData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadFrames(event) {
    const files = Array.from(event.target.files || []);
    if (!frameSelection.modelId || files.length === 0) {
      if (frameInputRef.current) frameInputRef.current.value = '';
      return;
    }
    setFrameMessage('');
    setError('');
    setFrameUploading(true);
    try {
      const res = await mobileAPI.adminUploadModelFrames(frameSelection.modelId, files);
      const updated = res.data?.data;
      if (updated) {
        setModels((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
        setFrameMessage(`Uploaded ${files.length} frame${files.length > 1 ? 's' : ''} successfully.`);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to upload frames');
    } finally {
      setFrameUploading(false);
      if (frameInputRef.current) frameInputRef.current.value = '';
    }
  }

  async function handleDeleteFrame(frameId) {
    if (!frameSelection.modelId || !frameId) return;
    if (!window.confirm('Remove this frame image?')) return;
    setError('');
    setFrameMessage('');
    try {
      const res = await mobileAPI.adminDeleteModelFrame(frameSelection.modelId, frameId);
      const updated = res.data?.data;
      if (updated) {
        setModels((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to delete frame');
    }
  }

  const isCompanies = activeTab === 'companies';
  const isModels = activeTab === 'models';
  const isFrames = activeTab === 'frames';
  const data = isCompanies ? companies : isModels ? models : [];

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wide">Mobile catalog</p>
          <h1 className="text-2xl font-semibold">Admin — Mobile Management</h1>
        </div>
        {!isFrames && (
          <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={openCreate}>
            New {isCompanies ? 'Company' : 'Model'}
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap gap-3">
          {[
            { key: 'companies', label: 'Companies' },
            { key: 'models', label: 'Models' },
            { key: 'frames', label: 'Mobile Frames' }
          ].map((tab) => (
            <button
              key={tab.key}
              className={`px-4 py-2 rounded ${activeTab === tab.key ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => handleTabChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      {isFrames ? (
        <div className="bg-white shadow rounded p-6">
          <div className="space-y-6">
            <p className="text-gray-600">
              Complete the first two steps (company & model) before uploading custom phone frame images.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold mb-2">Step 1 · Select company</label>
                <select
                  value={frameSelection.companyId}
                  onChange={(e) => setFrameSelection({ companyId: e.target.value, modelId: '' })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Choose company</option>
                  {companies.map((company) => (
                    <option key={company._id} value={company._id}>{company.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Only companies you create will appear here.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Step 2 · Select model</label>
                <select
                  value={frameSelection.modelId}
                  onChange={(e) => setFrameSelection((prev) => ({ ...prev, modelId: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  disabled={!frameSelection.companyId || filteredFrameModels.length === 0}
                >
                  {!frameSelection.companyId && <option value="">Pick a company first</option>}
                  {frameSelection.companyId && filteredFrameModels.length === 0 && <option value="">No models yet</option>}
                  {filteredFrameModels.map((model) => (
                    <option key={model._id} value={model._id}>{model.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Models linked to the selected company are listed.</p>
              </div>
            </div>

            <div className="border-t pt-6">
              <label className="block text-sm font-semibold mb-2">Step 3 · Upload frame images</label>
              <input
                ref={frameInputRef}
                type="file"
                accept="image/*"
                multiple
                disabled={!selectedFrameModel || frameUploading}
                onChange={handleUploadFrames}
                className="w-full border border-dashed rounded px-3 py-4 text-sm text-gray-600 cursor-pointer disabled:opacity-50"
              />
              <p className="text-xs text-gray-500 mt-2">Use transparent PNG files that match your device mockups.</p>
              {frameUploading && <p className="text-sm text-blue-600 mt-2">Uploading frames…</p>}
              {frameMessage && <p className="text-sm text-green-600 mt-2">{frameMessage}</p>}
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Uploaded frames</h3>
              {selectedFrameModel ? (
                selectedFrameModel.images && selectedFrameModel.images.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {selectedFrameModel.images.map((img) => (
                      <div key={img._id || img.publicId} className="border rounded-lg overflow-hidden bg-gray-50">
                        <div className="h-64 bg-white flex items-center justify-center border-b">
                          {img.url ? (
                            <img src={img.url} alt={`${selectedFrameModel.name} frame`} className="max-h-full max-w-full" />
                          ) : (
                            <span className="text-gray-400">No preview</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between px-3 py-2 text-sm">
                          <span className="truncate pr-2">{img.publicId || 'frame'}</span>
                          <button
                            type="button"
                            className="text-red-600 hover:underline"
                            onClick={() => handleDeleteFrame(img._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No frames uploaded for this model yet.</p>
                )
              ) : (
                <p className="text-gray-500">Select a company and model to start uploading frames.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded overflow-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">{isCompanies ? 'Name' : 'Model'}</th>
                {!isCompanies && <th className="px-4 py-2 text-left">Company</th>}
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={isCompanies ? 3 : 4} className="p-6 text-center">Loading...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={isCompanies ? 3 : 4} className="p-6 text-center">No {isCompanies ? 'companies' : 'models'} yet</td></tr>
              ) : (
                data.map((item) => (
                  <tr key={item._id} className="border-t">
                    <td className="px-4 py-3">{item.name}</td>
                    {!isCompanies && <td className="px-4 py-3">{item.company?.name}</td>}
                    <td className="px-4 py-3">{item.description}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(item)} className="px-3 py-1 bg-yellow-400 rounded">Edit</button>
                        <button onClick={() => handleDelete(item._id, isCompanies ? 'company' : 'model')} className="px-3 py-1 bg-red-500 text-white rounded">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && !isFrames && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-6 z-50">
          <div className="bg-white rounded shadow w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{editing ? `Edit ${isCompanies ? 'company' : 'model'}` : `Create ${isCompanies ? 'company' : 'model'}`}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-600">Close</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                required
                minLength={2}
                placeholder={isCompanies ? 'Name' : 'Model name'}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="border p-2 rounded w-full"
              />
              {!isCompanies && (
                <select
                  required
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="border p-2 rounded w-full"
                >
                  <option value="">Select company</option>
                  {companies.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              )}
              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="border p-2 rounded w-full"
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
