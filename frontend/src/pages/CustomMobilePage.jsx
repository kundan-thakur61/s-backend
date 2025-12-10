import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  FiCamera,
  FiCheckCircle,
  FiChevronDown,
  FiImage,
  FiMinus,
  FiPackage,
  FiPlus,
  FiShield,
  FiSmartphone,
  FiStar,
  FiTruck,
  FiUpload,
  FiZap,
  FiX,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import mobileAPI from '../api/mobileAPI';
import Loader from '../components/Loader';
import { formatPrice, resolveImageUrl } from '../utils/helpers';
import { createCustomOrder, createCustomPayment, verifyCustomPayment } from '../redux/slices/customSlice';
import { FALLBACK_MOBILE_COMPANIES } from '../data/fallbackMobileCompanies';

const MATERIAL_OPTIONS = [
  {
    id: 'polycarbonate',
    label: 'Premium Polycarbonate',
    subtitle: 'Matte, scratch resistant daily driver',
    price: 199,
    originalPrice: 399,
    perks: ['Feather-light', 'Anti-fade UV print'],
  },
  {
    id: 'tempered-glass',
    label: 'Tempered Glass Elite',
    subtitle: 'Glossy + camera ring + velvet inside',
    price: 249,
    originalPrice: 449,
    perks: ['High-gloss finish', 'Anti-slip grip'],
  },
  {
    id: 'magsafe-clear',
    label: 'MagSafe Transparent',
    subtitle: 'Crystal clear, anti-yellow MagSafe loop',
    price: 299,
    originalPrice: 549,
    perks: ['Built-in magnets', 'Drop tested 3ft'],
  },
];

const FEATURE_HIGHLIGHTS = [
  {
    icon: FiShield,
    title: '360° Protection',
    description: 'Raised edges for camera + screen with shock-absorbing TPU corners.',
  },
  {
    icon: FiImage,
    title: 'Edge-to-edge Print',
    description: '3D sublimation printing wraps artwork across every single curve.',
  },
  {
    icon: FiSmartphone,
    title: 'Perfect Fit',
    description: 'Laser-cut ports, tactile buttons and MagSafe friendliness guaranteed.',
  },
  {
    icon: FiTruck,
    title: 'Dispatch in 24H',
    description: 'Printed, QC-ed and shipped from our Neemuch (M.P.) studio within a day.',
  },
];

const TIMELINE_STEPS = [
  {
    title: 'Upload your photo',
    description: 'Share a high-resolution image or artwork. JPG, PNG and HEIC supported.',
    meta: 'Takes 1 minute',
  },
  {
    title: 'Designer polish',
    description: 'Our team cleans, crops and aligns your image to your phone template.',
    meta: 'Within 2 hours',
  },
  {
    title: 'UV print & QC',
    description: 'Industrial UV printers transfer the design with scratch-proof coating.',
    meta: 'Print takes 15 min',
  },
  {
    title: 'Express shipping',
    description: 'We bubble-wrap, box and handover to Bluedart, Delhivery or DTDC.',
    meta: '3-5 day delivery',
  },
];

const FAQS = [
  {
    id: 'quality',
    question: 'What image quality do you need?',
    answer: 'Upload a file above 1MB for crisp results. If the image is low resolution, our designer will reach out on WhatsApp before printing.',
  },
  {
    id: 'shipping',
    question: 'How fast can you deliver?',
    answer: 'Orders placed before 2 PM are typically dispatched the same day. Metro cities receive the case in 2-3 working days, others in 3-5 days.',
  },
  {
    id: 'changes',
    question: 'Can I preview before printing?',
    answer: 'Absolutely! We share a digital mockup on WhatsApp for approval. You can request edits, change placement or try a different image for free.',
  },
  {
    id: 'return',
    question: 'What if there is an issue with my order?',
    answer: 'We replace manufacturing defects at zero cost. Just share an unpacking video/picture within 48 hours so we can recreate it instantly.',
  },
];

