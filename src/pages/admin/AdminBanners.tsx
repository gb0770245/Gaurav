import React, { useState, useEffect } from 'react';
import { MockDatabase, Banner } from '../../services/mockDatabase';
import { Plus, Trash2, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newBanner, setNewBanner] = useState({
    title: '',
    imageUrl: '',
    link: ''
  });

  useEffect(() => {
    setBanners(MockDatabase.getBanners());
  }, []);

  const handleDelete = (id: string) => {
    const updated = MockDatabase.deleteBanner(id);
    setBanners(updated);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const banner: Banner = {
      id: Date.now().toString(),
      ...newBanner,
      active: true
    };
    const updated = MockDatabase.addBanner(banner);
    setBanners(updated);
    setIsAdding(false);
    setNewBanner({ title: '', imageUrl: '', link: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banner Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage promotional banners shown on the user homepage.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Banner
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-indigo-100 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-semibold mb-4">Add New Banner</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., 50% OFF Weekend Sale"
                  value={newBanner.title}
                  onChange={e => setNewBanner({...newBanner, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link (Route)</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., /offers"
                  value={newBanner.link}
                  onChange={e => setNewBanner({...newBanner, link: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <div className="flex space-x-2">
                <input
                  type="url"
                  required
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://example.com/banner.jpg"
                  value={newBanner.imageUrl}
                  onChange={e => setNewBanner({...newBanner, imageUrl: e.target.value})}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Recommended size: 1200x400px</p>
            </div>
            
            {newBanner.imageUrl && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                <div className="relative h-48 w-full rounded-xl overflow-hidden bg-gray-100">
                  <img src={newBanner.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <h3 className="text-white font-bold text-xl">{newBanner.title}</h3>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Save Banner
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners.map((banner) => (
          <div key={banner.id} className="group relative bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative h-48 w-full">
              <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                <button 
                  onClick={() => handleDelete(banner.id)}
                  className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 transition-colors"
                  title="Delete Banner"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <h3 className="text-white font-bold text-lg">{banner.title}</h3>
                <div className="flex items-center text-gray-300 text-sm mt-1">
                  <LinkIcon className="w-3 h-3 mr-1" />
                  {banner.link}
                </div>
              </div>
            </div>
            <div className="p-4 flex justify-between items-center bg-gray-50">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${banner.active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                {banner.active ? 'Active' : 'Inactive'}
              </span>
              <span className="text-xs text-gray-500">ID: {banner.id}</span>
            </div>
          </div>
        ))}
      </div>

      {banners.length === 0 && !isAdding && (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No banners yet</h3>
          <p className="text-gray-500 mb-6">Create your first promotional banner to show on the homepage.</p>
          <button 
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Create Banner
          </button>
        </div>
      )}
    </div>
  );
}
