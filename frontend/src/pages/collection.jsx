import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiCheckCircle, FiImage, FiSmartphone, FiTrash2, FiUpload } from 'react-icons/fi';
import collectionAPI from '../api/collectionAPI';
import mobileAPI from '../api/mobileAPI';
import { FALLBACK_MOBILE_COMPANIES } from '../data/fallbackMobileCompanies';
import { addToCart } from '../redux/slices/cartSlice';
import { formatPrice, resolveImageUrl, SCREEN_RECT } from '../utils/helpers';

const emptyMeta = {
  title: '',
  description: '',
  tagline: '',
  accentColor: '#0ea5e9',
};

const DEFAULT_FRAME = '/frames/frame-1-fixed.svg';
const COLLECTION_CASE_PRICE = 599;
const slugifyId = (value) => {
  const parsed = String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '') || 'x';
  return parsed;
};

const CollectionPage = () => {
  const { handle } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'admin';

  const galleryRef = useRef(null);
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const [metaDraft, setMetaDraft] = useState(emptyMeta);
  const [uploading, setUploading] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createDraft, setCreateDraft] = useState({ ...emptyMeta, title: '', handle: handle || '' });
  const [selectedImage, setSelectedImage] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);
  const [catalogError, setCatalogError] = useState('');

  const loadCollection = useCallback(async () => {
    if (!handle) return;
    setLoading(true);
    setError('');
    setNotFound(false);
    try {
      const res = await collectionAPI.getByHandle(handle);
      const data = res.data?.data?.collection;
      setCollection(data || null);
      if (!data) {
        setNotFound(true);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setCollection(null);
        setNotFound(true);
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to load collection');
      }
    } finally {
      setLoading(false);
    }
  }, [handle]);

  useEffect(() => {
    loadCollection();
  }, [loadCollection]);

  useEffect(() => {
    if (collection) {
      setMetaDraft({
        title: collection.title || '',
        description: collection.description || '',
        tagline: collection.tagline || '',
        accentColor: collection.accentColor || '#0ea5e9',
      });
    }
  }, [collection]);

  useEffect(() => {
    let ignore = false;
    const fetchCompanies = async () => {
      try {
        setLoadingCompanies(true);
        setCatalogError('');
        const response = await mobileAPI.getCompanies({ limit: 100 });
        const fetched = response?.data?.data?.companies || [];
        if (ignore) return;
        if (fetched.length) {
          setCompanies(fetched);
        } else {
          setCompanies(FALLBACK_MOBILE_COMPANIES);
          setCatalogError('Live catalog is offline, showing our most requested devices.');
        }
      } catch (err) {
        if (ignore) return;
        setCompanies(FALLBACK_MOBILE_COMPANIES);
        setCatalogError('Live catalog is offline, showing our most requested devices.');
      } finally {
        if (!ignore) setLoadingCompanies(false);
      }
    };

    fetchCompanies();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedCompany) {
      setModels([]);
      setSelectedModel(null);
      setLoadingModels(false);
      return;
    }

    if (selectedCompany.__isFallback) {
      const fallbackModels = selectedCompany.models || [];
      setModels(fallbackModels);
      setSelectedModel(fallbackModels[0] || null);
       setLoadingModels(false);
      return;
    }

    let cancelled = false;
    const fetchModels = async () => {
      try {
        setLoadingModels(true);
        const response = await mobileAPI.getModels({ company: selectedCompany._id, limit: 200 });
        const fetchedModels = response?.data?.data?.models || [];
        if (!cancelled) {
          setModels(fetchedModels);
          setSelectedModel(fetchedModels[0] || null);
        }
      } catch (err) {
        if (!cancelled) {
          setModels([]);
          setSelectedModel(null);
          toast.error('Unable to load models for this brand. Please try again.');
        }
      } finally {
        if (!cancelled) setLoadingModels(false);
      }
    };

    fetchModels();
    return () => {
      cancelled = true;
    };
  }, [selectedCompany]);

  const galleryImages = useMemo(() => collection?.images || [], [collection]);
  const accent = metaDraft.accentColor || '#0ea5e9';
  const selectedImageUrl = useMemo(() => {
    if (!selectedImage) return '';
    const source = typeof selectedImage === 'string'
      ? selectedImage
      : selectedImage.url || selectedImage.secure_url || selectedImage.path || selectedImage.publicUrl || selectedImage.previewUrl || '';
    return resolveImageUrl(source);
  }, [selectedImage]);

  const selectedFrame = useMemo(() => {
    const candidate = selectedModel?.framePath
      || (selectedModel?.images?.[0] || null)
      || selectedCompany?.previewFrame
      || DEFAULT_FRAME;
    const resolved = resolveImageUrl(candidate);
    return resolved || DEFAULT_FRAME;
  }, [selectedModel, selectedCompany]);

  const builderReady = Boolean(selectedImage && selectedCompany && selectedModel);

  const scrollToGallery = () => {
    galleryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    if (!galleryImages.length) {
      setSelectedImage(null);
      return;
    }
    setSelectedImage((prev) => {
      if (!prev) return galleryImages[0];
      const stillExists = galleryImages.find((image) => (image._id && prev?._id && image._id === prev._id) || (!image._id && image.url === prev?.url));
      return stillExists || galleryImages[0];
    });
  }, [galleryImages]);

  const handleMetaChange = (event) => {
    const { name, value } = event.target;
    setMetaDraft((prev) => ({ ...prev, [name]: value }));
  };

  const handleArtworkSelect = (image) => {
    setSelectedImage(image);
  };

  const handleCompanySelect = (event) => {
    const companyId = event.target.value;
    const company = companies.find((item) => item._id === companyId) || null;
    setSelectedCompany(company);
  };

  const handleModelSelect = (event) => {
    const modelId = event.target.value;
    const model = models.find((item) => item._id === modelId) || null;
    setSelectedModel(model);
  };

  const buildCartBlueprint = () => {
    if (!collection || !selectedImage || !selectedCompany || !selectedModel) return null;
    const baseId = slugifyId(collection._id || collection.handle || 'collection');
    const modelKey = slugifyId(selectedModel._id || selectedModel.slug || selectedModel.name || 'model');
    const imageKey = slugifyId(selectedImage._id || selectedImage.publicId || selectedImage.url || selectedImage.caption || 'art');
    const productId = `custom_collection_${baseId}_${modelKey}_${imageKey}`;
    const variantId = `${productId}_variant`;
    const product = {
      _id: productId,
      title: `${collection.title} - Custom Case`,
      brand: selectedCompany.name,
      model: selectedModel.name,
      design: {
        imgSrc: selectedImageUrl,
        frame: selectedFrame,
        transform: { x: 0, y: 0, scale: 1 },
        meta: {
          collectionId: collection._id,
          collectionHandle: collection.handle,
          collectionTitle: collection.title,
          imageId: selectedImage._id || selectedImage.publicId || selectedImage.url || imageKey,
          company: selectedCompany.name,
          model: selectedModel.name,
        },
      },
    };
    const variant = {
      _id: variantId,
      price: COLLECTION_CASE_PRICE,
      stock: 50,
      color: selectedModel.color || 'Matte Black',
      name: 'Custom Print',
    };
    return { product, variant };
  };

  const handleCartAction = (mode = 'cart') => {
    const blueprint = buildCartBlueprint();
    if (!blueprint) {
      toast.info('Pick an artwork, company and model to continue.');
      return;
    }
    dispatch(addToCart({ ...blueprint, quantity: 1 }));
    if (mode === 'buy') {
      toast.success('Design locked! Redirecting to checkout.');
      navigate('/checkout');
    } else {
      toast.success('Design added to your cart.');
    }
  };

  const handleMetaSave = async (event) => {
    event.preventDefault();
    if (!collection?._id) return;
    setSavingMeta(true);
    try {
      await collectionAPI.adminUpdate(collection._id, metaDraft);
      toast.success('Collection updated');
      await loadCollection();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update collection');
    } finally {
      setSavingMeta(false);
    }
  };

  const handleUploadImages = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length || !collection?._id) return;
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    setUploading(true);
    try {
      await collectionAPI.adminAddImages(collection._id, formData);
      toast.success('Images uploaded');
      await loadCollection();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload images');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleRemoveImage = async (imageId) => {
    if (!collection?._id) return;
    const confirmed = window.confirm('Remove this image from the collection?');
    if (!confirmed) return;
    try {
      await collectionAPI.adminRemoveImage(collection._id, imageId);
      toast.success('Image removed');
      await loadCollection();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove image');
    }
  };

  const handleCreateChange = (event) => {
    const { name, value } = event.target;
    setCreateDraft((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateCollection = async (event) => {
    event.preventDefault();
    if (!createDraft.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setCreating(true);
    try {
      await collectionAPI.adminCreate({
        title: createDraft.title,
        description: createDraft.description,
        tagline: createDraft.tagline,
        accentColor: createDraft.accentColor,
        handle: createDraft.handle || handle,
      });
      toast.success('Collection created');
      await loadCollection();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create collection');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCollection = async () => {
    if (!collection?._id) return;
    const confirmed = window.confirm('Delete this entire collection? This cannot be undone.');
    if (!confirmed) return;
    try {
      await collectionAPI.adminDelete(collection._id);
      toast.success('Collection deleted');
      setCollection(null);
      setNotFound(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete collection');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-600">Loading collection...</div>
    );
  }

  if (notFound && !isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="bg-white rounded-3xl shadow-xl px-10 py-12 max-w-lg">
          <p className="text-3xl font-semibold text-gray-900">Collection not found</p>
          <p className="text-gray-600 mt-3">
            We could not find this collection. Please pick another theme from the library.
          </p>
          <div className="mt-6 flex flex-wrap gap-4 justify-center">
            <Link to="/themes" className="px-6 py-3 rounded-full bg-primary-600 text-white font-semibold">Browse Themes</Link>
            <Link to="/" className="px-6 py-3 rounded-full bg-gray-100 text-gray-900 font-semibold">Back home</Link>
          </div>
        </div>
      </div>
    );
  }

  if (notFound && isAdmin) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="flex items-center gap-3 text-gray-500 text-sm uppercase tracking-[0.4em]">
            <FiImage />
            COLLECTOR
          </div>
          <h1 className="text-3xl font-semibold text-gray-900 mt-4">Create a new collection</h1>
          <p className="text-gray-600 mt-2">No collection exists for handle "{handle}". You can create one below.</p>
          <form className="mt-6 space-y-4" onSubmit={handleCreateCollection}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input name="title" value={createDraft.title} onChange={handleCreateChange} className="w-full border rounded-xl px-4 py-2" placeholder="Marble Edition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Handle / URL</label>
              <input name="handle" value={createDraft.handle} onChange={handleCreateChange} className="w-full border rounded-xl px-4 py-2" placeholder="1" />
              <p className="text-xs text-gray-500 mt-1">Full URL: http://localhost:3000/collection/{createDraft.handle || handle}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
              <input name="tagline" value={createDraft.tagline} onChange={handleCreateChange} className="w-full border rounded-xl px-4 py-2" placeholder="Luxury swirls, golden streaks" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" value={createDraft.description} onChange={handleCreateChange} rows={4} className="w-full border rounded-2xl px-4 py-3" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Accent color</label>
              <input type="color" name="accentColor" value={createDraft.accentColor} onChange={handleCreateChange} className="w-24 h-10 rounded" />
            </div>
            <button type="submit" disabled={creating} className="px-6 py-3 rounded-full bg-primary-600 text-white font-semibold">
              {creating ? 'Creating...' : 'Create collection'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-600">
        {error || 'Collection unavailable'}
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      <div className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center gap-3 text-sm text-gray-500">
          <Link to="/themes" className="flex items-center gap-2 text-primary-600 font-semibold">
            <FiArrowLeft className="h-4 w-4" />
            Themes
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-semibold">{collection.title}</span>
        </div>
      </div>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-8 grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="space-y-6">
          <div ref={galleryRef} className="bg-white rounded-4xl shadow-xl p-8">
            <p className="uppercase text-xs tracking-[0.4em] text-gray-400">Collection</p>
            <h1 className="text-4xl font-semibold text-gray-900 mt-3">{collection.title}</h1>
            {collection.tagline && (
              <p className="text-lg text-gray-600 mt-3">{collection.tagline}</p>
            )}
            {collection.description && (
              <p className="text-gray-600 mt-4 leading-relaxed">{collection.description}</p>
            )}

            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-[0.4em]">Step 1</p>
                  <h2 className="text-2xl font-semibold text-gray-900">Image board</h2>
                  <p className="text-sm text-gray-500 mt-1">Tap any artwork to move it into the builder below.</p>
                </div>
                {isAdmin && (
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer text-sm font-semibold" style={{ borderColor: accent, color: accent }}>
                    <FiUpload />
                    {uploading ? 'Uploading...' : 'Upload images'}
                    <input type="file" className="hidden" multiple accept="image/*" onChange={handleUploadImages} disabled={uploading} />
                  </label>
                )}
              </div>

              {galleryImages.length === 0 ? (
                <div className="border border-dashed border-gray-300 rounded-3xl p-10 text-center text-gray-500">
                  No images yet. {isAdmin ? 'Upload your first shot to bring this page to life.' : 'Please check back soon.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {galleryImages.map((image) => {
                    const key = image._id || image.publicId || image.url;
                    const tileSrc = resolveImageUrl(image.url || image.secure_url || image.path || image.publicUrl || '');
                    const isChosen = selectedImage && ((image._id && selectedImage._id === image._id) || (!image._id && selectedImage.url === image.url));
                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => handleArtworkSelect(image)}
                        className={`relative group rounded-3xl overflow-hidden shadow-sm border transition ${isChosen ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-100 hover:border-primary-200'}`}
                      >
                        <img src={tileSrc} alt={image.caption || collection.title} className="h-64 w-full object-cover" loading="lazy" />
                        {isChosen && (
                          <span className="absolute top-4 left-4 inline-flex items-center gap-1 bg-white/90 text-primary-600 text-xs font-semibold px-3 py-1 rounded-full">
                            <FiCheckCircle className="h-4 w-4" />
                            Selected
                          </span>
                        )}
                        {isAdmin && (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleRemoveImage(image._id);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                event.stopPropagation();
                                handleRemoveImage(image._id);
                              }
                            }}
                            className="absolute top-4 right-4 bg-white/90 rounded-full p-2 text-red-600 shadow opacity-0 group-hover:opacity-100 transition"
                            title="Delete image"
                          >
                            <FiTrash2 />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-4xl shadow-xl p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Custom studio</p>
                <h2 className="text-3xl font-semibold text-gray-900 mt-2">Build your framed cover</h2>
                <p className="text-gray-500 mt-1">Pick artwork, choose your device, preview the fit, then lock it with cart or buy now.</p>
              </div>
              <div className="px-4 py-2 rounded-full bg-primary-50 text-primary-600 font-semibold text-xs uppercase tracking-[0.4em]">Steps 02-06</div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="space-y-6">
                <div className="rounded-3xl border border-gray-100 p-6">
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Step 2</p>
                  <h3 className="text-xl font-semibold text-gray-900 mt-1">Selected artwork</h3>
                  {selectedImage ? (
                    <>
                      <div className="mt-4 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                        <img src={selectedImageUrl} alt={selectedImage.caption || collection.title} className="w-full h-60 object-cover" />
                      </div>
                      {selectedImage.caption && (
                        <p className="mt-3 text-sm text-gray-600">{selectedImage.caption}</p>
                      )}
                      <button
                        type="button"
                        onClick={scrollToGallery}
                        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700"
                      >
                        Change artwork in Image board
                      </button>
                    </>
                  ) : (
                    <div className="mt-4 rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">
                      Select an image from the Image board above to continue.
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border border-gray-100 p-6">
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Step 5</p>
                  <h3 className="text-xl font-semibold text-gray-900">Preview on frame</h3>
                  <div className="mt-6 flex justify-center">
                    <div className="relative w-[260px] h-[520px]">
                      <div
                        className="absolute rounded-[18px] overflow-hidden bg-white shadow-inner"
                        style={{
                          left: `${SCREEN_RECT.left}px`,
                          top: `${SCREEN_RECT.top}px`,
                          width: `${SCREEN_RECT.width}px`,
                          height: `${SCREEN_RECT.height}px`,
                        }}
                      >
                        {selectedImage ? (
                          <img src={selectedImageUrl} alt="Selected artwork" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm text-gray-500 bg-gray-50">
                            Pick an image
                          </div>
                        )}
                      </div>
                      <img src={selectedFrame} alt="Frame preview" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
                    </div>
                  </div>
                  <p className="text-sm text-center text-gray-500 mt-4">The final print wraps edge-to-edge with designer QC.</p>
                </div>
              </div>

              <div className="rounded-3xl border border-gray-100 p-6 space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Step 3</p>
                  <label className="mt-2 flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <FiSmartphone className="text-primary-500" />
                    Choose mobile company
                  </label>
                  <select
                    className="mt-3 w-full rounded-2xl border border-gray-200 px-4 py-3 text-gray-900 focus:border-primary-500 focus:ring-primary-500"
                    value={selectedCompany?._id || ''}
                    onChange={handleCompanySelect}
                    disabled={loadingCompanies}
                  >
                    <option value="">{loadingCompanies ? 'Loading companies...' : 'Select your device brand'}</option>
                    {companies.map((company) => (
                      <option key={company._id} value={company._id}>{company.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Step 4</p>
                  <label className="mt-2 block text-lg font-semibold text-gray-900">Choose mobile model</label>
                  <select
                    className="mt-3 w-full rounded-2xl border border-gray-200 px-4 py-3 text-gray-900 focus:border-primary-500 focus:ring-primary-500"
                    value={selectedModel?._id || ''}
                    onChange={handleModelSelect}
                    disabled={!selectedCompany || loadingModels}
                  >
                    <option value="">
                      {!selectedCompany ? 'Select a brand first' : loadingModels ? 'Loading models...' : models.length ? 'Pick your model' : 'No models for this brand'}
                    </option>
                    {models.map((model) => (
                      <option key={model._id} value={model._id}>{model.name}</option>
                    ))}
                  </select>
                </div>

                {catalogError && (
                  <p className="text-sm text-amber-600 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">{catalogError}</p>
                )}

                <div className="pt-4 border-t border-dashed border-gray-200 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Step 6</p>
                    <div className="flex items-baseline gap-3 mt-2">
                      <span className="text-3xl font-semibold text-gray-900">{formatPrice(COLLECTION_CASE_PRICE)}</span>
                      <span className="text-sm text-gray-500">Free mockup + WhatsApp approval</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => handleCartAction('cart')}
                      disabled={!builderReady}
                      className={`flex-1 inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-semibold transition ${builderReady ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                    >
                      Add to cart
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCartAction('buy')}
                      disabled={!builderReady}
                      className={`flex-1 inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-semibold border transition ${builderReady ? 'border-primary-600 text-primary-600 hover:bg-primary-50' : 'border-gray-200 text-gray-400 cursor-not-allowed'}`}
                    >
                      Buy now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {isAdmin && (
          <aside className="bg-white rounded-4xl shadow-xl p-6 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Admin tools</p>
              <h3 className="text-xl font-semibold text-gray-900 mt-2">Collection settings</h3>
            </div>
            <form className="space-y-4" onSubmit={handleMetaSave}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input name="title" value={metaDraft.title} onChange={handleMetaChange} className="w-full border rounded-xl px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                <input name="tagline" value={metaDraft.tagline} onChange={handleMetaChange} className="w-full border rounded-xl px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" value={metaDraft.description} onChange={handleMetaChange} rows={4} className="w-full border rounded-2xl px-4 py-3" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Accent color</label>
                <input type="color" name="accentColor" value={metaDraft.accentColor} onChange={handleMetaChange} className="w-24 h-10 rounded" />
              </div>
              <button type="submit" className="w-full rounded-full py-3 font-semibold text-white" style={{ backgroundColor: accent }} disabled={savingMeta}>
                {savingMeta ? 'Saving...' : 'Save changes'}
              </button>
            </form>
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500 mb-2">Danger zone</p>
              <button type="button" onClick={handleDeleteCollection} className="w-full flex items-center justify-center gap-2 rounded-full border border-red-200 text-red-600 py-2 text-sm font-semibold">
                <FiTrash2 /> Delete collection
              </button>
            </div>
          </aside>
        )}
      </section>
    </div>
  );
};

export default CollectionPage;