const DEFAULT_FRAME = '/frames/frame-1-fixed.svg';
const ACTIONS_DISABLED = false;

const CustomMobilePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const [companies, setCompanies] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(MATERIAL_OPTIONS[0]);
  const [quantity, setQuantity] = useState(1);
  const [specialNotes, setSpecialNotes] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [openFaq, setOpenFaq] = useState(FAQS[0]?.id || null);
  const [shipping, setShipping] = useState({
    name: user?.name || '',
    phone: user?.phone ? String(user.phone).replace(/[^0-9]/g, '') : '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });
  const [shippingErrors, setShippingErrors] = useState({});
  const [submittingAction, setSubmittingAction] = useState(null);
  const [orderFeedback, setOrderFeedback] = useState(null);
  const builderRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setShipping((prev) => ({
        ...prev,
        name: user.name || prev.name,
        phone: user.phone ? String(user.phone).replace(/[^0-9]/g, '') : prev.phone,
      }));
    }
  }, [user]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoadingCompanies(true);
        const response = await mobileAPI.getCompanies({ limit: 100 });
        const items = response?.data?.data?.companies || [];
        if (items.length) {
          setCompanies(items);
        } else {
          setCompanies(FALLBACK_MOBILE_COMPANIES);
        }
      } catch (error) {
        setCompanies(FALLBACK_MOBILE_COMPANIES);
        setErrorMessage('Unable to reach the catalog right now. Showing our most ordered models instead.');
      } finally {
        setLoadingCompanies(false);
      }
    };

    fetchCompanies();
  }, []);

  useEffect(() => {
    if (!selectedCompany) {
      setModels([]);
      setSelectedModel(null);
      return;
    }

    if (selectedCompany.__isFallback) {
      setModels(selectedCompany.models || []);
      setSelectedModel((selectedCompany.models || [])[0] || null);
      return;
    }

    const fetchModels = async () => {
      try {
        setLoadingModels(true);
        const response = await mobileAPI.getModels({ company: selectedCompany._id, limit: 200 });
        const fetchedModels = response?.data?.data?.models || [];
        setModels(fetchedModels);
        setSelectedModel(fetchedModels[0] || null);
      } catch (error) {
        toast.error('Unable to load models for this brand. Try again in a bit.');
        setModels([]);
        setSelectedModel(null);
      } finally {
        setLoadingModels(false);
      }
    };

    fetchModels();
  }, [selectedCompany]);

  const priceSummary = useMemo(() => {
    const total = (selectedMaterial?.price || 0) * quantity;
    const original = (selectedMaterial?.originalPrice || 0) * quantity;
    const savings = original - total;
    const discount = original ? Math.round((savings / original) * 100) : 0;
    return { total, original, savings, discount: Math.max(discount, 0) };
  }, [selectedMaterial, quantity]);

  const selectedFrame = useMemo(() => {
    if (selectedModel?.framePath) return selectedModel.framePath;
    if (selectedModel?.images?.length) {
      const firstImage = selectedModel.images[0];
      if (typeof firstImage === 'string') return firstImage;
      return resolveImageUrl(firstImage);
    }
    if (selectedCompany?.previewFrame) return selectedCompany.previewFrame;
    return DEFAULT_FRAME;
  }, [selectedModel, selectedCompany]);

  const shippingReady = Boolean(
    shipping.name.trim() &&
    shipping.phone.trim() &&
    shipping.street.trim() &&
    shipping.city.trim() &&
    shipping.state.trim() &&
    shipping.postalCode.trim()
  );

  const canCheckout = Boolean(selectedCompany && selectedModel && imagePreview && shippingReady);

  const handleCompanyChange = (event) => {
    const companyId = event.target.value;
    if (!companyId) {
      setSelectedCompany(null);
      return;
    }
    const company = companies.find((item) => item._id === companyId);
    setSelectedCompany(company || null);
  };

  const handleModelChange = (event) => {
    const modelId = event.target.value;
    const model = models.find((item) => item._id === modelId);
    setSelectedModel(model || null);
  };

  const handleQuantityChange = (direction) => {
    setQuantity((prev) => {
      const next = prev + direction;
      if (next < 1) return 1;
      if (next > 5) return 5;
      return next;
    });
  };

  const handleImageUpload = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Image must be under 8MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (event) => {
    const file = event.target.files?.[0];
    handleImageUpload(file);
  };

  const scrollToBuilder = () => {
    builderRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const showOrderFeedback = (payload) => {
    setOrderFeedback(payload);
  };

  const dismissOrderFeedback = () => {
    setOrderFeedback(null);
  };

  const updateShippingField = (field, value) => {
    setShipping((prev) => ({ ...prev, [field]: value }));
    setShippingErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateShipping = () => {
    const errors = {};
    const trimmedPhone = shipping.phone.trim();
    if (!shipping.name.trim()) errors.name = 'Name is required';
    if (!/^[0-9]{7,15}$/.test(trimmedPhone)) errors.phone = 'Phone must be 7-15 digits';
    if (!shipping.street.trim()) errors.street = 'Street address is required';
    if (!shipping.city.trim()) errors.city = 'City is required';
    if (!shipping.state.trim()) errors.state = 'State is required';
    if (!/^[0-9]{3,10}$/.test(shipping.postalCode.trim())) errors.postalCode = 'Enter a valid postal code';
    if (!shipping.country.trim()) errors.country = 'Country is required';
    setShippingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const loadRazorpayScript = () => new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window is not available'));
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.body.appendChild(script);
  });

  const initiatePayment = async (customOrder) => {
    try {
      await loadRazorpayScript();

      const paymentResponse = await dispatch(createCustomPayment(customOrder._id)).unwrap();
      const paymentData = paymentResponse?.data || paymentResponse;
      const razorpayOrderId = paymentData?.razorpayOrderId || paymentData?.orderId;
      if (!razorpayOrderId) {
        throw new Error('Unable to initialize payment');
      }

      const keyId = paymentData?.keyId || paymentData?.key || import.meta.env.VITE_RAZORPAY_KEY;
      const amount = paymentData?.amount || Math.round((customOrder.price || selectedMaterial.price) * 100);
      const currency = paymentData?.currency || 'INR';

      const options = {
        key: keyId,
        amount,
        currency,
        order_id: razorpayOrderId,
        name: 'Copad Custom Cover',
        description: `Custom order #${customOrder._id}`,
        prefill: {
          name: shipping.name,
          contact: shipping.phone,
        },
        notes: {
          customOrderId: customOrder._id,
          brand: selectedCompany?.name,
          model: selectedModel?.name,
        },
        theme: { color: '#2563eb' },
        handler: async (response) => {
          try {
            await dispatch(verifyCustomPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              customOrderId: customOrder._id,
            })).unwrap();
            toast.success('Payment successful! We will start printing your cover.');
            showOrderFeedback({
              status: 'success',
              title: 'Payment completed',
              message: 'Your artwork heads to printing next. Check progress in custom orders.',
              orderId: customOrder._id,
              ctaLabel: 'View custom orders',
              onCta: () => navigate('/custom-orders'),
            });
          } catch (error) {
            const message = error?.response?.data?.message || error?.message || 'Payment verification failed';
            toast.error(message);
            showOrderFeedback({
              status: 'error',
              title: 'Verification failed',
              message,
              orderId: customOrder._id,
              ctaLabel: 'Retry payment',
              onCta: () => handleSubmit('buy'),
            });
          }
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (resp) => {
        const message = resp.error?.description || 'Payment failed. Please try again.';
        toast.error(message);
        showOrderFeedback({
          status: 'error',
          title: 'Payment failed',
          message,
          orderId: customOrder._id,
          ctaLabel: 'Retry payment',
          onCta: () => handleSubmit('buy'),
        });
      });
      razorpay.open();
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Unable to initiate payment';
      toast.error(message);
      showOrderFeedback({
        status: 'error',
        title: 'Payment setup issue',
        message,
        orderId: customOrder._id,
        ctaLabel: 'Retry payment',
        onCta: () => handleSubmit('buy'),
      });
      throw error;
    }
  };

  const handleSubmit = async (action) => {
    if (!isAuthenticated) {
      toast.error('Please log in to continue');
      navigate('/login');
      return;
    }
    if (!selectedCompany) {
      toast.error('Choose your phone brand first.');
      return;
    }
    if (!selectedModel) {
      toast.error('Pick the exact model to continue.');
      return;
    }
    if (!imagePreview) {
      toast.error('Upload a high quality image for the print.');
      return;
    }

    if (!validateShipping()) {
      toast.error('Please review your shipping details.');
      return;
    }

    const payload = {
      variant: {
        name: selectedMaterial.label,
        color: selectedMaterial.label,
        materialId: selectedMaterial.id,
        price: selectedMaterial.price,
        sku: `custom-${selectedMaterial.id}`,
      },
      quantity,
      imageUrls: [imagePreview],
      mockupUrl: imagePreview,
      instructions: specialNotes,
      designData: {
        companyId: selectedCompany._id,
        companyName: selectedCompany.name,
        modelId: selectedModel._id,
        modelName: selectedModel.name,
        material: selectedMaterial.label,
      },
      shippingAddress: {
        name: shipping.name.trim(),
        phone: shipping.phone.trim(),
        street: shipping.street.trim(),
        address1: shipping.street.trim(),
        city: shipping.city.trim(),
        state: shipping.state.trim(),
        postalCode: shipping.postalCode.trim(),
        zipCode: shipping.postalCode.trim(),
        country: shipping.country.trim() || 'India',
      },
    };

    let createdOrder = null;
    try {
      setSubmittingAction(action);
      const response = await dispatch(createCustomOrder(payload)).unwrap();
      createdOrder = response?.data?.customOrder || response?.customOrder || response?.data;
      if (!createdOrder?._id) {
        throw new Error('Unexpected response from server');
      }

      if (action === 'buy') {
        await initiatePayment(createdOrder);
      } else {
        showOrderFeedback({
          status: 'success',
          title: 'Custom order saved',
          message: 'We will share a WhatsApp preview before printing. Track the status anytime.',
          orderId: createdOrder._id,
          ctaLabel: 'View custom orders',
          onCta: () => navigate('/custom-orders'),
        });
      }
    } catch (error) {
      const message = createdOrder
        ? error?.response?.data?.message || error?.message || 'Failed to initiate payment'
        : error?.response?.data?.message || error?.message || 'Failed to create custom order';
      toast.error(message);
      showOrderFeedback({
        status: 'error',
        title: 'Something went wrong',
        message,
        orderId: createdOrder?._id,
        ctaLabel: createdOrder ? 'Try payment again' : undefined,
        onCta: createdOrder
          ? () => handleSubmit('buy')
          : undefined,
      });
    } finally {
      setSubmittingAction(null);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <p className="text-sm uppercase tracking-[0.3em] text-primary-100">#Trending • Made-to-order</p>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Add Your Image <span className="text-yellow-300">Below</span>
              </h1>
              <p className="text-lg text-blue-100 max-w-xl">
                Craft a one-of-a-kind mobile case with premium UV printing, MagSafe friendly materials
                and 700+ phone models. Exactly like the Copad experience you shared.
              </p>
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <FiStar className="w-5 h-5 text-yellow-300" />
                  <div>
                    <span className="font-semibold">4.9/5</span>
                    <p className="text-blue-100 text-xs">12k+ customer ratings</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FiShield className="w-5 h-5 text-green-200" />
                  <p className="text-blue-100">Lifetime print warranty</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={scrollToBuilder}
                  className="bg-white text-primary-700 px-6 py-3 rounded-lg font-semibold shadow-lg hover:-translate-y-0.5 transition-transform"
                >
                  Start Customising
                </button>
                <button
                  onClick={() => window.open('https://wa.me/7050818061', '_blank')}
                  className="bg-transparent border border-white/60 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10"
                >
                  Chat with a Designer
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-6 shadow-2xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                    <FiCamera className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-wide text-white/70">Premium Custom Case</p>
                    <p className="text-3xl font-semibold">{formatPrice(199)}</p>
                    <p className="text-sm text-white/80">Launch price • incl. taxes</p>
                  </div>
                </div>
                <div className="aspect-[9/19] bg-white/90 rounded-3xl relative overflow-hidden shadow-xl">
                  <div className="absolute inset-4 rounded-[32px] bg-gradient-to-br from-slate-200 to-slate-50" />
                  <div className="absolute inset-6 rounded-[28px] bg-white flex items-center justify-center text-primary-600">
                    Your image lives here
                  </div>
                </div>
                <ul className="mt-6 space-y-2 text-sm text-white/90">
                  <li className="flex items-center gap-2"><FiCheckCircle /> 3D sublimation print</li>
                  <li className="flex items-center gap-2"><FiCheckCircle /> Raised camera lip</li>
                  <li className="flex items-center gap-2"><FiCheckCircle /> Free WhatsApp preview</li>
                </ul>
              </div>
              <div className="absolute -bottom-6 -right-4 bg-white text-primary-700 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold">
                Rs. 199.00 <span className="text-xs text-gray-500 line-through ml-2">Rs. 399.00</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {errorMessage && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
            {errorMessage}
          </div>
        )}

        <section ref={builderRef} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm uppercase tracking-wide text-gray-500">Preview</p>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {selectedModel ? `${selectedModel.name} Cover` : 'Select a model'}
                  </h2>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-primary-50 text-primary-700">
                  {selectedMaterial.label}
                </span>
              </div>
              <div className="relative mx-auto w-64 aspect-[9/19]">
                <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-slate-100 via-white to-slate-100 border border-gray-100" />
                <div className="absolute inset-[18px] rounded-[24px] bg-gray-200 overflow-hidden flex items-center justify-center">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Uploaded preview" className="w-full h-full object-cover" />
                  ) : (
                    <p className="text-gray-500 text-sm text-center px-6">Upload a photo to preview your custom print</p>
                  )}
                </div>
                <img
                  src={selectedFrame}
                  alt="Phone frame"
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />
              </div>
              <p className="mt-4 text-sm text-gray-500 text-center">Kindly upload a high quality image for best results.</p>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-primary-50 p-4">
                  <p className="text-xs uppercase text-primary-600">Total</p>
                  <p className="text-2xl font-bold text-primary-900">{formatPrice(priceSummary.total)}</p>
                  <p className="text-xs text-primary-700">For {quantity} case(s)</p>
                </div>
                <div className="rounded-2xl border border-gray-200 p-4">
                  <p className="text-xs uppercase text-gray-500">You save</p>
                  <p className="text-xl font-semibold text-green-600">{formatPrice(priceSummary.savings)}</p>
                  <p className="text-xs text-gray-500">{priceSummary.discount}% off MRP</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: FiZap, title: 'Printed in 12h', subtitle: 'Speedy batch runs' },
                { icon: FiPackage, title: 'Insured shipping', subtitle: 'Free tamper proof box' },
                { icon: FiShield, title: '1 year warranty', subtitle: 'On peeling or fade' },
              ].map((item) => (
                <div key={item.title} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-2">
                  <item.icon className="w-5 h-5 text-primary-600" />
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-500">{item.subtitle}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 space-y-8">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-wide text-gray-500">Step 1</p>
              <h2 className="text-3xl font-semibold text-gray-900">Build your custom case</h2>
              <p className="text-gray-600">Choose material, phone brand, model and drop your artwork. Exactly like Copad&apos;s custom builder.</p>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-semibold text-gray-700">Material</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {MATERIAL_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedMaterial(option)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selectedMaterial.id === option.id
                        ? 'border-primary-500 bg-primary-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{option.label}</p>
                    <p className="text-sm text-gray-500">{option.subtitle}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-lg font-bold text-primary-700">{formatPrice(option.price)}</span>
                      <span className="text-sm text-gray-400 line-through">{formatPrice(option.originalPrice)}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {option.perks.map((perk) => (
                        <span key={perk} className="text-xs rounded-full bg-white/80 px-2 py-1 border border-gray-200 text-gray-600">
                          {perk}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-semibold text-gray-700" htmlFor="companySelect">
                Phone brand
              </label>
              {loadingCompanies ? (
                <div className="py-6 flex justify-center">
                  <Loader size="sm" />
                </div>
              ) : (
                <select
                  id="companySelect"
                  className="w-full p-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={selectedCompany?._id || ''}
                  onChange={handleCompanyChange}
                >
                  <option value="">Choose your phone brand</option>
                  {companies.map((company) => (
                    <option key={company._id} value={company._id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedCompany && (
              <div className="space-y-4">
                <label className="text-sm font-semibold text-gray-700" htmlFor="modelSelect">
                  Phone model
                </label>
                {loadingModels ? (
                  <div className="py-6 flex justify-center">
                    <Loader size="sm" />
                  </div>
                ) : models.length ? (
                  <select
                    id="modelSelect"
                    className="w-full p-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={selectedModel?._id || ''}
                    onChange={handleModelChange}
                  >
                    {models.map((model) => (
                      <option key={model._id} value={model._id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-gray-500">No models found for this brand yet.</p>
                )}
              </div>
            )}

            <div className="space-y-4">
              <label className="text-sm font-semibold text-gray-700">Upload artwork</label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center cursor-pointer hover:border-primary-400"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInput}
                />
                <FiUpload className="w-10 h-10 text-primary-600 mx-auto mb-3" />
                <p className="font-semibold text-gray-900">Drag & drop or click to upload</p>
                <p className="text-sm text-gray-500">High resolution JPG/PNG up to 8MB • You can also share via WhatsApp later</p>
                {imagePreview && (
                  <button
                    type="button"
                    className="mt-4 text-sm font-semibold text-primary-600"
                    onClick={(event) => {
                      event.stopPropagation();
                      setImagePreview('');
                    }}
                  >
                    Remove image
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Quantity</label>
                <div className="mt-2 flex items-center rounded-2xl border border-gray-200">
                  <button type="button" onClick={() => handleQuantityChange(-1)} className="p-3 text-gray-700">
                    <FiMinus />
                  </button>
                  <span className="flex-1 text-center font-semibold">{quantity}</span>
                  <button type="button" onClick={() => handleQuantityChange(1)} className="p-3 text-gray-700">
                    <FiPlus />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Notes for designer</label>
                <textarea
                  className="mt-2 w-full h-24 p-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Mention color tweaks, text placement or alignment preferences"
                  maxLength={220}
                  value={specialNotes}
                  onChange={(event) => setSpecialNotes(event.target.value)}
                />
                <p className="text-xs text-right text-gray-400">{specialNotes.length}/220</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-gray-500">Step 2</p>
                <h3 className="text-xl font-semibold text-gray-900">Shipping details</h3>
                <p className="text-sm text-gray-500">We deliver pan-India within 3-5 working days.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Full name</label>
                  <input
                    type="text"
                    value={shipping.name}
                    onChange={(event) => updateShippingField('name', event.target.value)}
                    className={`mt-2 w-full rounded-2xl border px-4 py-3 focus:outline-none focus:ring-2 ${
                      shippingErrors.name ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:ring-primary-500'
                    }`}
                    placeholder="Who should we ship to?"
                  />
                  {shippingErrors.name && <p className="text-xs text-red-600 mt-1">{shippingErrors.name}</p>}
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Phone number</label>
                  <input
                    type="tel"
                    value={shipping.phone}
                    onChange={(event) => updateShippingField('phone', event.target.value.replace(/[^0-9]/g, ''))}
                    className={`mt-2 w-full rounded-2xl border px-4 py-3 focus:outline-none focus:ring-2 ${
                      shippingErrors.phone ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:ring-primary-500'
                    }`}
                    placeholder="10 digit mobile"
                  />
                  {shippingErrors.phone && <p className="text-xs text-red-600 mt-1">{shippingErrors.phone}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">Street address</label>
                  <input
                    type="text"
                    value={shipping.street}
                    onChange={(event) => updateShippingField('street', event.target.value)}
                    className={`mt-2 w-full rounded-2xl border px-4 py-3 focus:outline-none focus:ring-2 ${
                      shippingErrors.street ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:ring-primary-500'
                    }`}
                    placeholder="House number, street, locality"
                  />
                  {shippingErrors.street && <p className="text-xs text-red-600 mt-1">{shippingErrors.street}</p>}
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">City</label>
                  <input
                    type="text"
                    value={shipping.city}
                    onChange={(event) => updateShippingField('city', event.target.value)}
                    className={`mt-2 w-full rounded-2xl border px-4 py-3 focus:outline-none focus:ring-2 ${
                      shippingErrors.city ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:ring-primary-500'
                    }`}
                  />
                  {shippingErrors.city && <p className="text-xs text-red-600 mt-1">{shippingErrors.city}</p>}
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">State</label>
                  <input
                    type="text"
                    value={shipping.state}
                    onChange={(event) => updateShippingField('state', event.target.value)}
                    className={`mt-2 w-full rounded-2xl border px-4 py-3 focus:outline-none focus:ring-2 ${
                      shippingErrors.state ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:ring-primary-500'
                    }`}
                  />
                  {shippingErrors.state && <p className="text-xs text-red-600 mt-1">{shippingErrors.state}</p>}
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Postal code</label>
                  <input
                    type="text"
                    value={shipping.postalCode}
                    onChange={(event) => updateShippingField('postalCode', event.target.value.replace(/[^0-9]/g, ''))}
                    className={`mt-2 w-full rounded-2xl border px-4 py-3 focus:outline-none focus:ring-2 ${
                      shippingErrors.postalCode ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:ring-primary-500'
                    }`}
                    placeholder="PIN / ZIP"
                  />
                  {shippingErrors.postalCode && <p className="text-xs text-red-600 mt-1">{shippingErrors.postalCode}</p>}
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Country</label>
                  <input
                    type="text"
                    value={shipping.country}
                    onChange={(event) => updateShippingField('country', event.target.value)}
                    className={`mt-2 w-full rounded-2xl border px-4 py-3 focus:outline-none focus:ring-2 ${
                      shippingErrors.country ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:ring-primary-500'
                    }`}
                  />
                  {shippingErrors.country && <p className="text-xs text-red-600 mt-1">{shippingErrors.country}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleSubmit('cart')}
                disabled={ACTIONS_DISABLED || !canCheckout || !!submittingAction}
                className={`w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 text-white ${
                  !ACTIONS_DISABLED && canCheckout && !submittingAction
                    ? 'bg-primary-600 hover:bg-primary-700'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                <FiShield className="w-5 h-5" />
                {ACTIONS_DISABLED ? 'Temporarily Unavailable' : submittingAction === 'cart' ? 'Saving...' : 'Add to Cart'}
              </button>
              <button
                type="button"
                onClick={() => handleSubmit('buy')}
                disabled={ACTIONS_DISABLED || !canCheckout || !!submittingAction}
                className={`w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 text-white ${
                  !ACTIONS_DISABLED && canCheckout && !submittingAction
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                <FiZap className="w-5 h-5" />
                {ACTIONS_DISABLED ? 'Checkout Disabled' : submittingAction === 'buy' ? 'Starting Payment...' : 'Buy Now'}
              </button>
              <p className="text-xs text-center text-gray-500">
                {ACTIONS_DISABLED
                  ? 'Custom checkout is undergoing maintenance. Please revisit shortly.'
                  : 'Pay securely via UPI, Cards, Netbanking, Wallets'}
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURE_HIGHLIGHTS.map((feature) => (
            <div key={feature.title} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex gap-4">
              <feature.icon className="w-10 h-10 text-primary-600" />
              <div>
                <p className="text-xl font-semibold text-gray-900">{feature.title}</p>
                <p className="text-gray-600 mt-1">{feature.description}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div>
              <p className="text-sm uppercase text-gray-500">How it works</p>
              <h2 className="text-3xl font-semibold text-gray-900">Same flow as Copad&apos;s custom mobile builder</h2>
              <p className="text-gray-600 mt-2">From upload to doorstep delivery, we maintain the same handcrafted pipeline for every single order.</p>
            </div>
            <div className="bg-primary-50 text-primary-700 px-4 py-2 rounded-full text-sm font-semibold">Average delivery: 3.2 days</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {TIMELINE_STEPS.map((step, index) => (
              <div key={step.title} className="relative p-4 rounded-2xl border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold mb-4">
                  {index + 1}
                </div>
                <p className="text-lg font-semibold text-gray-900">{step.title}</p>
                <p className="text-sm text-gray-600 mt-2">{step.description}</p>
                <p className="text-xs text-primary-600 mt-3 font-semibold">{step.meta}</p>
                {index < TIMELINE_STEPS.length - 1 && (
                  <span className="hidden md:block absolute top-8 right-0 w-px h-16 bg-gradient-to-b from-primary-200 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <div className="text-center mb-8">
            <p className="text-sm uppercase text-gray-500">Questions</p>
            <h2 className="text-3xl font-semibold text-gray-900">Custom case FAQ</h2>
            <p className="text-gray-600">Answers for the most asked questions from our custom cover fam.</p>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <div key={faq.id} className="border border-gray-200 rounded-2xl">
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-4 text-left"
                  onClick={() => setOpenFaq((prev) => (prev === faq.id ? null : faq.id))}
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  <FiChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${openFaq === faq.id ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === faq.id && (
                  <p className="px-4 pb-4 text-gray-600">{faq.answer}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      {orderFeedback && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-2xl z-50">
          <div
            className={`relative rounded-3xl border p-6 shadow-2xl bg-white flex flex-col gap-3 ${
              orderFeedback.status === 'success' ? 'border-emerald-200' : 'border-red-200'
            }`}
          >
            <button
              type="button"
              aria-label="Close summary"
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={dismissOrderFeedback}
            >
              <FiX className="w-5 h-5" />
            </button>
            <div>
              <p className={`text-sm font-semibold uppercase ${orderFeedback.status === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                {orderFeedback.status === 'success' ? 'Success' : 'Action needed'}
              </p>
              <h3 className="text-xl font-semibold text-gray-900 mt-1">{orderFeedback.title}</h3>
              <p className="text-gray-600 mt-2">{orderFeedback.message}</p>
              {orderFeedback.orderId && (
                <p className="text-sm font-mono text-gray-500 mt-2">Order ID: {orderFeedback.orderId}</p>
              )}
            </div>
            {orderFeedback.ctaLabel && orderFeedback.onCta && (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={`px-4 py-2 rounded-xl font-semibold text-white ${orderFeedback.status === 'success' ? 'bg-primary-600 hover:bg-primary-700' : 'bg-red-600 hover:bg-red-700'}`}
                  onClick={() => {
                    orderFeedback.onCta?.();
                    dismissOrderFeedback();
                  }}
                >
                  {orderFeedback.ctaLabel}
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
                  onClick={dismissOrderFeedback}
                >
                  Maybe later
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomMobilePage;