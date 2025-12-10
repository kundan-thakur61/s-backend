import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import customDesignAPI from '../api/customDesignAPI';
import DesignCard from '../components/DesignCard';
import { PageLoader } from '../components/Loader';
import { addToCart } from '../redux/slices/cartSlice';

const sortDesigns = (designs, sortBy) => {
	const list = [...designs];
	switch (sortBy) {
		case 'oldest':
			return list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
		case 'name':
			return list.sort((a, b) => {
				const nameA = (a.name || a.meta?.model || '').toLowerCase();
				const nameB = (b.name || b.meta?.model || '').toLowerCase();
				return nameA.localeCompare(nameB);
			});
		case 'recent':
		default:
			return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
	}
};

export default function MyDesigns() {
	const [designs, setDesigns] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [search, setSearch] = useState('');
	const [sortBy, setSortBy] = useState('recent');
	const navigate = useNavigate();
	const dispatch = useDispatch();

	const loadDesigns = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await customDesignAPI.getMyDesigns();
			const list = response?.data?.designs || response?.designs || [];
			setDesigns(list);
		} catch (err) {
			const message = err.response?.data?.message || err.message || 'Failed to load designs';
			setError(message);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadDesigns();
	}, [loadDesigns]);

	const filteredDesigns = useMemo(() => {
		const query = search.trim().toLowerCase();
		const searched = query
			? designs.filter((design) => {
					const meta = design.meta || {};
					return [design.name, meta.company, meta.model, meta.type]
						.filter(Boolean)
						.some((value) => value.toLowerCase().includes(query));
				})
			: designs;

		return sortDesigns(searched, sortBy);
	}, [designs, search, sortBy]);

	const handleEditDesign = useCallback((design) => {
		sessionStorage.setItem('currentDesign', JSON.stringify({
			frame: design.frame || '/frames/frame-1.svg',
			imgSrc: design.imgSrc,
			transform: design.transform,
			meta: design.meta,
		}));
		sessionStorage.setItem('editingCustomId', `custom_${design._id}`);

		const meta = design.meta || {};
		const metaKey = `${meta.company || ''}__${meta.model || ''}__${meta.type || ''}`;
		const hasMeta = meta.company || meta.model || meta.type;
		navigate(hasMeta ? `/customizer/${encodeURIComponent(metaKey)}` : '/customizer');
	}, [navigate]);

	const handleAddToCart = useCallback((design) => {
		const meta = design.meta || {};
		const productId = `custom_${design._id}`;
		const variantId = `variant_${design._id}`;
		const title = design.name || `${meta.company || 'Custom'} ${meta.model || ''} Cover`.trim();
		const price = (meta.type || '').toLowerCase() === 'glass' ? 699 : 399;

		dispatch(addToCart({
			product: {
				_id: productId,
				title,
				images: [design.frame || '/frames/frame-1.svg'],
				design: {
					frame: design.frame,
					imgSrc: design.imgSrc,
					transform: design.transform,
					meta: design.meta,
					savedId: design._id,
				},
			},
			variant: {
				_id: variantId,
				name: meta.type || 'Custom Cover',
				price,
				stock: 100,
				color: meta.type || 'Custom',
			},
			quantity: 1,
		}));

		toast.success('Design added to cart');
	}, [dispatch]);

	const handleDeleteDesign = useCallback(async (design) => {
		const confirmDelete = window.confirm(`Delete "${design.name || 'this design'}"?`);
		if (!confirmDelete) return;

		try {
			await customDesignAPI.deleteDesign(design._id);
			toast.success('Design deleted');
			loadDesigns();
		} catch (err) {
			const message = err.response?.data?.message || err.message || 'Failed to delete design';
			toast.error(message);
		}
	}, [loadDesigns]);

	const handleCreateDesign = useCallback(() => {
		navigate('/customizer');
	}, [navigate]);

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<PageLoader />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 py-10">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
				<header className="mb-8">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p className="text-sm uppercase tracking-wide text-primary-600 font-semibold">Custom Covers</p>
							<h1 className="text-3xl font-bold text-gray-900">My Designs</h1>
							<p className="text-gray-600 mt-1">Manage, edit, and reorder your saved custom case designs.</p>
						</div>
						<div className="flex gap-3">
							<button
								onClick={loadDesigns}
								className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
							>
								Refresh
							</button>
							<button
								onClick={handleCreateDesign}
								className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
							>
								Create New Design
							</button>
						</div>
					</div>
				</header>

				{error && (
					<div className="mb-6 p-4 border border-red-200 bg-red-50 text-red-700 rounded-lg" role="alert">
						{error}
					</div>
				)}

				<section className="mb-8 bg-white border rounded-lg shadow-sm p-4 sm:p-6">
					<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
						<div className="flex-1">
							<label className="sr-only" htmlFor="design-search">Search designs</label>
							<input
								id="design-search"
								type="search"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Search by name, model, or type"
								className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
							/>
						</div>
						<div className="flex items-center gap-3">
							<label htmlFor="design-sort" className="text-sm text-gray-600">Sort by</label>
							<select
								id="design-sort"
								value={sortBy}
								onChange={(e) => setSortBy(e.target.value)}
								className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
							>
								<option value="recent">Most recent</option>
								<option value="oldest">Oldest</option>
								<option value="name">Name A–Z</option>
							</select>
						</div>
					</div>
				</section>

				{filteredDesigns.length === 0 ? (
					<div className="bg-white border rounded-lg shadow-sm p-12 text-center">
						<div className="max-w-md mx-auto space-y-4">
							<div className="w-16 h-16 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mx-auto">
								<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
								</svg>
							</div>
							<h2 className="text-xl font-semibold text-gray-900">No designs yet</h2>
							<p className="text-gray-600">Save your creations in the customizer and they will show up here for easy reordering.</p>
							<button
								onClick={handleCreateDesign}
								className="px-5 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
							>
								Start Designing
							</button>
						</div>
					</div>
				) : (
					<section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
						{filteredDesigns.map((design) => (
							<DesignCard
								key={design._id}
								design={design}
								onEdit={handleEditDesign}
								onAddToCart={handleAddToCart}
								onDelete={handleDeleteDesign}
							/>
						))}
					</section>
				)}
			</div>
		</div>
	);
}
