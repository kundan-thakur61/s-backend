import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ONE from '../assets/ONE.png';
import TWO from '../assets/TWO.png';
import THREE from '../assets/THREE.png';
import FOUR from '../assets/FOUR.png';
import FIVE from '../assets/FIVE.png';
import SIX from '../assets/SIX.png';
import SEVEN from '../assets/SEVEN.png';
import collectionAPI from '../api/collectionAPI';
import { resolveImageUrl } from '../utils/helpers';

const fallbackTiles = [
  { handle: '1', title: 'Dreamy Pastels', image: ONE },
  { handle: '2', title: 'Custom Studio', image: TWO },
  { handle: '3', title: 'Gilded Marble', image: THREE },
  { handle: '4', title: 'Quotes Club', image: FOUR },
  { handle: '5', title: 'Quotes Club', image: FIVE },
  { handle: '6', title: 'Quotes Club', image: SIX },
  { handle: '7', title: 'Quotes Club', image: SEVEN },
];

const DEFAULT_ACCENT = '#0ea5e9';
const DEFAULT_TAGLINE = 'Fresh drop';
const IMAGE_ERROR_FALLBACK = ONE;

const Themes = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;
    const fetchCollections = async () => {
      setLoading(true);
      try {
        const res = await collectionAPI.listPublic();
        if (!ignore) {
          setCollections(res?.data?.data?.collections || []);
        }
      } catch (err) {
        if (!ignore) setCollections([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchCollections();
    return () => {
      ignore = true;
    };
  }, []);

  // build card objects: use heroImage only, or fallback tile (ignore uploaded collection images)
  const cards = (collections.length
    ? collections.map((item, idx) => {
        const hero = resolveImageUrl(item?.heroImage);
        // Only use heroImage, not the uploaded collection images
        const pick = hero || fallbackTiles[idx % fallbackTiles.length].image;
        return {
          id: item._id || `${item.handle || `c-${idx}`}`,
          handle: item.handle || item._id || `${idx}`,
          title: item.title || 'Untitled',
          image: pick,
          accent: item.accentColor || DEFAULT_ACCENT,
          tagline: item.tagline || DEFAULT_TAGLINE,
        };
      })
    : fallbackTiles.map((item, index) => ({
        id: item.handle,
        handle: item.handle,
        title: item.title,
        image: item.image,
        tagline: index % 2 === 0 ? 'Signature edit' : 'Custom drop',
        accent: DEFAULT_ACCENT,
      }))
  );

  // Helper for img onError to show a safe fallback instead of broken image icon
  const handleImgError = (e) => {
    if (e?.target) {
      e.target.onerror = null;
      e.target.src = IMAGE_ERROR_FALLBACK;
    }
  };

  const handleKeyDown = (e, handle) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/collection/${handle}`);
    }
  };

  return (
    <div className="relative">
      <div className="bg-white/25 rounded-4xl p-4 backdrop-blur-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {loading && collections.length === 0 ? (
            fallbackTiles.map((tile) => (
              <div
                key={tile.handle}
                className="rounded-3xl h-64 bg-gray-200 animate-pulse"
                aria-hidden="true"
              />
            ))
          ) : (
            cards.map((card) => (
              <Link
                key={card.id}
                to={`/collection/${card.handle}`}
                className="group relative rounded-3xl overflow-hidden h-64 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400"
                aria-label={`${card.title} — ${card.tagline}`}
                onKeyDown={(e) => handleKeyDown(e, card.handle)}
              >
                <img
                  src={card.image}
                  alt={card.title}
                  loading="lazy"
                  onError={handleImgError}
                  className="absolute inset-0 w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="relative z-10 h-full flex flex-col justify-end p-6 text-white">
                  {/* <p className="text-xs uppercase tracking-[0.3em] text-white/70">Collection</p>
                  <h3 className="text-2xl font-semibold mt-2">{card.title}</h3>
                  <p className="text-sm text-white/80 mt-1">{card.tagline}</p> */}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Themes;
