import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllCustomOrders, updateCustomOrderStatus, deleteCustomOrder } from '../redux/slices/adminCustomOrderSlice';
import Loader from '../components/Loader';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'in_production', label: 'In Production' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' }
];

const normalizeStatusValue = (status) => {
  switch (status) {
    case 'in-progress':
      return 'in_production';
    case 'completed':
      return 'delivered';
    default:
      return status;
  }
};

const humanizeStatus = (status) => {
  const normalized = normalizeStatusValue(status);
  const match = STATUS_OPTIONS.find((option) => option.value === normalized);
  if (match) return match.label;
  return (normalized || '').replace(/[_-]/g, ' ');
};

export default function AdminCustomOrders() {
  const dispatch = useDispatch();
  const { customOrders, loading, error, pagination } = useSelector((state) => state.adminCustomOrders);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    dispatch(fetchAllCustomOrders({ page: pagination.page, status: statusFilter }));
  }, [dispatch, pagination.page, statusFilter]);

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      await dispatch(updateCustomOrderStatus({ id: selectedOrder._id, status: newStatus })).unwrap();
      setShowStatusModal(false);
      setSelectedOrder(null);
      setNewStatus('');
      dispatch(fetchAllCustomOrders({ page: pagination.page, status: statusFilter }));
    } catch (error) {
      console.error('Error updating custom order status:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this custom order?')) {
      try {
        await dispatch(deleteCustomOrder(id)).unwrap();
        dispatch(fetchAllCustomOrders({ page: pagination.page, status: statusFilter }));
      } catch (error) {
        console.error('Error deleting custom order:', error);
      }
    }
  };

  const openStatusModal = (order) => {
    setSelectedOrder(order);
    setNewStatus(normalizeStatusValue(order.status));
    setShowStatusModal(true);
  };

  const getStatusColor = (status) => {
    const normalized = normalizeStatusValue(status);
    switch (normalized) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'in_production': return 'bg-orange-100 text-orange-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <Loader />;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Custom Order Management</h1>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {/* Custom Orders List */}
      <div className="space-y-4">
        {customOrders.map((order) => (
          <div key={order._id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">Order #{order._id.slice(-8)}</h3>
                <p className="text-sm text-gray-600">By: {order.user?.name} ({order.user?.email})</p>
                <p className="text-sm text-gray-500">Created: {new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                {humanizeStatus(order.status)}
              </span>
            </div>

            <div className="mb-4">
              <h4 className="font-medium mb-2">Description:</h4>
              <p className="text-gray-700">{order.description}</p>
            </div>

            {order.image && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Image:</h4>
                <img src={order.image} alt="Custom order" className="w-32 h-32 object-cover rounded" />
              </div>
            )}

            {order.customizationDetails && Object.keys(order.customizationDetails).length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Customization Details:</h4>
                <pre className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                  {JSON.stringify(order.customizationDetails, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => openStatusModal(order)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Update Status
              </button>
              {(order.status === 'rejected' || order.status === 'pending') && (
                <button
                  onClick={() => handleDelete(order._id)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex justify-between items-center">
        <button
          onClick={() => dispatch({ type: 'adminCustomOrders/setPage', payload: pagination.page - 1 })}
          disabled={pagination.page <= 1}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span>Page {pagination.page}</span>
        <button
          onClick={() => dispatch({ type: 'adminCustomOrders/setPage', payload: pagination.page + 1 })}
          disabled={!pagination.hasNextPage}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Update Custom Order Status</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end mt-4 space-x-2">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
