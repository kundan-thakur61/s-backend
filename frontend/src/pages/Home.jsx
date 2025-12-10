import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, fetchTrendingProducts } from '../redux/slices/productSlice';
import { FiShoppingCart, FiZap, FiShield, FiTruck } from 'react-icons/fi';
import ProductCard from '../components/ProductCard';
import Loader, { CardSkeleton } from '../components/Loader';
import ThemeShowcase from '../components/ThemeShowcase';
import mainBackground from '../assets/main-background.png';
import Customised  from '../assets/Customised-theam[1].png';
const Home = () => {
  const dispatch = useDispatch();
  const { products, loading } = useSelector((state) => state.products);

  useEffect(() => {
    dispatch(fetchProducts({ featured: true, limit: 8 }));
    dispatch(fetchTrendingProducts({ limit: 8 }));
  }, [dispatch]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Design Your Perfect
                <span className="block text-yellow-300">Mobile Cover</span>
              </h1>
              <p className="text-xl text-blue-100 leading-relaxed">
                Create unique, personalized mobile covers with our easy-to-use designer tool. 
                High-quality prints, fast delivery, and endless possibilities.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {/* optional buttons */}
              </div>
            </div>

            {/* ===== single card with two different links ===== */}
            <div className="relative">
              <div className="aspect-square bg-white/25 rounded-4xl p-4 backdrop-blur-sm">
                {/* two boxes side-by-side on larger screens, stacked on small */}
                <div className="grid grid-cols-1 sm:grid-cols gap-3 h-full">
                  
                  {/* First link -> Products (uses your background image) */}
                  <Link
                    to="/themes"
                    className="block rounded-xl overflow-hidden transform transition duration-300 ease-in-out hover:-translate-y-1 hover:scale-105"
                    aria-label="View products"
                  >
                    <div
                      className="h-full w-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${mainBackground})` }}
                    />
                  </Link>

                  {/* Second link -> Customizer (gradient + text) */}
                  <Link
                    to="/customizer"
                    className="block rounded-xl overflow-hidden transform transition duration-300 ease-in-out hover:-translate-y-1 hover:scale-105"
                    aria-label="Create custom cover"
                  >
                     <div
                      className="h-full w-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${Customised})` }}
                    />
                  </Link>

                </div>
              </div>
            </div>
            {/* ===== end card ===== */}
          </div>
        </div>
      </section>
     
      
  

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Trending Products</h2>
              <p className="text-lg text-gray-600 mt-2">Discover our most popular mobile covers</p>
            </div>
            <Link
              to="/products"
              className="bg-sky-500 border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors text-center"
            >
              View All
            </Link>
          </div>

          {loading ? (
            <CardSkeleton count={4} />
          ) : Array.isArray(products) && products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No products found.</p>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Us</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We provide the best quality custom mobile covers with advanced printing technology 
              and premium materials.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                <FiZap className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Easy Design</h3>
              <p className="text-gray-600">
                User-friendly design tool to create your perfect mobile cover in minutes.
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                <FiShield className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Premium Quality</h3>
              <p className="text-gray-600">
                High-quality materials with advanced UV printing technology for long-lasting prints.
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                <FiTruck className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Fast Delivery</h3>
              <p className="text-gray-600">
                Quick production and delivery across India. Get your custom cover in 3-5 days.
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                <FiShoppingCart className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Secure Payment</h3>
              <p className="text-gray-600">
                Multiple payment options with secure checkout process for your peace of mind.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
