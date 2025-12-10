import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiArrowLeft, FiStar, FiFeather } from 'react-icons/fi';
import { getThemeBySlug } from '../data/themeCollections';
import themeAPI from '../api/themeAPI';

const gradientOverlay = (accent) => ({
  background: `linear-gradient(135deg, ${accent} 0%, rgba(255,255,255,0) 70%)`,
});

const ThemeDetail = () => {
  const { slug } = useParams();
  const [serverTheme, setServerTheme] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    if (!slug) return undefined;

    const fetchTheme = async () => {
      setLoading(true);
      try {
        const res = await themeAPI.getByKey(slug);
        const payload = res.data?.data?.theme;
        if (!ignore) setServerTheme(payload || null);
      } catch (err) {
        if (!ignore) setServerTheme(null);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchTheme();
    return () => {
      ignore = true;
    };
  }, [slug]);

  const fallbackTheme = useMemo(() => getThemeBySlug(slug || ''), [slug]);
  const resolvedTheme = useMemo(() => serverTheme || fallbackTheme, [serverTheme, fallbackTheme]);

  const normalizedTheme = useMemo(() => {
    if (!resolvedTheme) return null;
    const accentColor = resolvedTheme.accentColor || resolvedTheme.variables?.accentColor || '#0ea5e9';
    const textColor = resolvedTheme.textColor || resolvedTheme.variables?.textColor || '#111827';
    const tagline = resolvedTheme.tagline || resolvedTheme.variables?.tagline || resolvedTheme.category || 'Fresh drop';
    const posterImage = resolvedTheme.posterImage || resolvedTheme.assets?.posterUrl || resolvedTheme.posterUrl;
    const badges = resolvedTheme.badges || resolvedTheme.variables?.badges || (resolvedTheme.category ? [resolvedTheme.category] : []);
    const stats = resolvedTheme.stats || resolvedTheme.variables?.stats || {
      price: resolvedTheme.basePrice ? `₹${resolvedTheme.basePrice}` : 'New release',
    };
    const price = resolvedTheme.basePrice ?? resolvedTheme.variables?.price ?? resolvedTheme.products?.[0]?.price;
    const products = resolvedTheme.products?.length
      ? resolvedTheme.products
      : price
        ? [
            {
              id: 'base',
              title: `${resolvedTheme.name} case`,
              subtitle: 'Premium finish',
              price,
              originalPrice: Math.round(price * 1.35),
              image: posterImage,
            },
          ]
        : [];

    const mobileModel = resolvedTheme.mobileModelId || resolvedTheme.mobileModel;
    const mobileCompany = resolvedTheme.mobileCompanyId || resolvedTheme.mobileCompany;

    return {
      ...resolvedTheme,
      accentColor,
      textColor,
      tagline,
      posterImage,
      badges,
      stats,
      products,
      price,
      mobileModel,
      mobileCompany,
    };
  }, [resolvedTheme]);

  if (loading && !normalizedTheme) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-600">Loading theme…</div>
    );
  }

  if (!normalizedTheme) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="bg-white rounded-3xl shadow-xl px-10 py-12 max-w-lg">
          <p className="text-3xl font-semibold text-gray-900">Theme not found</p>
          <p className="text-gray-600 mt-3">
            The collection you are looking for has moved or is still in production. Please browse the 
            featured themes and pick another vibe.
          </p>
          <div className="mt-6 flex flex-wrap gap-4 justify-center">
            <Link
              to="/"
              className="px-6 py-3 rounded-full bg-gray-100 text-gray-900 font-semibold hover:bg-gray-200"
            >
              Go to Home
            </Link>
            <Link
              to="/themes/pintrsty"
              className="px-6 py-3 rounded-full bg-primary-600 text-white font-semibold hover:bg-primary-500"
            >
              Explore Themes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const theme = normalizedTheme;
  const frameUrl = theme.mobileModel?.images?.[0]?.url;

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      <div className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center gap-3 text-sm text-gray-500">
          <Link to="/" className="flex items-center gap-2 text-primary-600 font-semibold">
            <FiArrowLeft className="h-4 w-4" />
            Back home
          </Link>
          <span>/</span>
          <span>Themes</span>
          <span>/</span>
          <span className="text-gray-900 font-semibold">{theme.name}</span>
        </div>
      </div>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-10">
        <div className="bg-white rounded-4xl shadow-xl grid lg:grid-cols-[1.1fr_0.9fr] overflow-hidden">
          <div className="p-10 flex flex-col justify-center gap-6">
            <div>
              <p className="uppercase text-xs tracking-[0.4em] text-gray-400">Collection</p>
              <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900 mt-3 leading-tight">
                {theme.name}
              </h1>
              <p className="text-lg text-gray-600 mt-4 max-w-2xl">{theme.description}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              {theme.badges.map((badge) => (
                <span
                  key={badge}
                  className="px-4 py-2 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: `${theme.accentColor}25`,
                    color: theme.textColor,
                  }}
                >
                  {badge}
                </span>
              ))}
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
              {Object.entries(theme.stats).map(([key, value]) => (
                <div key={key} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <dt className="text-gray-500 uppercase tracking-wider text-xs">{key}</dt>
                  <dd className="text-lg font-semibold text-gray-900 mt-2">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative bg-gradient-to-br from-white to-gray-100 flex items-center justify-center">
            <div className="absolute inset-0" style={gradientOverlay(theme.accentColor)} />
            <div className="relative w-full h-full flex items-center justify-center p-10">
              <div className="bg-white/70 border border-white rounded-[40px] shadow-2xl p-8">
                <div className="text-xs uppercase tracking-[0.3em] text-gray-500">Poster</div>
                <div className="mt-4 relative w-72 h-80 rounded-[28px] overflow-hidden shadow-2xl bg-white">
                  {theme.posterImage ? (
                    <img
                      src={theme.posterImage}
                      alt={`${theme.name} poster`}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">No poster</div>
                  )}
                  {frameUrl && (
                    <img
                      src={frameUrl}
                      alt={`${theme.mobileModel?.name || 'Phone'} frame`}
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
                  <span className="flex items-center gap-2">
                    <FiStar className="text-yellow-400" />
                    Editor pick
                  </span>
                  <span className="flex items-center gap-2">
                    <FiFeather />
                    {theme.tagline}
                  </span>
                </div>
                {(theme.mobileCompany?.name || theme.mobileModel?.name) && (
                  <div className="mt-2 text-xs text-gray-500">
                    {theme.mobileCompany?.name || 'Frame'} {theme.mobileModel?.name ? `• ${theme.mobileModel.name}` : ''}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-16">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-[0.4em]">Design library</p>
            <h2 className="text-3xl font-semibold text-gray-900 mt-2">Pick your favorite vibe</h2>
            <p className="text-gray-600 mt-2 max-w-2xl">
              Each cover is printed on premium metal-backed TPU with UV-sealed inks for colorfast, daily-drop
              protection.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-gray-200 text-sm font-semibold hover:border-gray-400"
          >
            Browse full catalog
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {theme.products.map((product) => (
            <article
              key={product.id}
              className="group bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:-translate-y-1 hover:shadow-xl transition"
            >
              <div className="relative overflow-hidden bg-gray-50">
                <img
                  src={product.image}
                  alt={product.title}
                  className="h-72 w-full object-cover group-hover:scale-105 transition"
                  loading="lazy"
                />
                <div className="absolute top-5 left-5 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: `${theme.accentColor}35`, color: theme.textColor }}
                >
                  {theme.name}
                </div>
              </div>

              <div className="p-6 flex flex-col gap-4">
                <div>
                  <p className="text-sm uppercase tracking-wide text-gray-400">{product.subtitle}</p>
                  <h3 className="text-xl font-semibold text-gray-900 mt-1">{product.title}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-900">₹{product.price}</span>
                  <span className="text-gray-400 line-through text-lg">₹{product.originalPrice}</span>
                </div>
                <button
                  type="button"
                  className="w-full rounded-full py-3 font-semibold text-white"
                  style={{ backgroundColor: theme.accentColor, color: '#111827' }}
                >
                  View design
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ThemeDetail;
