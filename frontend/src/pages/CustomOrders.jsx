import React, { useEffect, useState } from 'react';
import orderAPI from '../api/orderAPI';

export default function CustomOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      setError(null);
      try {
        const res = await orderAPI.getMyCustomOrders();
        setOrders(res.data.data.orders || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
      <h2 className="text-2xl font-bold mb-6 text-center">My Custom Orders</h2>
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">{error}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No custom orders found.</div>
      ) : (
        <table className="w-full border rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-3 text-left">Order ID</th>
              <th className="py-2 px-3 text-left">Product</th>
              <th className="py-2 px-3 text-left">Brand</th>
              <th className="py-2 px-3 text-left">Model</th>
              <th className="py-2 px-3 text-left">Status</th>
              <th className="py-2 px-3 text-left">Price</th>
              <th className="py-2 px-3 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id} className="border-b">
                <td className="py-2 px-3 font-mono">{order._id}</td>
                <td className="py-2 px-3">Custom Mobile Case</td>
                <td className="py-2 px-3">{order.items[0]?.brand || '-'}</td>
                <td className="py-2 px-3">{order.items[0]?.model || '-'}</td>
                <td className="py-2 px-3">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{order.status}</span>
                </td>
                <td className="py-2 px-3">Rs.{order.items[0]?.price || order.total}.00</td>
                <td className="py-2 px-3">{new Date(order.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="mt-8 text-center text-sm text-gray-500">
        View and track all your custom mobile case orders here.
      </div>
    </div>
  );
}
