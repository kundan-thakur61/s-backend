import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiChevronLeft,
  FiChevronRight,
  FiHeart,
  FiMenu,
  FiMinus,
  FiPlus,
  FiShield,
  FiShoppingCart,
  FiStar,
  FiTruck,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { fetchProduct } from '../redux/slices/productSlice';
import { addToCart } from '../redux/slices/cartSlice';
import { addToWishlist, removeFromWishlist, selectWishlistItems } from '../redux/slices/wishlistSlice';
import Loader from '../components/Loader';
import ProductCard from '../components/ProductCard';
import ProductReviewsSection from '../components/ProductReviewsSection';
import { formatPrice, getAvailableVariants, getProductImage, isInStock, resolveImageUrl } from '../utils/helpers';




const HERO_BADGES = ['Dispatch in 24 Hrs', 'Designer QC', 'Free WhatsApp Preview', 'Easy Returns'];

const HIGHLIGHT_FEATURES = [
  { icon: FiShield, title: 'Premium Protection', description: 'Raised lips protect camera & screen while keeping the profile slim.' },
  { icon: FiTruck, title: 'Express Shipping', description: 'Ships from Neemuch (M.P.) studio within 24 hours of approval.' },
  { icon: FiStar, title: 'Studio Grade Print', description: '3D sublimation print wraps across curves with UV anti-fade coating.' },
  { icon: FiHeart, title: 'Made for You', description: 'Each piece is individually crafted after your confirmation on WhatsApp.' },
];



