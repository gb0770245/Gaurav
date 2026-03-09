import React, { useState, useEffect } from 'react';
import { MockDatabase, AppSettings } from '../../services/mockDatabase';
import { Save, Truck, MapPin, DollarSign, Percent } from 'lucide-react';

export default function AdminSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setSettings(MockDatabase.getSettings());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    MockDatabase.updateSettings(settings);
    
    setTimeout(() => {
      setIsSaving(false);
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    }, 800);
  };

  if (!settings) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery & Fees</h1>
          <p className="text-sm text-gray-500 mt-1">Configure global delivery settings and platform fees.</p>
        </div>
        {message && (
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-2">
            {message}
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Delivery Fees Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center">
            <Truck className="w-5 h-5 text-indigo-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Delivery Configuration</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base Delivery Fee (₹)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  min="0"
                  required
                  className="pl-7 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10 border px-3"
                  value={settings.baseDeliveryFee}
                  onChange={e => setSettings({...settings, baseDeliveryFee: Number(e.target.value)})}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Fixed fee applied to every order.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost Per Kilometer (₹)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  min="0"
                  required
                  className="pl-7 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10 border px-3"
                  value={settings.costPerKm}
                  onChange={e => setSettings({...settings, costPerKm: Number(e.target.value)})}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Additional fee per km distance.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Free Delivery Threshold (₹)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  min="0"
                  required
                  className="pl-7 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10 border px-3"
                  value={settings.freeDeliveryThreshold}
                  onChange={e => setSettings({...settings, freeDeliveryThreshold: Number(e.target.value)})}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Orders above this amount get free delivery.</p>
            </div>
          </div>
        </div>

        {/* Zones Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center">
            <MapPin className="w-5 h-5 text-indigo-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Service Zones</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Delivery Radius (km)</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10 border px-3"
                  value={settings.maxDeliveryRadius}
                  onChange={e => setSettings({...settings, maxDeliveryRadius: Number(e.target.value)})}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Restaurants won't appear for users outside this range.</p>
            </div>
          </div>
        </div>

        {/* Platform Fees Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center">
            <DollarSign className="w-5 h-5 text-indigo-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Platform Commission</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform Fee (%)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Percent className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10 border px-3"
                  value={settings.platformFee}
                  onChange={e => setSettings({...settings, platformFee: Number(e.target.value)})}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Percentage taken from restaurant earnings.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <Save className="w-5 h-5 mr-2" />
            {isSaving ? 'Saving Changes...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}
