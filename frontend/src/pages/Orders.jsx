import { useEffect, useState, useCallback } from 'react';
import orderAPI from '../api/orderAPI';
import { PageLoader } from '../components/Loader';
import { formatPrice } from '../utils/helpers';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination & filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit };
      if (status) params.status = status;

      const resp = await orderAPI.getMyOrders(params);
      const data = resp.data?.data || resp.data || resp;

      // Prefer common shapes: data.orders + data.pagination
      const list = data.orders || data.myOrders || data.ordersList || data;
      const pagination = data.pagination || data.meta || data.paging || {};

      setOrders(list || []);

      // Pagination fallback values
      const currentPage = pagination.currentPage || pagination.page || page;
      const tp = pagination.totalPages || pagination.pages || Math.max(1, Math.ceil((pagination.total || totalOrders) / limit));
      const total = pagination.total || data.total || totalOrders;

      setPage(Number(currentPage));
      setTotalPages(Number(tp));
      setTotalOrders(Number(total || (list?.length || 0)));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [page, limit, status, refreshKey]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCancel = async (orderId) => {
    const confirmCancel = window.confirm('Cancel this order?');
    if (!confirmCancel) return;
    try {
      await orderAPI.cancelOrder(orderId, 'Cancelled by user');
      toast.success('Order cancelled');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Cancellation failed');
    }
  };

  if (loading) return <PageLoader />;
  if (error) return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-red-50 border border-red-200 rounded p-4">
        <p className="text-red-700">{error}</p>
      </div>
    </div>
  );

  // Client-side search/filtering of the fetched page results
  const normalizedSearch = search?.toString().trim();
  const filteredOrders = normalizedSearch
    ? orders.filter(o => (o._id || o.id || '').toString().toLowerCase().includes(normalizedSearch.toLowerCase()))
    : orders;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">My Orders</h2>

      {/* Filters */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <label className="text-sm">Status</label>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="ml-2 border rounded px-2 py-1">
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <input
            placeholder="Search by order id"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); setRefreshKey(k => k + 1); } }}
            className="border rounded px-3 py-1 w-60"
          />
          <button
            onClick={() => { setPage(1); setRefreshKey(k => k + 1); }}
            className="bg-primary-600 text-white px-3 py-1 rounded"
          >
            Search
          </button>
          <button
            onClick={() => { setStatus(''); setSearch(''); setPage(1); setRefreshKey(k => k + 1); }}
            className="px-3 py-1 border rounded"
          >
            Reset
          </button>
        </div>

        <div className="ml-auto flex items-center space-x-2">
          <label className="text-sm">Per page</label>
          <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className="ml-2 border rounded px-2 py-1">
            {[5,10,20,50].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <div key={order._id || order.id} className="bg-white rounded-lg shadow-sm border p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">Order <span className="font-mono">{order._id || order.id}</span></div>
              <div className="text-sm text-gray-600">{(order.items || order.orderItems || []).length} items • {new Date(order.createdAt || order.created || order.date || Date.now()).toLocaleString()}</div>
              <div className="text-sm mt-1">Status: <span className="font-medium">{order.status || order.payment?.status || 'Pending'}</span></div>
            </div>

            <div className="text-right">
              <div className="font-medium">{formatPrice(order.total || order.amount || 0)}</div>
              <div className="mt-2 space-x-2">
                <Link to={`/order-success/${order._id || order.id}`} className="text-sm text-primary-600">View</Link>
                <button
                  onClick={() => handleCancel(order._id || order.id)}
                  className="text-sm bg-red-100 text-red-700 py-1 px-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-600">Showing page {page} of {totalPages} — {filteredOrders.length} on this page (total {totalOrders})</div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => { if (page > 1) setPage(p => p - 1); }}
            disabled={page <= 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>

          {/* Numeric page links with collapsing ellipses for large page counts */}
          <div className="flex items-center space-x-1">
            {(() => {
              const pages = [];
              const total = Number(totalPages) || 1;
              const current = Number(page) || 1;

              if (total <= 10) {
                for (let i = 1; i <= total; i++) pages.push(i);
              } else {
                pages.push(1);
                if (current > 4) pages.push('left-ellipsis');

                const start = Math.max(2, current - 2);
                const end = Math.min(total - 1, current + 2);
                for (let i = start; i <= end; i++) pages.push(i);

                if (current < total - 3) pages.push('right-ellipsis');
                pages.push(total);
              }

              return pages.map((p, idx) => {
                if (p === 'left-ellipsis' || p === 'right-ellipsis') {
                  return <div key={p + idx} className="px-2">…</div>;
                }
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1 border rounded ${p === current ? 'bg-primary-600 text-white' : ''}`}
                  >
                    {p}
                  </button>
                );
              });
            })()}
          </div>

          <button
            onClick={() => { if (page < totalPages) setPage(p => p + 1); }}
            disabled={page >= totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
