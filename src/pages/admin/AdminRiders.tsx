import React, { useState, useEffect } from 'react';
import { MockDatabase, Rider } from '../../services/mockDatabase';
import { MapPin, Phone, Star, Check, X, Truck } from 'lucide-react';

export default function AdminRiders() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'pending'>('all');

  useEffect(() => {
    setRiders(MockDatabase.getRiders());
  }, []);

  const handleStatusChange = (id: number, status: Rider['status']) => {
    const updated = MockDatabase.updateRiderStatus(id, status);
    setRiders(updated);
  };

  const filteredRiders = riders.filter(r => filter === 'all' || r.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Rider Management</h1>
        <div className="flex space-x-2">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg ${filter === 'active' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border'}`}
          >
            Active
          </button>
          <button 
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg ${filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-white text-gray-700 border'}`}
          >
            Pending Approval
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Riders</p>
              <h3 className="text-2xl font-bold text-gray-900">{riders.length}</h3>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg">
              <Truck className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Now</p>
              <h3 className="text-2xl font-bold text-green-600">
                {riders.filter(r => r.status === 'active').length}
              </h3>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Check className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Approval</p>
              <h3 className="text-2xl font-bold text-yellow-600">
                {riders.filter(r => r.status === 'pending').length}
              </h3>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Riders List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rider</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRiders.map((rider) => (
              <tr key={rider.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                      {rider.name.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{rider.name}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Phone className="w-3 h-3 mr-1" /> {rider.mobile || 'N/A'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${rider.status === 'active' ? 'bg-green-100 text-green-800' : 
                      rider.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'}`}>
                    {rider.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                  {rider.vehicleType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{rider.totalDeliveries} Deliveries</div>
                  <div className="text-sm text-gray-500 flex items-center">
                    <Star className="w-3 h-3 text-yellow-400 mr-1" /> {rider.rating} Rating
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {rider.status === 'pending' && (
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => handleStatusChange(rider.id, 'active')}
                        className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded-md"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleStatusChange(rider.id, 'inactive')}
                        className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {rider.status === 'active' && (
                    <button 
                      onClick={() => handleStatusChange(rider.id, 'inactive')}
                      className="text-red-600 hover:text-red-900"
                    >
                      Deactivate
                    </button>
                  )}
                  {rider.status === 'inactive' && (
                    <button 
                      onClick={() => handleStatusChange(rider.id, 'active')}
                      className="text-green-600 hover:text-green-900"
                    >
                      Activate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
