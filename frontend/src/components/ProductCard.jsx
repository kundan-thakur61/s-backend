import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../redux/slices/cartSlice';
import { addToWishlist, removeFromWishlist } from '../redux/slices/wishlistSlice';
import { toast } from 'react-toastify';
import { FiShoppingCart, FiEye, FiStar, FiHeart } from 'react-icons/fi';
import { formatPrice, getProductImage, isInStock } from '../utils/helpers';

import { selectWishlistItems } from '../redux/slices/wishlistSlice';

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const productImage = getProductImage(product);
  const available = isInStock(product);

  const wishlistItems = useSelector(selectWishlistItems);
  const isWishlisted = !!wishlistItems.find(p => p._id === product._id);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!available) {
      toast.error('Product is currently out of stock');
      return;
    }

    const availableVariant = product.variants.find(v => v.stock > 0 && v.isActive);
    if (availableVariant) {
      dispatch(addToCart({
        product,
        variant: availableVariant,
        quantity: 1
      }));
      toast.success('Added to cart!');
    }
  };

  const handleViewDetails = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <Link to={`/products/${product._id}`} className="block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 group" style={{ textDecoration: 'none' }}>
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100 cursor-pointer">
        <img
          src={productImage}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        
        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex space-x-2">
            <span className="bg-white text-gray-900 p-2 rounded-full hover:bg-primary-600 hover:text-white transition-colors" title="View Details">
              <FiEye className="w-5 h-5" />
            </span>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isWishlisted) {
                  dispatch(removeFromWishlist(product._id));
                } else {
                  dispatch(addToWishlist(product._id));
                }
              }}
              className={`bg-white text-gray-900 p-2 rounded-full hover:bg-primary-600 hover:text-white transition-colors ${isWishlisted ? 'text-primary-600' : ''}`}
              title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <FiHeart className="w-5 h-5" />
            </button>
            <button
              onClick={handleAddToCart}
              disabled={!available}
              className="bg-white text-gray-900 p-2 rounded-full hover:bg-primary-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Add to Cart"
            >
              <FiShoppingCart className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stock Badge */}
        {!available && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
            Out of Stock
          </div>
        )}

        {/* Featured Badge */}
        {product.featured && available && (
          <div className="absolute top-2 left-2 bg-primary-600 text-white px-2 py-1 rounded text-xs font-medium">
            Featured
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-2 right-2 bg-white bg-opacity-90 text-gray-700 px-2 py-1 rounded text-xs font-medium">
          {product.category}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 cursor-pointer">
        <div className="mb-2">
          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
            {product.title}
          </h3>
          <p className="text-sm text-gray-600">
            {product.brand} • {product.model}
          </p>
        </div>

        {/* Rating */}
        {product.rating?.average > 0 && (
          <div className="flex items-center mb-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <FiStar
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(product.rating.average)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="ml-2 text-sm text-gray-600">
              {product.rating.average.toFixed(1)} ({product.rating.count} reviews)
            </span>
          </div>
        )}

        {/* Price and Type */}
        <div className="flex items-center justify-between mb-3">
          <div>
            {product.variants && product.variants.length > 0 && (
              <div className="flex items-baseline space-x-2">
                <span className="text-lg font-bold text-gray-900">
                  {formatPrice(Math.min(...product.variants.map(v => v.price)))}
                </span>
                {product.variants.length > 1 && (
                  <span className="text-sm text-gray-500">
                    - {formatPrice(Math.max(...product.variants.map(v => v.price)))}
                  </span>
                )}
              </div>
            )}
          </div>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {product.type}
          </span>
        </div>

        {/* Variants Preview */}
        {product.variants && product.variants.length > 1 && (
          <div className="flex items-center space-x-1 mb-3">
            <span className="text-xs text-gray-600">Colors:</span>
            <div className="flex space-x-1">
              {product.variants.slice(0, 4).map((variant, index) => (
                <div
                  key={index}
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: (variant.color ? String(variant.color).toLowerCase() : '#e5e7eb') }}
                  title={variant.color}
                />
              ))}
              {product.variants.length > 4 && (
                <span className="text-xs text-gray-500">+{product.variants.length - 4}</span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <span className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors text-center cursor-pointer">
            View Details
          </span>
          <button
            onClick={handleAddToCart}
            disabled={!available}
            className="bg-primary-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-1"
          >
            <FiShoppingCart className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;