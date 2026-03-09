import { User } from '../types';

// Types
export interface Rider extends User {
  status: 'active' | 'inactive' | 'pending';
  currentLocation?: { lat: number; lng: number };
  totalDeliveries: number;
  rating: number;
  earnings: number;
  vehicleType: 'bike' | 'scooter' | 'cycle';
}

export interface Banner {
  id: string;
  imageUrl: string;
  title: string;
  link: string;
  active: boolean;
}

export interface AppSettings {
  baseDeliveryFee: number;
  costPerKm: number;
  freeDeliveryThreshold: number;
  maxDeliveryRadius: number; // in km
  platformFee: number;
}

// Initial Data
const INITIAL_RIDERS: Rider[] = [
  {
    id: 101,
    name: 'Rahul Kumar',
    email: 'rahul@example.com',
    status: 'active',
    totalDeliveries: 145,
    rating: 4.8,
    earnings: 12500,
    vehicleType: 'bike',
    mobile: '9876543210',
    addresses: [],
    walletBalance: 0
  },
  {
    id: 102,
    name: 'Vikram Singh',
    email: 'vikram@example.com',
    status: 'pending',
    totalDeliveries: 0,
    rating: 0,
    earnings: 0,
    vehicleType: 'scooter',
    mobile: '9876543211',
    addresses: [],
    walletBalance: 0
  },
  {
    id: 103,
    name: 'Amit Sharma',
    email: 'amit@example.com',
    status: 'inactive',
    totalDeliveries: 320,
    rating: 4.9,
    earnings: 28000,
    vehicleType: 'bike',
    mobile: '9876543212',
    addresses: [],
    walletBalance: 0
  }
];

const INITIAL_BANNERS: Banner[] = [
  {
    id: 'b1',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80',
    title: '50% OFF on First Order',
    link: '/offers',
    active: true
  },
  {
    id: 'b2',
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1000&q=80',
    title: 'Free Delivery Weekend',
    link: '/offers',
    active: true
  }
];

const INITIAL_SETTINGS: AppSettings = {
  baseDeliveryFee: 40,
  costPerKm: 10,
  freeDeliveryThreshold: 500,
  maxDeliveryRadius: 15,
  platformFee: 5
};

// Storage Keys
const KEYS = {
  RIDERS: 'app_riders',
  BANNERS: 'app_banners',
  SETTINGS: 'app_settings'
};

// Service
export const MockDatabase = {
  // Riders
  getRiders: (): Rider[] => {
    const stored = localStorage.getItem(KEYS.RIDERS);
    if (!stored) {
      localStorage.setItem(KEYS.RIDERS, JSON.stringify(INITIAL_RIDERS));
      return INITIAL_RIDERS;
    }
    return JSON.parse(stored);
  },
  
  updateRiderStatus: (riderId: number, status: Rider['status']) => {
    const riders = MockDatabase.getRiders();
    const updated = riders.map(r => r.id === riderId ? { ...r, status } : r);
    localStorage.setItem(KEYS.RIDERS, JSON.stringify(updated));
    return updated;
  },

  addRider: (rider: Rider) => {
    const riders = MockDatabase.getRiders();
    riders.push(rider);
    localStorage.setItem(KEYS.RIDERS, JSON.stringify(riders));
    return riders;
  },

  // Banners
  getBanners: (): Banner[] => {
    const stored = localStorage.getItem(KEYS.BANNERS);
    if (!stored) {
      localStorage.setItem(KEYS.BANNERS, JSON.stringify(INITIAL_BANNERS));
      return INITIAL_BANNERS;
    }
    return JSON.parse(stored);
  },

  addBanner: (banner: Banner) => {
    const banners = MockDatabase.getBanners();
    banners.push(banner);
    localStorage.setItem(KEYS.BANNERS, JSON.stringify(banners));
    return banners;
  },

  deleteBanner: (id: string) => {
    const banners = MockDatabase.getBanners();
    const updated = banners.filter(b => b.id !== id);
    localStorage.setItem(KEYS.BANNERS, JSON.stringify(updated));
    return updated;
  },

  // Settings
  getSettings: (): AppSettings => {
    const stored = localStorage.getItem(KEYS.SETTINGS);
    if (!stored) {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
      return INITIAL_SETTINGS;
    }
    return JSON.parse(stored);
  },

  updateSettings: (settings: AppSettings) => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    return settings;
  }
};
