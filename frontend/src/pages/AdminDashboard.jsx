import React, { useEffect, useState } from 'react';
import adminAPI from '../api/adminAPI';
import Loader from '../components/Loader';
import AdminSidebar from '../components/AdminSidebar';
import axios from '../api/axiosClient';
// Admin Image Upload Component
function AdminImageUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setMessage("");
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("Please select an image file.");
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("image", selectedFile);
    try {
      await axios.post("/uploads", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("Upload successful!");
      setSelectedFile(null);
    } catch (err) {
      setMessage("Upload failed. Try again.");
    }
    setUploading(false);
  };

  return (
    <div className="bg-gradient-to-r from-purple-200 to-white rounded-xl p-6 shadow mb-8">
      <h2 className="text-xl font-bold text-purple-700 mb-2">Upload Poster Image</h2>
      <div className="flex items-center gap-4">
        <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} className="border rounded px-2 py-1" />
        <button onClick={handleUpload} disabled={uploading || !selectedFile} className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>
      {message && <div className={`mt-2 ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>{message}</div>}
    </div>
  );
}


export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminAPI.getDashboardOverview();
      const payload = res?.data?.data || {};
      setOverview(payload.overview || {});

      // combine recent standard orders and custom orders into one list
      const std = payload.recentOrders || [];
      const cust = (payload.recentCustomOrders || []).map((c) => ({
        ...c,
        orderNumber: c.orderNumber || `CUST-${c.id?.toString?.().slice(-8).toUpperCase()}`,
        total: c.price,
        isCustom: true
      }));

      const combined = [...std, ...cust].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRecentOrders(combined.slice(0, 8));
    } catch (err) {
      console.error('Error loading admin overview', err);
      setError(err?.response?.data?.message || err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading) return <Loader />;
  if (error)
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <div className="text-red-600">Error: {error}</div>
        <button onClick={fetchOverview} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
          Retry
        </button>
      </div>
    );

  return (
    <div className="p-6">
      <AdminImageUpload />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="space-x-2">
          <button
            onClick={fetchOverview}
            className="px-4 py-2 bg-gray-100 border rounded hover:bg-gray-200"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="lg:flex lg:items-start lg:gap-6">
        {/* Sidebar for large screens */}
        <div className="hidden lg:block lg:w-64">
          <AdminSidebar />
        </div>

        {/* Main content */}
        <div className="flex-1">
          {/* For small screens show a compact horizontal nav */}
          <div className="lg:hidden mb-4">
            <div className="overflow-x-auto">
              <div className="flex items-center gap-2">
                <AdminSidebar className="flex-shrink-0 w-full" />
              </div>
            </div>
          </div>

          {/* Overview cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white shadow rounded-lg p-4">
              <div className="text-sm text-gray-500">Total Revenue</div>
              <div className="mt-2 text-2xl font-semibold">₹{Number(overview.totalRevenue || 0).toLocaleString()}</div>
              <div className="text-xs text-gray-400 mt-1">Store: ₹{Number(overview.storeRevenue || 0).toLocaleString()} • Custom: ₹{Number(overview.customRevenue || 0).toLocaleString()}</div>
            </div>

            <div className="bg-white shadow rounded-lg p-4">
              <div className="text-sm text-gray-500">Total Users</div>
              <div className="mt-2 text-2xl font-semibold">{overview.totalUsers || 0}</div>
              <div className="text-xs text-gray-400 mt-1">Active: {overview.activeUsers || 0} • New this month: {overview.newUsersThisMonth || 0}</div>
            </div>

            <div className="bg-white shadow rounded-lg p-4">
              <div className="text-sm text-gray-500">Orders</div>
              <div className="mt-2 text-2xl font-semibold">{overview.totalOrders || 0}</div>
              <div className="text-xs text-gray-400 mt-1">Pending: {overview.pendingOrders || 0} • Delivered: {overview.deliveredOrders || 0}</div>
            </div>

            <div className="bg-white shadow rounded-lg p-4">
              <div className="text-sm text-gray-500">Custom Orders</div>
              <div className="mt-2 text-2xl font-semibold">{overview.totalCustomOrders || 0}</div>
              <div className="text-xs text-gray-400 mt-1">Pending: {overview.pendingCustomOrders || 0}</div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-medium">Recent Orders</h2>
              <span className="text-sm text-gray-500">Showing latest {recentOrders.length}</span>
            </div>
            <div className="p-4">
              {recentOrders.length === 0 ? (
                <div className="text-gray-500">No recent orders</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 uppercase">
                        <th className="px-3 py-2">Image</th>
                        <th className="px-3 py-2">Order</th>
                        <th className="px-3 py-2">Customer</th>
                        <th className="px-3 py-2">Amount</th>
                        <th className="px-3 py-2">Payment</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((o) => (
                        <tr key={o.id || o._id} className="border-b last:border-b-0">
                          <td className="px-3 py-3">
                            {o.imageUrl ? (
                              <img src={o.imageUrl} alt="Order" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                            ) : (
                              <span className="text-gray-400">No image</span>
                            )}
                          </td>
                          <td className="px-3 py-3 font-medium">{o.orderNumber || `ORD-${o.id?.toString?.().slice(-8).toUpperCase()}`}</td>
                          <td className="px-3 py-3">{o.customerName || o.customerEmail || 'Guest'}</td>
                          <td className="px-3 py-3">₹{Number(o.total || 0).toLocaleString()}</td>
                          <td className="px-3 py-3">{o.paymentStatus || (o.payment && o.payment.status) || '--'}</td>
                          <td className="px-3 py-3">
                            <span className={`px-2 py-1 text-xs rounded ${
                              o.status === 'delivered' ? 'bg-green-100 text-green-800' : o.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-gray-500 text-xs">{new Date(o.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