const ProductDetails = ({ productIdOverride }) => {
  const { id: routeId } = useParams();
  const resolvedProductId = productIdOverride || routeId;
  const dispatch = useDispatch();
  const { currentProduct, loading, error } = useSelector((state) => state.products);
  const wishlistItems = useSelector(selectWishlistItems);

  const isWishlisted = wishlistItems.some((item) => item._id === resolvedProductId);

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (resolvedProductId) {
      dispatch(fetchProduct(resolvedProductId));
    }
  }, [dispatch, resolvedProductId]);

  useEffect(() => {
    if (currentProduct) {
      const variants = getAvailableVariants(currentProduct);
      if (variants.length && !selectedVariant) {
        setSelectedVariant(variants[0]);
      }
    }
  }, [currentProduct, selectedVariant]);

  const handleAddToCart = () => {
    if (!selectedVariant) {
      toast.error('Select a variant first.');
      return;
    }

    if (quantity < 1) {
      toast.error('Quantity must be at least 1.');
      return;
    }

    if (selectedVariant.stock && quantity > selectedVariant.stock) {
      toast.error(`Only ${selectedVariant.stock} units available.`);
      return;
    }

    dispatch(addToCart({ product: currentProduct, variant: selectedVariant, quantity }));
    toast.success('Added to cart.');
  };

  const handleVariantChange = (variant) => {
    setSelectedVariant(variant);
    setQuantity(1);
  };

  const handleQuantityChange = (direction) => {
    setQuantity((prev) => {
      const next = prev + direction;
      if (next < 1) return 1;
      if (selectedVariant?.stock && next > selectedVariant.stock) {
        toast.error(`Only ${selectedVariant.stock} units available.`);
        return prev;
      }
      return next;
    });
  };

  const nextImage = () => {
    if (!currentProduct?.images?.length) return;
    setCurrentImageIndex((prev) => (prev === currentProduct.images.length - 1 ? 0 : prev + 1));
  };

  const prevImage = () => {
    if (!currentProduct?.images?.length) return;
    setCurrentImageIndex((prev) => (prev === 0 ? currentProduct.images.length - 1 : prev - 1));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error || !currentProduct) {
    return (
      <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Product Not Found</h2>
          <p className="text-gray-600 mb-6">We could not find this Copad product detail page.</p>
          <Link
            to="/products"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-black text-white font-semibold tracking-wide"
          >
            Browse Catalog
          </Link>
        </div>
      </div>
    );
  }

  const availableVariants = getAvailableVariants(currentProduct);
  const productImages = currentProduct.images?.length ? currentProduct.images : [getProductImage(currentProduct)].filter(Boolean);
  const heroImage = resolveImageUrl(productImages[currentImageIndex]) || getProductImage(currentProduct);
  const ratingValue = currentProduct.rating?.average || 0;
  const ratingCount = currentProduct.rating?.count || 0;
  const hasVariants = availableVariants.length > 0;

  return (
    <div className="min-h-screen bg-[#faf7f2] text-gray-900">
    


      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-14">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] pt-10">
          <div className="space-y-4">
            <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6 relative overflow-hidden">
              <div className="aspect-[3/4] bg-[#f9f5ef] rounded-2xl flex items-center justify-center">
                <img src={heroImage} alt={currentProduct.title} className="max-h-full object-contain" />
              </div>
              {productImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-3 border border-gray-200 shadow"
                  >
                    <FiChevronLeft />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-3 border border-gray-200 shadow"
                  >
                    <FiChevronRight />
                  </button>
                </>
              )}
            </div>

            {productImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {productImages.map((image, index) => (
                  <button
                    key={image || index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative w-24 h-28 rounded-2xl border-2 ${currentImageIndex === index ? 'border-black' : 'border-transparent'} bg-white shadow-sm flex items-center justify-center`}
                  >
                    <img src={resolveImageUrl(image)} alt={`${currentProduct.title} ${index + 1}`} className="object-contain max-h-full" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-4 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between text-sm text-gray-500 uppercase tracking-wide">
                <span>{currentProduct.brand}</span>
                <span>#{currentProduct.model || 'Custom'}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">{currentProduct.title}</h1>
              <p className="text-gray-600 leading-relaxed">{currentProduct.tagline || currentProduct.subtitle || 'Premium personalized mobile case with designer-approved finish.'}</p>

              {ratingValue > 0 && (
                <div className="flex items-center gap-2">
                  {[...Array(5)].map((_, index) => (
                    <FiStar
                      key={index}
                      className={`w-5 h-5 ${index < Math.round(ratingValue) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                  <span className="text-sm text-gray-500">{ratingValue.toFixed(1)} · {ratingCount} reviews</span>
                </div>
              )}

              <div className="border border-gray-100 rounded-2xl bg-[#f8f4ed] p-4">
                {selectedVariant ? (
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-black">{formatPrice(selectedVariant.price)}</span>
                    {selectedVariant.originalPrice && (
                      <span className="text-lg text-gray-500 line-through">{formatPrice(selectedVariant.originalPrice)}</span>
                    )}
                  </div>
                ) : (
                  hasVariants && (
                    <div className="text-4xl font-black">
                      {formatPrice(Math.min(...availableVariants.map((variant) => variant.price)))}
                      <span className="text-base font-medium text-gray-500">
                        {' '}- {formatPrice(Math.max(...availableVariants.map((variant) => variant.price)))}
                      </span>
                    </div>
                  )
                )}
                <p className="text-sm text-gray-500 mt-1">All taxes included · Secure Razorpay checkout</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {HERO_BADGES.map((badge) => (
                  <span key={badge} className="px-3 py-1 border border-gray-200 rounded-full text-xs font-semibold text-gray-600 tracking-wide uppercase">
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            {hasVariants && (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
                <h3 className="text-sm font-semibold tracking-wide text-gray-500">SELECT FINISH</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {availableVariants.map((variant) => (
                    <button
                      key={variant._id}
                      onClick={() => handleVariantChange(variant)}
                      className={`text-left border rounded-2xl p-4 transition ${selectedVariant?._id === variant._id ? 'border-black shadow-md bg-[#f8f4ed]' : 'border-gray-200 hover:border-gray-400'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">{variant.color || variant.name}</span>
                        <span className="text-sm text-gray-500">{variant.stock || 0} left</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{formatPrice(variant.price)}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-semibold tracking-wide text-gray-500">QUANTITY</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-200 rounded-full">
                  <button onClick={() => handleQuantityChange(-1)} disabled={quantity === 1} className="p-3 disabled:text-gray-300">
                    <FiMinus />
                  </button>
                  <span className="w-12 text-center font-semibold">{quantity}</span>
                  <button onClick={() => handleQuantityChange(1)} className="p-3">
                    <FiPlus />
                  </button>
                </div>
                {selectedVariant?.stock && <span className="text-sm text-gray-500">{selectedVariant.stock} ready to ship</span>}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedVariant || !isInStock(currentProduct)}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-4 rounded-full font-semibold text-white bg-black disabled:bg-gray-400"
                >
                  <FiShoppingCart /> Add to Cart
                </button>
                <button
                  onClick={() => {
                    if (!selectedVariant || !isInStock(currentProduct)) return;
                    window.location.href = `/checkout?productId=${currentProduct._id}&variantId=${selectedVariant._id}&quantity=${quantity}`;
                  }}
                  disabled={!selectedVariant || !isInStock(currentProduct)}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-4 rounded-full font-semibold border border-gray-300 text-gray-900"
                >
                  Buy Now
                </button>
              </div>

              <button
                onClick={() => {
                  if (!resolvedProductId) return;
                  if (isWishlisted) {
                    dispatch(removeFromWishlist(resolvedProductId));
                  } else {
                    dispatch(addToWishlist(resolvedProductId));
                  }
                }}
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-full border ${isWishlisted ? 'border-pink-500 text-pink-600' : 'border-gray-200 text-gray-700'}`}
              >
                <FiHeart /> {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
              </button>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className={`w-2 h-2 rounded-full ${isInStock(currentProduct) ? 'bg-green-500' : 'bg-red-500'}`} />
                {isInStock(currentProduct) ? 'In stock · ships within 24 hrs' : 'Currently sold out'}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHT_FEATURES.map((feature) => (
            <div key={feature.title} className="bg-white rounded-3xl border border-gray-100 p-5 flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#f8f4ed] flex items-center justify-center text-xl text-gray-800">
                <feature.icon />
              </div>
              <h3 className="font-semibold text-lg">{feature.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </section>

        {resolvedProductId && (
          <ProductReviewsSection productId={resolvedProductId} />
        )}

        {/* <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-8">
          <div>
            <h2 className="text-2xl font-black mb-3">Product Story</h2>
            <p className="text-gray-600 leading-relaxed">{currentProduct.description || 'Each Copad case is designed to look like art on your phone. Upload your reference, approve the WhatsApp mockup, and we will UV-print it edge-to-edge with a velvet-soft interior to hug your device.'}</p>
          </div>

          {currentProduct.specifications && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Specifications</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {Object.entries(currentProduct.specifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between border border-gray-100 rounded-2xl px-4 py-3 text-sm">
                    <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="font-semibold text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section> */}

        
      </main>
    </div>
  );
};

export default ProductDetails;
