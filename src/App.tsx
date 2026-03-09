import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Store, Bike, PieChart as PieChartIcon, Smartphone, Lock, UserPlus, 
  MapPin, Search, Mic, Star, CloudRain, Sparkles, ChevronRight, 
  ArrowLeft, ShoppingBag, Home, Utensils, User as UserIcon,
  Plus, Trash2, CreditCard, Bell, Settings, LogOut, Ticket,
  CheckCheck, Percent, ChevronDown, X, Wallet, Edit2, Eye, EyeOff,
  BarChart2, History, Power, FileText, Info, Clock, Camera, Menu,
  Map, Image, MessageSquare, Send, Globe, Shield, Headphones, Navigation, QrCode, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { INITIAL_USERS, RESTAURANTS, INITIAL_ORDERS, COUPONS, Coupon, INITIAL_RIDERS } from './data';
import { User as UserType, Restaurant, Order, Cart, Address, MenuItem, RestaurantCoupon, Rider, PayoutTransaction, Banner, SupportTicket, WalletTransaction } from './types';
import { Toast } from './components/Toast';
import AdminRiders from './pages/admin/AdminRiders';
import AdminBanners from './pages/admin/AdminBanners';
import AdminSettings from './pages/admin/AdminSettings';

// --- MAIN APP COMPONENT ---
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function App() {
  // --- STATE ---
  const [currentView, setCurrentView] = useState<'role' | 'auth' | 'user' | 'restaurant' | 'delivery' | 'admin'>('role');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [users, setUsers] = useState<UserType[]>(INITIAL_USERS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [cart, setCart] = useState<Cart>({ restaurantId: null, items: [] });
  const [restaurants, setRestaurants] = useState<Restaurant[]>(RESTAURANTS);
  
  // Filter State
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const toggleFilter = (filter: string) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter) 
        : [...prev, filter]
    );
  };
  
  // Rider State
  const [riders, setRiders] = useState<Rider[]>(INITIAL_RIDERS);
  const [currentRider, setCurrentRider] = useState<Rider | null>(null);
  const [riderAuthMode, setRiderAuthMode] = useState<'login' | 'signup'>('login');
  const [riderTab, setRiderTab] = useState<'active' | 'history' | 'earnings'>('active');
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);

  // Admin State
  const [adminTab, setAdminTab] = useState<'dashboard' | 'restaurants' | 'users' | 'riders' | 'payouts' | 'live-map' | 'settings' | 'banners' | 'support' | 'notifications' | 'coupons' | 'reports'>('dashboard');
  const [adminMobileMenuOpen, setAdminMobileMenuOpen] = useState(false);
  
  // Admin Extended State
  const [platformSettings, setPlatformSettings] = useState({ commission: 10, deliveryBase: 20, deliveryPerKm: 5, maintenanceMode: false });
  const [banners, setBanners] = useState<Banner[]>([
    { id: '1', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80', active: true },
    { id: '2', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80', active: true }
  ]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([
    { id: 'T-101', user: 'Rahul Kumar', issue: 'Order not delivered', status: 'Open', date: '2023-10-25', description: 'I ordered 2 hours ago and still not received.' },
    { id: 'T-102', user: 'Amit Singh', issue: 'Refund request', status: 'Resolved', date: '2023-10-24', description: 'Food was cold, need refund.' }
  ]);
  const [notificationForm, setNotificationForm] = useState({ title: '', message: '', target: 'all' });
  const [userSupportForm, setUserSupportForm] = useState({ issue: '', description: '' });
  const [newBannerUrl, setNewBannerUrl] = useState('');
  const [mapTick, setMapTick] = useState(0);
  const [isSendingNotification, setIsSendingNotification] = useState(false);

  // Location State
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userAddress, setUserAddress] = useState<string>("");

  // Helper: Calculate Distance (Haversine)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };



  const nearbyRestaurants = React.useMemo(() => {
    if (!userLocation) return [];
    
    return restaurants.map(r => {
      if (!r.location) return { ...r, distance: Infinity };
      const dist = calculateDistance(userLocation.lat, userLocation.lng, r.location.lat, r.location.lng);
      return { ...r, distance: dist };
    })
    .filter(r => {
      // Distance check
      if (r.distance > (r.deliveryRadius || 15)) return false;

      // Active Filters
      if (activeFilters.includes('Pure Veg')) {
        if (!r.menu.every(item => item.veg)) return false;
      }
      if (activeFilters.includes('Rating 4.5+')) {
        if (parseFloat(r.rating) < 4.5) return false;
      }
      if (activeFilters.includes('Fast Delivery')) {
        const time = parseInt(r.timeDist.split('-')[0]); 
        if (isNaN(time) || time > 30) return false;
      }
      if (activeFilters.includes('Offers')) {
        if (!r.coupons || r.coupons.length === 0) return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Sort by distance first
      if (a.distance !== b.distance) return a.distance - b.distance;
      // Then rating
      return parseFloat(b.rating) - parseFloat(a.rating);
    });
  }, [restaurants, userLocation, activeFilters]);

  // Restaurant Signup Location State
  const [signupLocation, setSignupLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocatingSignup, setIsLocatingSignup] = useState(false);

  // WebSocket Ref
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Fetch initial data
    fetch('/api/data')
      .then(res => res.json())
      .then(data => {
        if (data.users) setUsers(data.users);
        if (data.orders) setOrders(data.orders);
        if (data.restaurants) setRestaurants(data.restaurants);
        if (data.riders) setRiders(data.riders);
        if (data.coupons) setCoupons(data.coupons);
        if (data.banners) setBanners(data.banners);
        if (data.supportTickets) setSupportTickets(data.supportTickets);
      })
      .catch(err => console.error("Failed to fetch initial data:", err));

    // Connect WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to WebSocket');
    };

    ws.onmessage = (event) => {
      try {
        const { type, payload } = JSON.parse(event.data);
        console.log('Received WS message:', type, payload);
        
        switch (type) {
          case 'ORDER_CREATED':
            setOrders(prev => {
              if (prev.find(o => o.id === payload.id)) return prev;
              return [payload, ...prev];
            });
            triggerToast(`New Order #${payload.id} Received!`);
            // Play notification if in restaurant or admin view
            if (currentView === 'restaurant' || currentView === 'admin') {
               sendOrderNotification(payload.id, payload.total);
            }
            break;
          case 'ORDER_UPDATED':
            setOrders(prev => prev.map(o => o.id === payload.id ? payload : o));
            break;
          case 'USER_CREATED':
            setUsers(prev => [...prev, payload]);
            break;
          case 'USER_UPDATED':
            setUsers(prev => prev.map(u => u.id === payload.id ? payload : u));
            break;
          case 'RIDER_CREATED':
            setRiders(prev => [...prev, payload]);
            break;
          case 'RIDER_UPDATED':
            setRiders(prev => prev.map(r => r.id === payload.id ? payload : r));
            break;
          case 'RESTAURANT_CREATED':
            setRestaurants(prev => [...prev, payload]);
            break;
          case 'RESTAURANT_UPDATED':
            setRestaurants(prev => prev.map(r => r.id === payload.id ? payload : r));
            break;
          case 'RESTAURANT_DELETED':
            setRestaurants(prev => prev.filter(r => r.id !== payload));
            break;
          case 'COUPON_CREATED':
            setCoupons(prev => [...prev, payload]);
            break;
          case 'COUPON_DELETED':
            setCoupons(prev => prev.filter(c => c.code !== payload));
            break;
          case 'COUPON_UPDATED':
            setCoupons(prev => prev.map(c => c.code === payload.code ? payload : c));
            break;
          case 'BANNER_CREATED':
            setBanners(prev => [...prev, payload]);
            break;
          case 'BANNER_DELETED':
            setBanners(prev => prev.filter(b => b.id !== payload));
            break;
          case 'BANNER_UPDATED':
             setBanners(prev => prev.map(b => b.id === payload.id ? { ...b, ...payload } : b));
             break;
          case 'NOTIFICATION_SENT':
             setNotificationAlert({
               title: payload.title,
               body: payload.message
             });
             setTimeout(() => setNotificationAlert(null), 5000);
             break;
        }
      } catch (e) {
        console.error("Error parsing WS message", e);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    let interval: any;
    if (adminTab === 'live-map') {
      interval = setInterval(() => setMapTick(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [adminTab]);

  // User Sub-views
  const [userSubView, setUserSubView] = useState<'home' | 'menu' | 'profile' | 'cart' | 'checkout' | 'dining'>('home');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [profileSubView, setProfileSubView] = useState<string | null>(null);
  
  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Checkout State
  const [checkoutAddressIdx, setCheckoutAddressIdx] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod' | 'wallet'>('razorpay');
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutMobile, setCheckoutMobile] = useState('');
  const [checkoutLocation, setCheckoutLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Detect Location Function
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported");
      setUserAddress("Location not supported");
      return;
    }

    setIsLocating(true);
    setLocationError(null);
    setUserAddress("Locating...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setIsLocating(false);
        
        // Reverse Geocoding
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
          .then(res => res.json())
          .then(data => {
            if (data.display_name) {
              // Format: Neighborhood, City
              const parts = data.display_name.split(',');
              setUserAddress(`${parts[0]}, ${parts[1] || ''}`);
            } else {
              setUserAddress("Current Location");
            }
          })
          .catch(() => setUserAddress("Current Location"));
      },
      (error) => {
        setIsLocating(false);
        let errorMsg = "Location access denied";
        if (error.code === 1) errorMsg = "Permission denied. Enable location in browser settings.";
        else if (error.code === 2) errorMsg = "Position unavailable.";
        else if (error.code === 3) errorMsg = "Timeout.";
        
        setLocationError(errorMsg);
        setUserAddress("Location disabled");
        console.error("Error getting location:", error);
        triggerToast(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    detectLocation();
  }, []);

  
  // Coupon State
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Add Address Modal
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddressTitle, setNewAddressTitle] = useState('');
  const [newAddressText, setNewAddressText] = useState('');

  // Voice Search
  const [isListening, setIsListening] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const recognitionRef = useRef<any>(null);

  const startListening = async () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      try {
        // Explicitly request microphone permission first
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
      } catch (err) {
        console.warn("Microphone permission denied:", err);
        triggerToast("Microphone access denied. Please allow microphone permissions.");
        return;
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchTerm(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          console.warn("Speech recognition not allowed");
          triggerToast("Microphone access denied. Please allow microphone permissions.");
        } else if (event.error === 'no-speech') {
           // Ignore no-speech error, just stop listening
           console.log("No speech detected");
        } else {
          console.error("Speech recognition error", event.error);
          triggerToast("Voice recognition failed: " + event.error);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      triggerToast("Voice search not supported in this browser.");
    }
  };

  // Restaurant Panel State
  const [restaurantTab, setRestaurantTab] = useState<'orders' | 'menu' | 'analytics' | 'history' | 'settings' | 'payouts' | 'marketing' | 'reviews'>('orders');
  const [managedRestaurantId, setManagedRestaurantId] = useState<number | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null); // null means adding new
  const [restaurantAuthMode, setRestaurantAuthMode] = useState<'login' | 'signup'>('login');
  const [currentRestaurantOwner, setCurrentRestaurantOwner] = useState<string | null>(null); // Mobile number of logged in owner
  const [notificationAlert, setNotificationAlert] = useState<{title: string, body: string} | null>(null);
  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState<NotificationPermission>(
    "Notification" in window ? Notification.permission : 'default'
  );
  
  // Marketing & Reviews State
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingRestaurantCoupon, setEditingRestaurantCoupon] = useState<RestaurantCoupon | null>(null);
  const [replyText, setReplyText] = useState<string>("");
  const [replyingToReviewId, setReplyingToReviewId] = useState<number | null>(null);
  
  // Rating State
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingOrderId, setRatingOrderId] = useState<string | null>(null);
  const [ratingStars, setRatingStars] = useState(0);

  // Bank Details State
  const [showBankModal, setShowBankModal] = useState(false);

  // Admin Restaurant Management State
  const [showAddRestaurantModal, setShowAddRestaurantModal] = useState(false);
  const [showEditRestaurantModal, setShowEditRestaurantModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showAddMenuItemModal, setShowAddMenuItemModal] = useState(false);
  const [menuItemForm, setMenuItemForm] = useState<Partial<MenuItem>>({ veg: true });
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [restaurantForm, setRestaurantForm] = useState<Partial<Restaurant>>({});

  // Admin Coupon Management State
  const [coupons, setCoupons] = useState<Coupon[]>(COUPONS);
  const [showAdminCouponModal, setShowAdminCouponModal] = useState(false);
  const [adminCouponForm, setAdminCouponForm] = useState<Partial<Coupon>>({});
  const [editingCouponCode, setEditingCouponCode] = useState<string | null>(null);
  const [couponToDelete, setCouponToDelete] = useState<string | null>(null);

  // User Settings State
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [changePasswordForm, setChangePasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [appLanguage, setAppLanguage] = useState('English');

  // --- ADMIN DASHBOARD STATS ---
  const adminDashboardStats = React.useMemo(() => {
    // 1. Weekly Sales Report
    const salesData = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      // Filter orders for this day
      const dayOrders = orders.filter(o => {
        const orderDate = o.createdAt ? new Date(o.createdAt) : new Date(); 
        return orderDate.getDate() === d.getDate() && 
               orderDate.getMonth() === d.getMonth() && 
               orderDate.getFullYear() === d.getFullYear();
      });
      
      const totalSales = dayOrders.reduce((sum, o) => sum + o.total, 0);
      salesData.push({ name: dayName, sales: totalSales });
    }

    // 2. Top Selling Items
    const itemCounts: Record<string, number> = {};
    orders.forEach(o => {
      o.items.forEach(i => {
        const itemName = i.name;
        itemCounts[itemName] = (itemCounts[itemName] || 0) + i.qty;
      });
    });
    
    const topItemsData = Object.entries(itemCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
      
    if (topItemsData.length === 0) {
       topItemsData.push({ name: 'No Data', value: 1 });
    }

    // 3. Peak Order Hours
    const hoursData = [
      { name: '10 AM', hour: 10, orders: 0 },
      { name: '12 PM', hour: 12, orders: 0 },
      { name: '2 PM', hour: 14, orders: 0 },
      { name: '4 PM', hour: 16, orders: 0 },
      { name: '6 PM', hour: 18, orders: 0 },
      { name: '8 PM', hour: 20, orders: 0 },
      { name: '10 PM', hour: 22, orders: 0 }
    ];
    
    orders.forEach(o => {
      const orderDate = o.createdAt ? new Date(o.createdAt) : new Date(); 
      const hour = orderDate.getHours();
      
      let closest = hoursData[0];
      let minDiff = Math.abs(hour - closest.hour);
      
      for (const h of hoursData) {
        const diff = Math.abs(hour - h.hour);
        if (diff < minDiff) {
          minDiff = diff;
          closest = h;
        }
      }
      closest.orders++;
    });

    return { salesData, topItemsData, hoursData };
  }, [orders]);

  // --- ADMIN HELPERS ---
  const toggleUserBlock = (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isBlocked: !user.isBlocked })
    })
    .then(res => res.json())
    .then(updatedUser => {
      triggerToast(updatedUser.isBlocked ? "User Blocked!" : "User Unblocked!");
    })
    .catch(err => console.error("Toggle block failed", err));
  };

  const approveRider = (riderId: number, status: boolean) => {
    fetch(`/api/riders/${riderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isApproved: status })
    })
    .then(res => res.json())
    .then(() => {
      triggerToast(status ? "Rider Approved!" : "Rider Rejected!");
    })
    .catch(err => console.error("Approve rider failed", err));
  };

  const addBanner = () => {
    if (!newBannerUrl) {
      triggerToast("Please enter an image URL!");
      return;
    }
    const newBanner: Banner = {
      id: Date.now().toString(),
      image: newBannerUrl,
      active: true
    };
    
    fetch('/api/banners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBanner)
    })
    .then(res => res.json())
    .then(() => {
      setNewBannerUrl('');
      triggerToast("Banner Added Successfully!");
    })
    .catch(err => console.error("Add banner failed", err));
  };

  const deleteBanner = (id: string) => {
    if (confirm("Delete this banner?")) {
      fetch(`/api/banners/${id}`, {
        method: 'DELETE'
      })
      .then(() => {
        triggerToast("Banner Deleted!");
      })
      .catch(err => console.error("Delete banner failed", err));
    }
  };

  const toggleBanner = (id: string) => {
    const banner = banners.find(b => b.id === id);
    if (!banner) return;

    fetch(`/api/banners/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !banner.active })
    })
    .then(() => {
      triggerToast("Banner Status Updated!");
    })
    .catch(err => console.error("Toggle banner failed", err));
  };

  const sendPushNotification = () => {
    if (!notificationForm.title || !notificationForm.message) {
      triggerToast("Please fill all fields!");
      return;
    }
    setIsSendingNotification(true);
    
    fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notificationForm)
    })
    .then(() => {
      triggerToast(`Notification Sent to ${notificationForm.target === 'all' ? 'All Users' : 'Selected Users'}! 🚀`);
      setNotificationForm({ title: '', message: '', target: 'all' });
      setIsSendingNotification(false);
    })
    .catch(err => {
      console.error("Send notification failed", err);
      setIsSendingNotification(false);
    });
  };

  const handleAddCoupon = () => {
    if (!adminCouponForm.code || !adminCouponForm.discount) {
      triggerToast("Please fill required fields!");
      return;
    }
    const newCoupon: Coupon = {
      code: adminCouponForm.code!.toUpperCase(),
      discount: Number(adminCouponForm.discount),
      maxDiscount: Number(adminCouponForm.maxDiscount) || 0,
      minOrder: Number(adminCouponForm.minOrder) || 0,
      desc: adminCouponForm.desc || ''
    };
    
    if (editingCouponCode) {
      // Update existing
      fetch(`/api/coupons/${editingCouponCode}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCoupon)
      })
      .then(res => res.json())
      .then(() => {
        triggerToast("Coupon Updated Successfully!");
        setEditingCouponCode(null);
        setShowAdminCouponModal(false);
        setAdminCouponForm({});
      })
      .catch(err => console.error("Update coupon failed", err));
    } else {
      // Add new
      // Check if code exists
      if (coupons.find(c => c.code === newCoupon.code)) {
        triggerToast("Coupon code already exists!");
        return;
      }
      
      fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCoupon)
      })
      .then(res => res.json())
      .then(() => {
        triggerToast("Coupon Added Successfully!");
        setShowAdminCouponModal(false);
        setAdminCouponForm({});
      })
      .catch(err => console.error("Add coupon failed", err));
    }
  };

  const handleDeleteCoupon = (code: string) => {
    setCouponToDelete(code);
  };

  const confirmDeleteCoupon = () => {
    if (couponToDelete) {
      fetch(`/api/coupons/${couponToDelete}`, {
        method: 'DELETE'
      })
      .then(() => {
        triggerToast("Coupon Deleted!");
        setCouponToDelete(null);
      })
      .catch(err => console.error("Delete coupon failed", err));
    }
  };

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      triggerToast("This browser does not support desktop notifications");
      return;
    }
    
    if (Notification.permission === 'denied') {
      triggerToast("⚠️ Notifications are blocked! Please enable them in your browser settings (Lock icon in URL bar).");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermissionStatus(permission);
    
    if (permission === "granted") {
      triggerToast("Notifications enabled successfully!");
      new Notification("Zayka Food Delivery", { body: "You will now receive order alerts here." });
    } else {
      triggerToast("Permission Denied.");
    }
  };

  const sendOrderNotification = (orderId: string, amount: number) => {
    // 1. System Notification (Best Effort)
    if (Notification.permission === "granted") {
      try {
        new Notification("New Order Received! 🔔", {
          body: `Order #${orderId} worth ₹${amount} has been placed.`,
          icon: "https://cdn-icons-png.flaticon.com/512/7541/7541700.png"
        });
      } catch (e) {
        console.error("System notification failed", e);
      }
    }

    // 2. In-App Global Alert (Guaranteed Fallback)
    setNotificationAlert({
      title: "New Order Received! 🔔",
      body: `Order #${orderId} worth ₹${amount} has been placed.`
    });

    // 3. Play Voice Notification (Loop for 30s)
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any previous speech
      
      let keepSpeaking = true;
      const text = "New Order coming";
      
      const speak = () => {
        if (!keepSpeaking) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        utterance.onend = () => {
          if (keepSpeaking) {
             setTimeout(speak, 1000); // 1s delay between repeats
          }
        };
        
        utterance.onerror = (e) => {
            console.error("Speech synthesis error", e);
        };

        window.speechSynthesis.speak(utterance);
      };

      speak();

      // Stop after 30 seconds
      setTimeout(() => {
        keepSpeaking = false;
        window.speechSynthesis.cancel();
      }, 30000);
    } else {
      // Fallback to beep if TTS not supported
      try {
        const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
        audio.loop = true;
        audio.play().catch(e => console.log("Audio play failed", e));

        // Stop after 30 seconds
        setTimeout(() => {
          audio.pause();
          audio.currentTime = 0;
        }, 30000);
      } catch (e) {
        console.error("Audio failed", e);
      }
    }

    // Auto hide in-app alert after 5s
    setTimeout(() => setNotificationAlert(null), 5000);
  };

  const handleRiderLogin = (mobile: string, pass: string) => {
    const rider = riders.find(r => r.mobile === mobile && r.password === pass);
    if (rider) {
      setCurrentRider(rider);
      triggerToast(`Welcome back, ${rider.name}!`);
    } else {
      triggerToast("Invalid Rider Credentials!");
    }
  };

  const handleRiderSignup = (name: string, mobile: string, pass: string) => {
    if (riders.find(r => r.mobile === mobile)) {
      triggerToast("Rider already registered!");
      return;
    }
    const newRider: Rider = {
      id: Math.floor(Math.random() * 10000),
      name,
      mobile,
      password: pass,
      isOnline: true,
      earnings: { today: 0, week: 0, total: 0 },
      currentOrderId: null,
      isApproved: false
    };

    fetch('/api/riders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRider)
    })
    .then(res => res.json())
    .then(savedRider => {
      setCurrentRider(savedRider);
      triggerToast("Rider Registration Successful! Please wait for approval.");
    })
    .catch(err => console.error("Rider signup failed", err));
  };

  const toggleRiderStatus = () => {
    if (currentRider) {
      const updated = { ...currentRider, isOnline: !currentRider.isOnline };
      fetch(`/api/riders/${currentRider.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline: updated.isOnline })
      })
      .then(res => res.json())
      .then(savedRider => {
        setCurrentRider(savedRider);
        setRiders(prev => prev.map(r => r.id === savedRider.id ? savedRider : r));
        triggerToast(savedRider.isOnline ? "You are now Online 🟢" : "You are now Offline 🔴");
      })
      .catch(err => {
        console.error("Update failed", err);
        // Fallback
        setCurrentRider(updated);
        setRiders(prev => prev.map(r => r.id === updated.id ? updated : r));
        triggerToast(updated.isOnline ? "You are now Online 🟢 (Offline Mode)" : "You are now Offline 🔴 (Offline Mode)");
      });
    }
  };

  const acceptDelivery = (orderId: string) => {
    if (!currentRider) return;
    if (currentRider.currentOrderId) {
      triggerToast("Complete current delivery first!");
      return;
    }
    
    // Assign Order
    fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Out for Delivery', riderId: currentRider.id })
    })
    .then(res => res.json())
    .then(updatedOrder => {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updatedOrder } : o));
    })
    .catch(err => {
      console.error("Assign order failed", err);
      // Fallback
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Out for Delivery', riderId: currentRider.id } : o));
    });
    
    // Update Rider State
    fetch(`/api/riders/${currentRider.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentOrderId: orderId })
    })
    .then(res => res.json())
    .then(updatedRider => {
      setCurrentRider(updatedRider);
      setRiders(prev => prev.map(r => r.id === updatedRider.id ? updatedRider : r));
      triggerToast("Delivery Accepted! 🏍️");
    })
    .catch(err => {
      console.error("Accept failed", err);
      // Fallback
      const updatedRider = { ...currentRider, currentOrderId: orderId };
      setCurrentRider(updatedRider);
      setRiders(prev => prev.map(r => r.id === updatedRider.id ? updatedRider : r));
      triggerToast("Delivery Accepted! 🏍️ (Offline Mode)");
    });
  };

  const completeDelivery = async () => {
    if (!currentRider || !currentRider.currentOrderId) return;
    
    // Simulate Image Upload
    let proofUrl = "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=300&q=80"; // Default placeholder
    if (proofFile) {
       proofUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(proofFile);
      });
    }

    const orderId = currentRider.currentOrderId;
    const deliveryFee = 40;
    
    // Update Order
    fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Delivered', proofOfDelivery: proofUrl })
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to complete order');
      return res.json();
    })
    .then(updatedOrder => {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updatedOrder } : o));
    })
    .catch(err => {
      console.error("Complete order failed", err);
      // Fallback
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Delivered', proofOfDelivery: proofUrl } : o));
    });
    
    // Update Rider Earnings
    const updatedRider = { 
      ...currentRider, 
      currentOrderId: null,
      earnings: {
        today: currentRider.earnings.today + deliveryFee,
        week: currentRider.earnings.week + deliveryFee,
        total: currentRider.earnings.total + deliveryFee
      }
    };
    
    fetch(`/api/riders/${currentRider.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedRider)
    })
    .then(res => res.json())
    .then(savedRider => {
      setCurrentRider(savedRider);
      setRiders(prev => prev.map(r => r.id === savedRider.id ? savedRider : r));
      setShowProofModal(false);
      setProofFile(null);
      triggerToast(`Delivery Completed! You earned ₹${deliveryFee} 💰`);
    })
    .catch(err => {
      console.error("Complete failed", err);
      // Fallback
      setCurrentRider(updatedRider);
      setRiders(prev => prev.map(r => r.id === updatedRider.id ? updatedRider : r));
      setShowProofModal(false);
      setProofFile(null);
      triggerToast(`Delivery Completed! You earned ₹${deliveryFee} 💰 (Offline Mode)`);
    });
  };

  const handleRateRider = () => {
    if (!ratingOrderId || ratingStars === 0) return;

    const order = orders.find(o => o.id === ratingOrderId);
    if (!order || !order.riderId) return;

    // Update Order with Rating
    const updatedOrders = orders.map(o => o.id === ratingOrderId ? { ...o, riderRating: ratingStars } : o);
    setOrders(updatedOrders);

    // Update Rider Stats
    const rider = riders.find(r => r.id === order.riderId);
    if (rider) {
      const currentTotal = rider.totalRatings || 0;
      const currentRating = rider.rating || 5;
      const newTotal = currentTotal + 1;
      const newRating = ((currentRating * currentTotal) + ratingStars) / newTotal;

      const updatedRider = { ...rider, rating: parseFloat(newRating.toFixed(1)), totalRatings: newTotal };
      setRiders(riders.map(r => r.id === rider.id ? updatedRider : r));
    }

    setShowRatingModal(false);
    setRatingOrderId(null);
    setRatingStars(0);
    triggerToast("Thank you for rating the rider! ⭐");
  };

  const handleRestaurantLogin = (mobile: string, pass: string) => {
    const rest = restaurants.find(r => r.ownerId === mobile && r.password === pass);
    if (rest) {
      setCurrentRestaurantOwner(mobile);
      setManagedRestaurantId(rest.id);
      triggerToast(`Welcome back to ${rest.name}!`);
    } else {
      triggerToast("Invalid credentials!");
    }
  };

  const handleRestaurantSignup = (name: string, mobile: string, pass: string, restName: string, lat?: number, lng?: number) => {
    if (restaurants.find(r => r.ownerId === mobile)) {
      triggerToast("Owner already registered!");
      return;
    }
    
    const newRest: Restaurant = {
      id: Math.floor(Math.random() * 10000),
      name: restName,
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80", // Placeholder
      rating: "New",
      timeDist: "30-40 min • 2 km",
      cuisines: "Multi Cuisine",
      menu: [],
      isOpen: true,
      description: "New restaurant in town!",
      ownerId: mobile,
      password: pass,
      coupons: [],
      reviews: [],
      location: lat && lng ? { lat, lng } : undefined,
      deliveryRadius: 5
    };

    fetch('/api/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRest)
    })
    .then(res => res.json())
    .then(createdRest => {
      setRestaurants(prev => [...prev, createdRest]);
      setCurrentRestaurantOwner(mobile);
      setManagedRestaurantId(createdRest.id);
      triggerToast("Restaurant registered successfully!");
    })
    .catch(err => {
      console.error("Failed to register restaurant", err);
      // Fallback
      setRestaurants(prev => [...prev, newRest]);
      setCurrentRestaurantOwner(mobile);
      setManagedRestaurantId(newRest.id);
      triggerToast("Restaurant registered successfully!");
    });
  };

  const handleLogin = (mobile: string, pass: string) => {
    const user = users.find(u => u.mobile === mobile && u.password === pass);
    if (user) {
      setCurrentUser(user);
      setCheckoutName(user.name);
      setCheckoutMobile(user.mobile);
      setCurrentView('user');
      setUserSubView('home');
    } else {
      triggerToast("Invalid credentials!");
    }
  };

  const handleSignup = (name: string, mobile: string, pass: string) => {
    if (users.find(u => u.mobile === mobile)) {
      triggerToast("User already exists!");
      return;
    }
    const newUser: UserType = { 
      id: Math.floor(Math.random() * 10000),
      name, 
      mobile, 
      password: pass, 
      addresses: [], 
      walletBalance: 0 
    };
    
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    })
    .then(res => res.json())
    .then(savedUser => {
      setCurrentUser(savedUser);
      setCheckoutName(savedUser.name);
      setCheckoutMobile(savedUser.mobile);
      setCurrentView('user');
      setUserSubView('home');
      triggerToast("Registration successful!");
    })
    .catch(err => console.error("Signup failed", err));
  };

  const addToCart = (restId: number, item: any) => {
    if (cart.restaurantId !== null && cart.restaurantId !== restId) {
      if (!confirm("Clear existing cart to add items from this restaurant?")) return;
      setCart({ restaurantId: restId, items: [{ id: item.id, name: item.name, price: item.price, qty: 1 }] });
    } else {
      const existing = cart.items.find(i => i.id === item.id);
      let newItems;
      if (existing) {
        newItems = cart.items.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      } else {
        newItems = [...cart.items, { id: item.id, name: item.name, price: item.price, qty: 1 }];
      }
      setCart({ restaurantId: restId, items: newItems });
    }
    triggerToast("Item added to cart");
  };

  const removeFromCart = (itemId: string) => {
    const newItems = cart.items.filter(i => i.id !== itemId);
    if (newItems.length === 0) {
      setCart({ restaurantId: null, items: [] });
      setUserSubView('home');
      triggerToast("Cart is empty");
    } else {
      setCart({ ...cart, items: newItems });
      triggerToast("Item removed from cart");
    }
  };

  const applyCoupon = () => {
    const code = couponCodeInput.trim().toUpperCase();
    if (!code) {
      triggerToast("Please enter a coupon code!");
      return;
    }

    // Get Restaurant Coupons
    const currentRestaurant = restaurants.find(r => r.id === cart.restaurantId);
    const restaurantCoupons = currentRestaurant?.coupons || [];
    
    // Combine Global and Restaurant Coupons
    const allCoupons = [...coupons, ...restaurantCoupons];

    const coupon = allCoupons.find(c => c.code === code);
    if (!coupon) {
      triggerToast("Invalid Coupon Code!");
      return;
    }

    const subtotal = cart.items.reduce((sum, i) => sum + (i.price * i.qty), 0);
    if (subtotal < coupon.minOrder) {
      triggerToast(`Minimum order amount is ₹${coupon.minOrder} for this coupon.`);
      return;
    }

    setAppliedCoupon(coupon);
    triggerToast(`Coupon ${code} Applied Successfully!`);
    setCouponCodeInput('');
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    triggerToast("Coupon Removed!");
  };

  const placeOrder = () => {
    if (!checkoutName || !checkoutMobile || checkoutAddressIdx === "") {
      triggerToast("Please fill all details!");
      return;
    }

    if (!checkoutLocation) {
      triggerToast("Please provide your live location!");
      return;
    }

    
    const currentRestaurant = restaurants.find(r => r.id === cart.restaurantId);
    const distanceStr = currentRestaurant?.timeDist?.split('•')[1]?.trim() || "2 km";
    const distance = parseFloat(distanceStr) || 2;
    const deliveryFee = Math.round(platformSettings.deliveryBase + (distance * platformSettings.deliveryPerKm));

    const subtotal = cart.items.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const discount = appliedCoupon ? Math.min(Math.round((subtotal * appliedCoupon.discount) / 100), appliedCoupon.maxDiscount) : 0;
    const total = (subtotal + deliveryFee) - discount;
    
    const address = currentUser?.addresses[parseInt(checkoutAddressIdx)]?.text || "Unknown Address";
    
    if (paymentMethod === 'wallet') {
      if ((currentUser?.walletBalance || 0) < total) {
        triggerToast("Insufficient wallet balance!");
        return;
      }
      // Deduct balance
      const updatedUser = { ...currentUser!, walletBalance: (currentUser?.walletBalance || 0) - total };
      setCurrentUser(updatedUser);
      setUsers(users.map(u => u.mobile === updatedUser.mobile ? updatedUser : u));
      finalizeOrder(total, address, 'Zayka Wallet');
    } else if (paymentMethod === 'razorpay') {
      handlePayment(total, "Food Order Payment", (paymentId) => {
        finalizeOrder(total, address, 'Online (Razorpay)', paymentId);
      });
    } else {
      finalizeOrder(total, address, 'Cash on Delivery');
    }
  };

  const finalizeOrder = (total: number, address: string, method: string, paymentId?: string) => {
    const newOrder: Order = {
      id: 'ORD' + Math.floor(Math.random() * 9000 + 1000),
      restaurantId: cart.restaurantId,
      items: cart.items.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
      total,
      status: 'Pending',
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      customerName: checkoutName,
      customerMobile: checkoutMobile,
      deliveryAddress: address,
      paymentMethod: method,
      deliveryLocation: checkoutLocation || undefined,
      createdAt: Date.now()
    };

    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder)
    })
    .then(res => res.json())
    .then(savedOrder => {
      setOrders(prev => {
        if (prev.find(o => o.id === savedOrder.id)) return prev;
        return [savedOrder, ...prev];
      });
      setCart({ restaurantId: null, items: [] });
      setCheckoutLocation(null);
      setUserSubView('home');
      triggerToast(`Order Placed Successfully via ${method}!`);
      
      // Simulate Real-time Notification to Restaurant
      /* 
      setTimeout(() => {
        sendOrderNotification(savedOrder.id, savedOrder.total);
      }, 2000);
      */
    })
    .catch(err => {
      console.error("Order failed", err);
      // Fallback for frontend only
      setOrders(prev => {
        if (prev.find(o => o.id === newOrder.id)) return prev;
        return [newOrder, ...prev];
      });
      setCart({ restaurantId: null, items: [] });
      setCheckoutLocation(null);
      setUserSubView('home');
      triggerToast(`Order Placed Successfully via ${method}! (Offline Mode)`);
    });
  };

  const saveAddress = () => {
    if (!newAddressTitle || !newAddressText) {
      triggerToast("Please fill all fields");
      return;
    }
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        addresses: [...currentUser.addresses, {
          title: newAddressTitle,
          text: newAddressText,
          icon: newAddressTitle.toLowerCase().includes('home') ? 'home' : 'briefcase',
          color: 'text-orange-500'
        }]
      };
      setCurrentUser(updatedUser);
      setUsers(users.map(u => u.mobile === currentUser.mobile ? updatedUser : u));
      setShowAddressModal(false);
      setNewAddressTitle('');
      setNewAddressText('');
      triggerToast("Address saved!");
    }
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    .then(res => res.json())
    .then((updatedOrder) => {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updatedOrder } : o));
      triggerToast(`Order marked as ${status}`);
    })
    .catch(err => {
      console.error("Update failed", err);
      // Fallback for frontend only
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      triggerToast(`Order marked as ${status} (Offline Mode)`);
    });
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (amount: number, description: string, onSuccess: (paymentId: string) => void) => {
    if (!currentUser) return;
    
    const res = await loadRazorpay();
    if (!res) {
      triggerToast("Razorpay SDK failed to load. Are you online?");
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_TYbUv2o12n324", // Test Key
      amount: Math.round(amount * 100), // Amount in paise
      currency: "INR",
      name: "Zayka Food Delivery",
      description: description,
      image: "https://cdn-icons-png.flaticon.com/512/2956/2956869.png",
      handler: function (response: any) {
        onSuccess(response.razorpay_payment_id);
      },
      prefill: {
        name: currentUser.name,
        contact: currentUser.mobile
      },
      theme: {
        color: "#f97316"
      }
    };

    try {
      const rzp1 = new (window as any).Razorpay(options);
      rzp1.on('payment.failed', function (response: any) {
        triggerToast("Payment Failed: " + response.error.description);
      });
      rzp1.open();
    } catch (error) {
      console.error("Razorpay Error:", error);
      triggerToast("Razorpay Error. Please check your API Key.");
    }
  };

  const addMoneyToWallet = async (amount: number) => {
    if (currentUser) {
      const res = await loadRazorpay();
      if (!res) {
        triggerToast("Razorpay SDK failed to load. Are you online?");
        return;
      }

      // Razorpay Integration for Wallet
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_TYbUv2o12n324", // Test Key
        amount: Math.round(amount * 100), // Amount in paise
        currency: "INR",
        name: "Zayka Wallet Recharge",
        description: "Add Money to Wallet",
        image: "https://cdn-icons-png.flaticon.com/512/2956/2956869.png",
        handler: function (response: any) {
          const newTransaction: WalletTransaction = {
            id: `TXN${Date.now()}`,
            amount: amount,
            type: 'credit',
            date: new Date().toISOString().split('T')[0],
            desc: 'Added money to wallet'
          };
          const updatedUser = { 
            ...currentUser, 
            walletBalance: (currentUser.walletBalance || 0) + amount,
            transactions: [newTransaction, ...(currentUser.transactions || [])]
          };
          setCurrentUser(updatedUser);
          setUsers(users.map(u => u.mobile === currentUser.mobile ? updatedUser : u));
          triggerToast(`₹${amount} added to wallet successfully!`);
        },
        prefill: {
          name: currentUser.name,
          contact: currentUser.mobile
        },
        theme: {
          color: "#f97316"
        }
      };

      try {
        const rzp1 = new (window as any).Razorpay(options);
        rzp1.on('payment.failed', function (response: any) {
          triggerToast("Payment Failed: " + response.error.description);
        });
        rzp1.open();
      } catch (error) {
        console.error("Razorpay Error:", error);
        triggerToast("Razorpay Error. Please check your API Key.");
      }
    }
  };

  // --- ADMIN RESTAURANT MANAGEMENT ---
  const handleAddRestaurant = (e: React.FormEvent) => {
    e.preventDefault();
    const newRestaurant: Restaurant = {
      id: Date.now(),
      name: restaurantForm.name || "New Restaurant",
      image: restaurantForm.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
      rating: "4.0",
      timeDist: "30-40 min",
      cuisines: restaurantForm.cuisines || "Fast Food",
      menu: [],
      isOpen: restaurantForm.isOpen !== undefined ? restaurantForm.isOpen : true,
      description: restaurantForm.description || "",
      ownerId: restaurantForm.ownerId || "",
      password: restaurantForm.password || "123456",
      isApproved: restaurantForm.isApproved !== undefined ? restaurantForm.isApproved : true,
      commissionRate: restaurantForm.commissionRate || platformSettings.commission,
      address: restaurantForm.address || "",
      ownerName: restaurantForm.ownerName || "",
      ownerMobile: restaurantForm.ownerMobile || "",
      ownerEmail: restaurantForm.ownerEmail || "",
      reviews: [],
      payouts: [],
      location: signupLocation || undefined,
      deliveryRadius: restaurantForm.deliveryRadius || 5
    };
    
    fetch('/api/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRestaurant)
    })
    .then(res => res.json())
    .then(() => {
      setShowAddRestaurantModal(false);
      setRestaurantForm({});
      triggerToast("Restaurant added successfully!");
    })
    .catch(err => console.error("Add restaurant failed", err));
  };

  const handleUpdateRestaurant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestaurant) return;
    
    fetch(`/api/restaurants/${selectedRestaurant.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...restaurantForm, location: signupLocation || undefined })
    })
    .then(res => res.json())
    .then(() => {
      setShowEditRestaurantModal(false);
      setSelectedRestaurant(null);
      setRestaurantForm({});
      setSignupLocation(null);
      triggerToast("Restaurant updated successfully!");
    })
    .catch(err => console.error("Update restaurant failed", err));
  };

  const handleDeleteRestaurant = (id: number) => {
    if (window.confirm("Are you sure you want to delete this restaurant?")) {
      fetch(`/api/restaurants/${id}`, {
        method: 'DELETE'
      })
      .then(() => {
        triggerToast("Restaurant deleted successfully!");
      })
      .catch(err => console.error("Delete restaurant failed", err));
    }
  };

  const handleToggleRestaurantStatus = (id: number) => {
    const restaurant = restaurants.find(r => r.id === id);
    if (!restaurant) return;

    fetch(`/api/restaurants/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isOpen: !restaurant.isOpen })
    })
    .then(() => {
      triggerToast("Restaurant status updated!");
    })
    .catch(err => console.error("Toggle status failed", err));
  };

  const handleApproveRestaurant = (id: number, status: boolean) => {
    fetch(`/api/restaurants/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isApproved: status })
    })
    .then(() => {
      triggerToast(`Restaurant ${status ? 'Approved' : 'Rejected'}!`);
    })
    .catch(err => console.error("Approve restaurant failed", err));
  };

  const handleAddMenuItem = () => {
    if (!selectedRestaurant || !menuItemForm.name || !menuItemForm.price) {
      triggerToast("Please fill all required fields");
      return;
    }
    
    const newItem: MenuItem = {
      id: Date.now(),
      name: menuItemForm.name!,
      price: Number(menuItemForm.price),
      desc: menuItemForm.desc || '',
      image: menuItemForm.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      veg: menuItemForm.veg || false,
      isAvailable: true
    };

    const updatedMenu = [...selectedRestaurant.menu, newItem];

    fetch(`/api/restaurants/${selectedRestaurant.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menu: updatedMenu })
    })
    .then(res => res.json())
    .then(updatedRestaurant => {
      setSelectedRestaurant(updatedRestaurant);
      setRestaurants(prev => prev.map(r => r.id === selectedRestaurant.id ? updatedRestaurant : r));
      setShowAddMenuItemModal(false);
      setMenuItemForm({ veg: true });
      triggerToast("Menu Item Added Successfully!");
    })
    .catch(err => console.error("Add menu item failed", err));
  };

  const handleDeleteMenuItem = (restaurantId: number, itemId: number) => {
    if (window.confirm("Delete this menu item?")) {
      const restaurant = restaurants.find(r => r.id === restaurantId);
      if (!restaurant) return;

      const updatedMenu = restaurant.menu.filter(item => item.id !== itemId);

      fetch(`/api/restaurants/${restaurantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menu: updatedMenu })
      })
      .then(res => res.json())
      .then(updatedRestaurant => {
        if (selectedRestaurant && selectedRestaurant.id === restaurantId) {
          setSelectedRestaurant(updatedRestaurant);
        }
        setRestaurants(prev => prev.map(r => r.id === restaurantId ? updatedRestaurant : r));
        triggerToast("Menu item deleted!");
      })
      .catch(err => console.error("Delete menu item failed", err));
    }
  };

  // --- MENU MANAGEMENT ---
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const name = formData.get('name') as string;
    const price = Number(formData.get('price'));
    const desc = formData.get('desc') as string;
    const veg = formData.get('veg') === 'on';
    
    // Handle Image Upload
    const imageFile = formData.get('image') as File;
    let imageUrl = editingItem?.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80";

    if (imageFile && imageFile.size > 0) {
      imageUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(imageFile);
      });
    }
    
    if (!managedRestaurantId) return;

    const restaurant = restaurants.find(r => r.id === managedRestaurantId);
    if (!restaurant) return;

    let updatedMenu;
    if (editingItem) {
      // Edit existing
      updatedMenu = restaurant.menu.map(item => 
        item.id === editingItem.id ? { ...item, name, price, desc, veg, image: imageUrl } : item
      );
    } else {
      // Add new
      const newItem: MenuItem = {
        id: Math.floor(Math.random() * 10000),
        name,
        price,
        desc,
        veg,
        image: imageUrl,
        isAvailable: true
      };
      updatedMenu = [...restaurant.menu, newItem];
    }

    fetch(`/api/restaurants/${managedRestaurantId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menu: updatedMenu })
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to update restaurant');
      return res.json();
    })
    .then((updatedRestaurant) => {
      setRestaurants(prev => prev.map(r => r.id === managedRestaurantId ? updatedRestaurant : r));
      setShowItemModal(false);
      setEditingItem(null);
      triggerToast(editingItem ? "Item Updated Successfully!" : "New Item Added Successfully!");
    })
    .catch(err => {
      console.error("Save item failed", err);
      // Fallback
      setRestaurants(prev => prev.map(r => r.id === managedRestaurantId ? { ...r, menu: updatedMenu } : r));
      setShowItemModal(false);
      setEditingItem(null);
      triggerToast(editingItem ? "Item Updated Successfully!" : "New Item Added Successfully!");
    });
  };

  const toggleItemAvailability = (restId: number, itemId: number) => {
    const restaurant = restaurants.find(r => r.id === restId);
    if (!restaurant) return;

    const updatedMenu = restaurant.menu.map(item => 
      item.id === itemId ? { ...item, isAvailable: !item.isAvailable } : item
    );

    fetch(`/api/restaurants/${restId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menu: updatedMenu })
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to update availability');
      return res.json();
    })
    .then((updatedRestaurant) => {
      setRestaurants(prev => prev.map(r => r.id === restId ? updatedRestaurant : r));
      triggerToast("Item availability updated!");
    })
    .catch(err => {
      console.error("Toggle availability failed", err);
      // Fallback
      setRestaurants(prev => prev.map(r => r.id === restId ? { ...r, menu: updatedMenu } : r));
      triggerToast("Item availability updated!");
    });
  };

  // --- RENDERERS ---

  if (currentView === 'role') {
    return (
      <div className="min-h-screen bg-white p-6 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-black text-gray-800 mb-2">Login As</h1>
        <p className="text-gray-500 mb-8 text-center text-sm">Choose your panel to continue.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg">
          <RoleCard icon={<UserIcon className="text-orange-500" />} title="User App" subtitle="Customer view" color="bg-orange-50" onClick={() => currentUser ? setCurrentView('user') : setCurrentView('auth')} />
          <RoleCard icon={<Store className="text-blue-600" />} title="Restaurant" subtitle="Partner panel" color="bg-blue-50" onClick={() => setCurrentView('restaurant')} />
          <RoleCard icon={<Bike className="text-green-600" />} title="Delivery Rider" subtitle="Rider panel" color="bg-green-50" onClick={() => setCurrentView('delivery')} />
          <RoleCard icon={<PieChartIcon className="text-purple-600" />} title="Admin" subtitle="Management" color="bg-purple-50" onClick={() => setCurrentView('admin')} />
        </div>
      </div>
    );
  }

  // Maintenance Mode Check
  if (platformSettings.maintenanceMode && currentView !== 'admin') {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <Shield className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-3xl font-black text-gray-800 mb-2">Under Maintenance</h1>
        <p className="text-gray-500 max-w-md">
          We are currently upgrading our system to serve you better. 
          Please check back in a while.
        </p>
        <button onClick={() => setCurrentView('admin')} className="mt-8 text-sm text-gray-400 hover:text-gray-600 underline">
          Admin Login
        </button>
      </div>
    );
  }

  if (currentView === 'auth') {
    return (
      <div className="min-h-screen bg-white p-6 flex flex-col items-center justify-center relative">
        <button onClick={() => setCurrentView('role')} className="absolute top-6 left-6 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
          <ArrowLeft className="text-gray-800" />
        </button>
        
        <div className="w-full max-w-sm">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-6">
            {authMode === 'login' ? <UserIcon className="text-3xl text-orange-500" /> : <UserPlus className="text-3xl text-orange-500" />}
          </div>
          <h1 className="text-3xl font-black text-gray-800 mb-2">{authMode === 'login' ? 'Login' : 'Sign Up'}</h1>
          <p className="text-gray-500 mb-8 text-sm">{authMode === 'login' ? 'Apne account mein login karein.' : 'Naya account banayein aur order karein.'}</p>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            if (authMode === 'login') {
              handleLogin(formData.get('mobile') as string, formData.get('password') as string);
            } else {
              handleSignup(formData.get('name') as string, formData.get('mobile') as string, formData.get('password') as string);
            }
          }}>
            {authMode === 'signup' && (
              <input name="name" type="text" placeholder="Full Name" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 mb-4 focus:outline-none focus:border-orange-500 transition font-medium" required />
            )}
            <input name="mobile" type="tel" placeholder="10-digit Mobile Number" maxLength={10} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 mb-4 focus:outline-none focus:border-orange-500 transition font-medium" required />
            <input name="password" type="password" placeholder="Password" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 mb-6 focus:outline-none focus:border-orange-500 transition font-medium" required />
            
            <button type="submit" className="w-full bg-orange-500 text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition text-lg">
              {authMode === 'login' ? 'Login' : 'Register'}
            </button>
          </form>
          
          <p className="text-center mt-8 text-sm text-gray-600 font-medium">
            {authMode === 'login' ? 'Naye user hain?' : 'Pehle se account hai?'} 
            <span onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-orange-500 font-bold cursor-pointer ml-1 hover:underline">
              {authMode === 'login' ? 'Sign Up karein' : 'Login karein'}
            </span>
          </p>
        </div>
        <Toast message={toastMsg} isVisible={showToast} onClose={() => setShowToast(false)} />
      </div>
    );
  }

  if (currentView === 'user') {
    return (
      <div className="h-screen flex flex-col bg-white overflow-hidden">
        {/* Header */}
        <header className="bg-white pt-4 pb-2 px-4 flex items-center justify-between z-10 sticky top-0 shadow-sm">
          <div className="flex items-center gap-3">
            {userSubView !== 'home' && (
              <button onClick={() => setUserSubView('home')} className="text-gray-800"><ArrowLeft /></button>
            )}
            <div onClick={detectLocation} className="cursor-pointer">
              <h1 className="font-bold text-orange-500 text-lg leading-tight flex items-center gap-1">
                {userSubView === 'home' ? (
                  <><MapPin className={`w-4 h-4 ${isLocating ? 'animate-bounce' : ''}`} /> Home</>
                ) : userSubView === 'dining' ? (
                  'Dining'
                ) : (
                  'Back'
                )}
              </h1>
              {userSubView === 'home' && (
                <p className={`text-xs max-w-[200px] truncate ${locationError ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                  {locationError ? "Location Error (Tap to retry)" : (userAddress || (userLocation ? "Current Location" : "Tap to set location"))}
                </p>
              )}
            </div>
          </div>
          <button onClick={() => setUserSubView('profile')} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 border border-gray-200">
            <UserIcon className="w-5 h-5" />
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pb-20 hide-scrollbar bg-[#fcfcfc]">
          {userSubView === 'home' && (
            <div className="fade-in">
              {/* AI Suggestion */}
              <div className="px-4 mt-2">
                <div className="bg-gradient-to-br from-[#7445F8] to-[#994DFD] rounded-2xl p-4 text-white flex items-center gap-4 relative overflow-hidden shadow-sm">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md shrink-0">
                    <CloudRain className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-white/80 flex items-center gap-1 mb-0.5">
                      <Sparkles className="w-3 h-3" /> AI SUGGESTION
                    </p>
                    <h3 className="font-bold text-[15px] leading-tight text-white">Rainy weather in Etawah!<br/><span className="font-medium text-white/90">How about some hot Pizza?</span></h3>
                  </div>
                  <ChevronRight className="text-white/70" />
                </div>
              </div>

              {/* Search */}
              <div className="px-4 mt-5 flex gap-3">
                <div className="flex-1 flex items-center border border-gray-200/80 rounded-xl px-4 py-3 bg-white shadow-sm">
                  <Search className="text-gray-400 w-5 h-5" />
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search for restaurant or food..." 
                    className="w-full bg-transparent outline-none ml-3 text-[15px] text-gray-700 placeholder-gray-400" 
                  />
                </div>
                <button 
                  onClick={startListening}
                  className={`w-12 h-12 border border-gray-200/80 rounded-xl flex items-center justify-center shadow-sm shrink-0 transition ${isListening ? 'bg-red-100 border-red-200' : 'bg-white'}`}
                >
                  <Mic className={`w-5 h-5 ${isListening ? 'text-red-500 animate-pulse' : 'text-orange-500'}`} />
                </button>
              </div>

              {/* Filters */}
              <div className="px-4 mt-5 flex gap-2.5 overflow-x-auto hide-scrollbar pb-2">
                {['Pure Veg', 'Rating 4.5+', 'Fast Delivery', 'Offers'].map((f) => (
                  <button 
                    key={f} 
                    onClick={() => toggleFilter(f)}
                    className={`whitespace-nowrap border rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition-colors ${
                      activeFilters.includes(f) 
                        ? 'bg-orange-500 text-white border-orange-500' 
                        : 'bg-white text-gray-700 border-gray-200'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Banner */}
              <div className="px-4 mt-4">
                <div className="bg-gradient-to-r from-[#FF8833] to-[#FF4E4E] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
                  <h2 className="text-3xl font-bold mb-1 tracking-tight">50% OFF</h2>
                  <p className="text-[15px] font-medium opacity-95">up to ₹100 on your first order</p>
                  <div className="absolute -right-4 -top-8 w-24 h-24 bg-white opacity-10 rounded-full"></div>
                  <div className="absolute right-12 -bottom-6 w-16 h-16 bg-white opacity-10 rounded-full"></div>
                </div>
              </div>

              {/* Enable Location Prompt - REMOVED */}

              {/* Nearby Restaurants Section */}
              {userLocation && !searchTerm ? (
                nearbyRestaurants.length > 0 ? (
                  <div className="mt-8 px-4">
                    <h3 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-orange-600" /> Restaurants Near You
                    </h3>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                      {nearbyRestaurants.map(rest => (
                        <div 
                          key={rest.id} 
                          onClick={() => { setSelectedRestaurant(rest); setUserSubView('menu'); }}
                          className="min-w-[280px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition cursor-pointer"
                        >
                          <div className="h-32 relative">
                            <img src={rest.image} className="w-full h-full object-cover" />
                            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm">
                              <Star className="w-3 h-3 text-orange-500 fill-current" /> {rest.rating}
                            </div>
                            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-white flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {rest.timeDist.split('•')[0]}
                            </div>
                          </div>
                          <div className="p-4">
                            <h4 className="font-bold text-gray-800 text-lg mb-1">{rest.name}</h4>
                            <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {rest.distance.toFixed(1)} km</span>
                              <span>•</span>
                              <span>{rest.cuisines.split(',')[0]}</span>
                            </div>
                            {rest.coupons && rest.coupons.length > 0 && (
                              <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-2 py-1 rounded-lg text-xs font-bold w-fit">
                                <Percent className="w-3 h-3" /> {rest.coupons[0].desc}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-8 px-4 text-center text-gray-500 py-10">
                    <p>No restaurants found near your location.</p>
                  </div>
                )
              ) : (
                <div className="mt-8 px-4">
                  <div className="text-center py-8 bg-orange-50 rounded-2xl border border-dashed border-orange-200">
                    <MapPin className="w-10 h-10 text-orange-400 mx-auto mb-3" />
                    <p className="text-gray-700 font-bold mb-1">Location Access Required</p>
                    <p className="text-gray-500 text-sm mb-4">Enable location to see restaurants near you</p>
                    <button onClick={detectLocation} className="bg-orange-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-orange-600 transition">
                      Enable Location
                    </button>
                  </div>
                </div>
              )}

              {/* Restaurants */}
              <div className="mt-8 px-4 pb-4">
                <h2 className="mb-4 text-[19px] font-bold text-[#1a1a1a]">Restaurants to explore</h2>
                <div className="flex flex-col gap-4">
                  {restaurants
                    .filter(r => {
                      const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        r.menu.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
                      
                      if (!matchesSearch) return false;

                      if (activeFilters.includes('Pure Veg')) {
                        // Check if restaurant has ONLY veg items
                        if (!r.menu.every(item => item.veg)) return false;
                      }
                      if (activeFilters.includes('Rating 4.5+')) {
                        if (parseFloat(r.rating) < 4.5) return false;
                      }
                      if (activeFilters.includes('Fast Delivery')) {
                        // Assume format "25-30 min"
                        const time = parseInt(r.timeDist.split('-')[0]); 
                        if (isNaN(time) || time > 30) return false;
                      }
                      if (activeFilters.includes('Offers')) {
                        if (!r.coupons || r.coupons.length === 0) return false;
                      }

                      return true;
                    })
                    .map(rest => (
                    <div key={rest.id} onClick={() => { setSelectedRestaurant(rest); setUserSubView('menu'); }} className="bg-white rounded-[20px] p-3 shadow-sm border border-gray-100 flex gap-4 cursor-pointer hover:bg-gray-50 transition active:scale-[0.98]">
                      <img src={rest.image} alt={rest.name} className="w-[90px] h-[90px] rounded-xl object-cover shrink-0" />
                      <div className="flex-1 py-1 flex flex-col justify-center">
                        <h3 className="font-bold text-[17px] text-gray-800 leading-tight">{rest.name}</h3>
                        <div className="flex items-center gap-2 mt-1.5 text-[13px] text-gray-500 font-medium">
                          <span className="bg-[#24963F] text-white px-1.5 py-0.5 rounded text-[11px] font-bold flex items-center gap-1">
                            {rest.rating} <Star className="w-2 h-2 fill-current" />
                          </span>
                          <span>{rest.timeDist}</span>
                        </div>
                        <p className="text-[13px] text-gray-500 mt-1 truncate">{rest.cuisines}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {userSubView === 'dining' && (
            <div className="fade-in pb-20">
              <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white p-6 pb-8 rounded-b-[30px] shadow-md relative">
                <h2 className="text-2xl font-black mb-2">Dine-In Experiences</h2>
                <p className="text-white/90 text-sm font-medium">Book tables & pre-order your meals</p>
                <div className="absolute -bottom-6 left-6 right-6">
                  <div className="bg-white rounded-2xl shadow-lg p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition" onClick={() => triggerToast("Scanning QR Code...")}>
                    <div className="bg-orange-100 p-3 rounded-xl">
                      <QrCode className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">Scan Table QR</h3>
                      <p className="text-xs text-gray-500">Order directly from your table</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 mt-12">
                <h3 className="font-bold text-lg text-gray-800 mb-4">Top Dining Spots</h3>
                <div className="grid gap-4">
                  {restaurants.filter(r => r.isOpen).map(rest => (
                    <div key={rest.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                      <div className="relative h-32">
                        <img src={rest.image} alt={rest.name} className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm">
                          <Star className="w-3 h-3 text-orange-500 fill-current" /> {rest.rating}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-bold text-gray-800 text-lg">{rest.name}</h4>
                            <p className="text-xs text-gray-500">{rest.cuisines}</p>
                          </div>
                          <span className="bg-green-50 text-green-600 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">Dine-In</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 font-medium">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {parseFloat(rest.timeDist.split('•')[1] || "2").toFixed(1)} km</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Open Now</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setSelectedRestaurant(rest); setUserSubView('menu'); }} className="flex-1 bg-orange-50 text-orange-600 py-2 rounded-xl font-bold text-sm hover:bg-orange-100 transition">Pre-order Food</button>
                          <button onClick={() => triggerToast(`Table booked at ${rest.name}!`)} className="flex-1 bg-gray-900 text-white py-2 rounded-xl font-bold text-sm hover:bg-black transition">Book Table</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {userSubView === 'menu' && selectedRestaurant && (
            (() => {
              const liveRestaurant = restaurants.find(r => r.id === selectedRestaurant.id) || selectedRestaurant;
              return (
                <div className="bg-white min-h-full pb-24 fade-in">
                  <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                    <button onClick={() => setUserSubView('home')} className="text-gray-800"><ArrowLeft /></button>
                    <div>
                      <h2 className="text-lg font-bold text-gray-800">{liveRestaurant.name}</h2>
                      <p className="text-xs text-gray-500">{liveRestaurant.cuisines}</p>
                    </div>
                  </div>
                  <div className="px-4 py-6">
                    <h3 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2">Recommended <ChevronDown className="text-orange-500 w-4 h-4" /></h3>
                    <div className="flex flex-col gap-6">
                      {liveRestaurant.menu.filter(i => i.isAvailable !== false).map(item => (
                        <div key={item.id} className="flex justify-between py-4 border-b border-gray-100 last:border-0">
                          <div className="w-[60%] pr-3">
                            <div className={`w-3.5 h-3.5 border ${item.veg ? 'border-green-600' : 'border-red-600'} flex items-center justify-center rounded-[2px] mb-1.5`}>
                              <div className={`w-1.5 h-1.5 ${item.veg ? 'bg-green-600' : 'bg-red-600'} rounded-full`}></div>
                            </div>
                            <h4 className="font-bold text-[16px] text-gray-800 leading-snug">{item.name}</h4>
                            <p className="font-semibold text-gray-800 mt-1 text-[15px]">₹{item.price}</p>
                            <p className="text-[13px] text-gray-500 mt-2 leading-relaxed line-clamp-2">{item.desc}</p>
                          </div>
                          <div className="w-[40%] max-w-[130px] relative flex flex-col items-center">
                            <div className="w-full aspect-square rounded-2xl overflow-hidden shadow-sm">
                              <img src={item.image} className="w-full h-full object-cover" />
                            </div>
                            <button onClick={() => addToCart(liveRestaurant.id, item)} className="absolute -bottom-3 bg-white text-orange-500 font-black text-sm px-6 py-2 rounded-xl shadow-md border border-gray-100 hover:bg-gray-50 transition active:scale-95 uppercase tracking-wide">ADD</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()
          )}

          {userSubView === 'profile' && (
            <div className="bg-[#fcfcfc] min-h-full pb-24 fade-in">
              <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 px-4 py-4 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800">My Profile</h2>
              </div>
              
              {!profileSubView ? (
                <>
                  <div className="p-4 mt-2">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-orange-100 overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center text-orange-500 text-2xl font-bold uppercase">
                        {currentUser?.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-800 leading-tight">{currentUser?.name}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">+91 {currentUser?.mobile}</p>
                        <div className="flex items-center gap-1 mt-2 text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded w-fit">
                          <Wallet className="w-3 h-3 text-orange-500" /> ₹{currentUser?.walletBalance || 0}
                        </div>
                      </div>
                      <button onClick={() => setProfileSubView('info')} className="text-orange-500 font-bold text-sm bg-orange-50 px-3 py-1.5 rounded-lg">EDIT</button>
                    </div>
                  </div>
                  <div className="px-4 mt-2 mb-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      <ProfileMenuItem icon={<UserIcon />} color="text-blue-500" bg="bg-blue-50" label="Personal Info" onClick={() => setProfileSubView('info')} />
                      <ProfileMenuItem icon={<MapPin />} color="text-emerald-500" bg="bg-emerald-50" label="Address" onClick={() => setProfileSubView('address')} />
                      <ProfileMenuItem icon={<ShoppingBag />} color="text-purple-500" bg="bg-purple-50" label="Order History" onClick={() => setProfileSubView('orders')} />
                      <ProfileMenuItem icon={<Wallet />} color="text-cyan-500" bg="bg-cyan-50" label="Wallet & Payment" onClick={() => setProfileSubView('payment')} />
                      <ProfileMenuItem icon={<Ticket />} color="text-yellow-500" bg="bg-yellow-50" label="Coupons" onClick={() => setProfileSubView('coupons')} />
                      <ProfileMenuItem icon={<Bell />} color="text-pink-500" bg="bg-pink-50" label="Notifications" onClick={() => setProfileSubView('notifications')} />
                      <ProfileMenuItem icon={<Headphones />} color="text-indigo-500" bg="bg-indigo-50" label="Help & Support" onClick={() => setProfileSubView('support')} />
                      <ProfileMenuItem icon={<Settings />} color="text-gray-600" bg="bg-gray-100" label="Settings" onClick={() => setProfileSubView('settings')} />
                      <div onClick={() => { setCurrentUser(null); setCheckoutLocation(null); setCurrentView('role'); }} className="flex items-center gap-4 p-4 active:bg-red-50 transition cursor-pointer">
                        <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center text-red-500"><LogOut className="w-5 h-5" /></div>
                        <span className="flex-1 font-semibold text-[15px] text-red-500">Logout</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="fade-in">
                  <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 px-4 py-4 border-b border-gray-100 flex items-center gap-3">
                    <button onClick={() => setProfileSubView(null)} className="text-gray-800"><ArrowLeft /></button>
                    <h2 className="text-xl font-bold text-gray-800 capitalize">{profileSubView === 'payment' ? 'Wallet & Payment' : profileSubView}</h2>
                  </div>
                  <div className="p-4">
                    {profileSubView === 'address' && (
                      <div className="space-y-4">
                        {currentUser?.addresses.length === 0 ? (
                          <div className="text-center py-8 bg-white rounded-xl border border-gray-100">
                            <MapPin className="mx-auto text-gray-300 w-10 h-10 mb-3" />
                            <p className="text-gray-500 text-sm">No addresses saved.</p>
                          </div>
                        ) : (
                          currentUser?.addresses.map((addr, i) => (
                            <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-start gap-3">
                              <MapPin className="text-orange-500 mt-1 w-5 h-5" />
                              <div className="flex-1">
                                <h4 className="font-bold text-gray-800">{addr.title}</h4>
                                <p className="text-sm text-gray-500 mt-1">{addr.text}</p>
                              </div>
                              <button onClick={() => {
                                const newAddresses = [...currentUser.addresses];
                                newAddresses.splice(i, 1);
                                setCurrentUser({...currentUser, addresses: newAddresses});
                              }} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          ))
                        )}
                        <button onClick={() => setShowAddressModal(true)} className="w-full border-2 border-dashed border-orange-500 text-orange-500 font-bold py-3 rounded-xl mt-2 flex justify-center items-center gap-2 active:bg-orange-50 transition"><Plus className="w-4 h-4" /> Add New Address</button>
                      </div>
                    )}
                    {profileSubView === 'orders' && (
                      <div className="space-y-4">
                        {orders.filter(o => o.customerMobile === currentUser?.mobile).length === 0 ? (
                          <div className="text-center py-10 bg-white rounded-xl border border-gray-100">
                            <ShoppingBag className="mx-auto text-gray-300 w-10 h-10 mb-3" />
                            <p className="text-gray-500 text-sm">No orders yet.</p>
                          </div>
                        ) : (
                          orders.filter(o => o.customerMobile === currentUser?.mobile).map(order => (
                            <div key={order.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
                              <div className="flex justify-between items-start border-b border-gray-50 pb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center"><Store className="text-gray-400" /></div>
                                  <div>
                                    <h4 className="font-bold text-gray-800 text-sm">Order #{order.id}</h4>
                                    <p className="text-xs text-gray-400">{order.time}</p>
                                  </div>
                                </div>
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${order.status === 'Delivered' ? 'text-green-600 bg-green-50' : 'text-orange-500 bg-orange-50'}`}>{order.status}</span>
                              </div>
                              <div className="flex justify-between items-center pt-2">
                                <span className="font-bold text-gray-800 text-sm">Total: ₹{order.total}</span>
                                <div className="flex gap-2">
                                  {order.status === 'Delivered' && !order.riderRating && (
                                    <button onClick={() => { setRatingOrderId(order.id); setShowRatingModal(true); }} className="text-yellow-600 font-bold text-xs bg-yellow-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
                                      <Star className="w-3 h-3" /> Rate Rider
                                    </button>
                                  )}
                                  <button className="text-orange-500 font-bold text-xs border border-orange-500 px-3 py-1.5 rounded-lg">REORDER</button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Rating Modal */}
                    {showRatingModal && (
                      <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 fade-in">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
                          <h2 className="text-xl font-bold mb-2">Rate Your Rider</h2>
                          <p className="text-gray-500 text-sm mb-6">How was the delivery service?</p>
                          
                          <div className="flex justify-center gap-2 mb-8">
                            {[1, 2, 3, 4, 5].map(star => (
                              <button key={star} onClick={() => setRatingStars(star)} className="transition transform hover:scale-110">
                                <Star className={`w-8 h-8 ${star <= ratingStars ? 'text-yellow-400 fill-current' : 'text-gray-200'}`} />
                              </button>
                            ))}
                          </div>

                          <div className="flex gap-3">
                            <button onClick={() => { setShowRatingModal(false); setRatingStars(0); }} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold">Cancel</button>
                            <button onClick={handleRateRider} disabled={ratingStars === 0} className={`flex-1 py-3 rounded-xl font-bold text-white transition ${ratingStars > 0 ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-300 cursor-not-allowed'}`}>Submit</button>
                          </div>
                        </div>
                      </div>
                    )}
                    {profileSubView === 'payment' && (
                      <div className="space-y-6">
                        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-2xl text-white shadow-lg">
                          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Zayka Wallet Balance</p>
                          <h2 className="text-4xl font-black">₹{currentUser?.walletBalance || 0}</h2>
                          
                          <div className="mt-6">
                            <label className="text-xs text-gray-400 font-bold uppercase block mb-2">Add Money to Wallet</label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                                <input 
                                  type="number" 
                                  id="wallet-amount-input"
                                  placeholder="Enter Amount" 
                                  className="w-full bg-white/10 border border-white/20 rounded-lg pl-8 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition font-medium"
                                />
                              </div>
                              <button 
                                onClick={() => {
                                  const input = document.getElementById('wallet-amount-input') as HTMLInputElement;
                                  const amount = parseInt(input.value);
                                  if (!amount || amount <= 0) {
                                    triggerToast("Please enter a valid amount!");
                                    return;
                                  }
                                  addMoneyToWallet(amount);
                                  input.value = '';
                                }} 
                                className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition"
                              >
                                <Plus className="w-4 h-4" /> Add
                              </button>
                            </div>
                            <div className="flex gap-2 mt-3 overflow-x-auto hide-scrollbar">
                              {[100, 200, 500, 1000].map(amt => (
                                <button 
                                  key={amt}
                                  onClick={() => addMoneyToWallet(amt)}
                                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-3 py-1 text-xs font-medium text-gray-300 whitespace-nowrap transition"
                                >
                                  + ₹{amt}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Recent Transactions</h3>
                          {currentUser?.transactions && currentUser.transactions.length > 0 ? (
                            <div className="space-y-3">
                              {currentUser.transactions.map(txn => (
                                <div key={txn.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${txn.type === 'credit' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                                      {txn.type === 'credit' ? <Plus className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5 rotate-45" />}
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-gray-800 text-sm">{txn.desc}</h4>
                                      <p className="text-xs text-gray-500 mt-0.5">{txn.date}</p>
                                    </div>
                                  </div>
                                  <span className={`font-bold ${txn.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                                    {txn.type === 'credit' ? '+' : '-'} ₹{txn.amount}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-400 text-sm text-center py-4">No transactions yet.</p>
                          )}
                        </div>
                      </div>
                    )}
                    {profileSubView === 'support' && (
                      <div className="space-y-6">
                        <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                          <h3 className="text-lg font-bold text-indigo-800 mb-2">How can we help you?</h3>
                          <p className="text-sm text-indigo-600 mb-6">We are here to assist you with any issues.</p>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">Issue Type</label>
                              <select 
                                value={userSupportForm.issue}
                                onChange={(e) => setUserSupportForm({...userSupportForm, issue: e.target.value})}
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition font-medium"
                              >
                                <option value="">Select Issue</option>
                                <option value="Order Delay">Order Delay</option>
                                <option value="Payment Issue">Payment Issue</option>
                                <option value="App Bug">App Bug</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                              <textarea 
                                value={userSupportForm.description}
                                onChange={(e) => setUserSupportForm({...userSupportForm, description: e.target.value})}
                                placeholder="Describe your issue..."
                                rows={4}
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition resize-none font-medium"
                              ></textarea>
                            </div>
                            <button 
                              onClick={() => {
                                if(!userSupportForm.issue || !userSupportForm.description) {
                                  triggerToast("Please fill all fields");
                                  return;
                                }
                                const newTicket = { 
                                  id: `T-${Math.floor(Math.random() * 10000)}`, 
                                  user: currentUser?.name || 'User', 
                                  issue: `${userSupportForm.issue}: ${userSupportForm.description}`, 
                                  status: 'Open' as const, 
                                  date: new Date().toISOString().split('T')[0] 
                                };
                                setSupportTickets([...supportTickets, newTicket]);
                                setUserSupportForm({ issue: '', description: '' });
                                triggerToast("Ticket Submitted Successfully!");
                                setProfileSubView(null);
                              }}
                              className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-indigo-700 transition active:scale-95"
                            >
                              Submit Ticket
                            </button>
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                           <h4 className="font-bold text-gray-800 mb-3">Your Recent Tickets</h4>
                           {supportTickets.filter(t => t.user === currentUser?.name).length === 0 ? (
                             <p className="text-gray-400 text-sm text-center py-4">No tickets raised yet.</p>
                           ) : (
                             <div className="space-y-3">
                               {supportTickets.filter(t => t.user === currentUser?.name).map(ticket => (
                                 <div key={ticket.id} className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0">
                                   <div>
                                     <p className="font-bold text-gray-700 text-sm">{ticket.issue.substring(0, 25)}...</p>
                                     <p className="text-xs text-gray-400">{ticket.date}</p>
                                   </div>
                                   <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${ticket.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{ticket.status}</span>
                                 </div>
                               ))}
                             </div>
                           )}
                        </div>
                      </div>
                    )}
                    {profileSubView === 'info' && (
                      <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                          <div className="flex justify-center mb-6">
                            <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 text-4xl font-bold border-4 border-white shadow-lg">
                              {currentUser?.name.charAt(0)}
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                              <input 
                                type="text" 
                                defaultValue={currentUser?.name}
                                id="profile-name-input"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">Mobile Number</label>
                              <input 
                                type="tel" 
                                defaultValue={currentUser?.mobile}
                                readOnly
                                className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-gray-500 font-medium cursor-not-allowed"
                              />
                              <p className="text-xs text-gray-400 mt-1">Mobile number cannot be changed.</p>
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                              <input 
                                type="email" 
                                placeholder="Enter your email"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition font-medium"
                              />
                            </div>
                            <button 
                              onClick={() => {
                                const nameInput = document.getElementById('profile-name-input') as HTMLInputElement;
                                if (currentUser && nameInput.value) {
                                  const updated = { ...currentUser, name: nameInput.value };
                                  setCurrentUser(updated);
                                  setUsers(users.map(u => u.id === currentUser.id ? updated : u));
                                  triggerToast("Profile Updated Successfully!");
                                }
                              }}
                              className="w-full bg-orange-500 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-orange-600 transition active:scale-95 mt-4"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {profileSubView === 'coupons' && (
                      <div className="space-y-4">
                        {coupons.length === 0 ? (
                          <div className="text-center py-10 bg-white rounded-xl border border-gray-100">
                            <Ticket className="mx-auto text-gray-300 w-10 h-10 mb-3" />
                            <p className="text-gray-500 text-sm">No coupons available.</p>
                          </div>
                        ) : (
                          coupons.map(coupon => (
                            <div key={coupon.code} className="bg-white p-4 rounded-xl border border-dashed border-orange-200 shadow-sm relative overflow-hidden group">
                              <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                              <div className="flex justify-between items-center">
                                <div>
                                  <h4 className="font-bold text-gray-800 text-lg">{coupon.code}</h4>
                                  <p className="text-sm text-gray-600 font-medium">{coupon.desc}</p>
                                  <p className="text-xs text-orange-500 mt-1 font-bold">{coupon.discount}% OFF up to ₹{coupon.maxDiscount}</p>
                                </div>
                                <button 
                                  onClick={() => {
                                    navigator.clipboard.writeText(coupon.code);
                                    triggerToast("Coupon Code Copied!");
                                  }}
                                  className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-orange-100 hover:bg-orange-100 transition"
                                >
                                  COPY
                                </button>
                              </div>
                              <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-50">
                                <Info className="w-3 h-3 text-gray-400" />
                                <p className="text-[10px] text-gray-400">Min Order: ₹{coupon.minOrder} • Valid until stocks last</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {profileSubView === 'notifications' && (
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><Bell className="w-5 h-5" /></div>
                              <div>
                                <h4 className="font-bold text-gray-800">Push Notifications</h4>
                                <p className="text-xs text-gray-500">Receive updates about your orders</p>
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={notificationPermissionStatus === 'granted'} 
                                onChange={requestNotificationPermission}
                                className="sr-only peer" 
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                          <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500"><Percent className="w-5 h-5" /></div>
                              <div>
                                <h4 className="font-bold text-gray-800">Promotional Offers</h4>
                                <p className="text-xs text-gray-500">Get notified about new deals</p>
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" defaultChecked className="sr-only peer" />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    {profileSubView === 'settings' && (
                      <div className="space-y-4">
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                          <button onClick={() => setShowLanguageModal(true)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-50">
                            <div className="flex items-center gap-3">
                              <Globe className="w-5 h-5 text-gray-500" />
                              <span className="font-medium text-gray-700">Language</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                              <span className="text-sm">{appLanguage}</span>
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </button>
                          <button onClick={() => setShowChangePasswordModal(true)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-50">
                            <div className="flex items-center gap-3">
                              <Lock className="w-5 h-5 text-gray-500" />
                              <span className="font-medium text-gray-700">Change Password</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </button>
                          <button onClick={() => setShowTermsModal(true)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-50">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-gray-500" />
                              <span className="font-medium text-gray-700">Terms & Conditions</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </button>
                          <button onClick={() => setShowAboutModal(true)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition">
                            <div className="flex items-center gap-3">
                              <Info className="w-5 h-5 text-gray-500" />
                              <span className="font-medium text-gray-700">About Us</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>

                        <button 
                          onClick={() => { setCurrentUser(null); setCheckoutLocation(null); setCurrentView('role'); }} 
                          className="w-full bg-red-50 text-red-500 font-bold py-3.5 rounded-xl shadow-sm hover:bg-red-100 transition active:scale-95 flex items-center justify-center gap-2"
                        >
                          <LogOut className="w-5 h-5" /> Logout
                        </button>

                        <p className="text-center text-xs text-gray-400 mt-4">App Version 1.0.0</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {userSubView === 'checkout' && (
             <div className="bg-white min-h-full pb-24 fade-in p-4">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Checkout</h2>
                  <button onClick={() => setUserSubView('home')} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="space-y-5">
                  {/* Order Items */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Your Items</h3>
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-4">
                      {cart.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="font-bold text-sm text-gray-800">{item.name}</div>
                            <div className="text-xs text-gray-500">₹{item.price}</div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
                              <button 
                                onClick={() => {
                                  if (item.qty > 1) {
                                    setCart({
                                      ...cart,
                                      items: cart.items.map(i => i.id === item.id ? { ...i, qty: i.qty - 1 } : i)
                                    });
                                  } else {
                                    removeFromCart(item.id);
                                  }
                                }}
                                className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded"
                              >
                                -
                              </button>
                              <span className="text-sm font-bold w-4 text-center">{item.qty}</span>
                              <button 
                                onClick={() => {
                                  setCart({
                                    ...cart,
                                    items: cart.items.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
                                  });
                                }}
                                className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded"
                              >
                                +
                              </button>
                            </div>
                            <div className="font-bold text-sm w-12 text-right">₹{item.price * item.qty}</div>
                            <button 
                              onClick={() => removeFromCart(item.id)}
                              className="w-7 h-7 bg-red-50 text-red-500 rounded-full flex items-center justify-center hover:bg-red-100 transition shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="border-t border-gray-200 pt-3 flex justify-between items-center font-bold">
                        <span className="text-sm text-gray-600">Item Total</span>
                        <span>₹{cart.items.reduce((sum, i) => sum + (i.price * i.qty), 0)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Delivery Details</h3>
                    <input type="text" value={checkoutName} onChange={e => setCheckoutName(e.target.value)} placeholder="Full Name" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-3 focus:outline-none focus:border-orange-500 transition font-medium" />
                    <input type="tel" value={checkoutMobile} onChange={e => setCheckoutMobile(e.target.value)} placeholder="Mobile Number" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-3 focus:outline-none focus:border-orange-500 transition font-medium" />

                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-bold text-gray-500 uppercase">Select Address</h3>
                      <button onClick={() => setShowAddressModal(true)} className="text-orange-500 text-xs font-bold bg-orange-50 px-2 py-1 rounded hover:bg-orange-100 transition">ADD NEW</button>
                    </div>
                    <select value={checkoutAddressIdx} onChange={e => setCheckoutAddressIdx(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition font-medium text-sm">
                      <option value="">Select Address</option>
                      {currentUser?.addresses.map((addr, i) => (
                        <option key={i} value={i}>{addr.title}: {addr.text.substring(0, 30)}...</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Live Location (Required)</h3>
                    {checkoutLocation ? (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <span className="text-green-700 font-bold text-sm">Location Captured</span>
                        </div>
                        <button onClick={() => setCheckoutLocation(null)} className="text-red-500 font-bold text-xs uppercase">Remove</button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => {
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                              (position) => {
                                setCheckoutLocation({
                                  lat: position.coords.latitude,
                                  lng: position.coords.longitude
                                });
                                triggerToast("Live location captured!");
                              },
                              (error) => {
                                triggerToast("Failed to get location. Please enable permissions.");
                              }
                            );
                          } else {
                            triggerToast("Geolocation is not supported by this browser.");
                          }
                        }}
                        className="w-full bg-blue-50 text-blue-600 border border-blue-200 rounded-xl px-4 py-3 font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-100 transition"
                      >
                        <MapPin className="w-4 h-4" />
                        Capture Live Location
                      </button>
                    )}
                  </div>

                  {/* Coupon Section */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Offers & Coupons</h3>
                    {appliedCoupon ? (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex justify-between items-center mb-4">
                        <div>
                          <p className="text-green-700 font-bold text-sm">'{appliedCoupon.code}' Applied</p>
                          <p className="text-green-600 text-xs">You saved ₹{Math.min(Math.round((cart.items.reduce((sum, i) => sum + (i.price * i.qty), 0) * appliedCoupon.discount) / 100), appliedCoupon.maxDiscount)}</p>
                        </div>
                        <button onClick={removeCoupon} className="text-red-500 font-bold text-xs uppercase">Remove</button>
                      </div>
                    ) : (
                      <div className="mb-4">
                        <div className="flex gap-2 mb-3">
                          <input 
                            type="text" 
                            value={couponCodeInput} 
                            onChange={(e) => setCouponCodeInput(e.target.value)} 
                            placeholder="Enter Coupon Code" 
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition font-medium text-sm uppercase" 
                          />
                          <button onClick={applyCoupon} className="bg-gray-900 text-white px-6 rounded-xl font-bold text-sm">APPLY</button>
                        </div>
                        
                        {/* Available Coupons List */}
                        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                          {(() => {
                            const currentRestaurant = restaurants.find(r => r.id === cart.restaurantId);
                            const restaurantCoupons = currentRestaurant?.coupons || [];
                            const allCoupons = [...coupons, ...restaurantCoupons];
                            
                            return allCoupons.map(c => (
                              <div key={c.code} onClick={() => setCouponCodeInput(c.code)} className="border border-dashed border-gray-300 rounded-lg p-2 min-w-[150px] cursor-pointer hover:bg-gray-50 shrink-0 relative overflow-hidden group">
                                <div className={`absolute top-0 left-0 w-1 h-full ${restaurantCoupons.includes(c) ? 'bg-pink-500' : 'bg-orange-500'}`}></div>
                                <p className="font-bold text-gray-800 text-xs pl-2">{c.code}</p>
                                <p className="text-[10px] text-gray-500 leading-tight mt-1 pl-2">{c.desc}</p>
                                {restaurantCoupons.includes(c) && <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full"></span>}
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Payment Method</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div onClick={() => setPaymentMethod('razorpay')} className={`border rounded-xl p-3 flex flex-col items-center gap-2 cursor-pointer transition ${paymentMethod === 'razorpay' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>
                        <CreditCard className="text-blue-600 w-6 h-6" />
                        <span className="text-xs font-bold">Pay Online</span>
                      </div>
                      <div onClick={() => setPaymentMethod('cod')} className={`border rounded-xl p-3 flex flex-col items-center gap-2 cursor-pointer transition ${paymentMethod === 'cod' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>
                        <div className="text-green-600 font-bold text-lg">₹</div>
                        <span className="text-xs font-bold">Cash on Delivery</span>
                      </div>
                      <div onClick={() => setPaymentMethod('wallet')} className={`col-span-2 border rounded-xl p-3 flex items-center gap-3 cursor-pointer transition ${paymentMethod === 'wallet' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>
                        <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white"><Wallet className="w-5 h-5" /></div>
                        <div className="flex-1">
                          <span className="text-sm font-bold block">Zayka Wallet</span>
                          <span className="text-xs text-gray-500">Balance: ₹{currentUser?.walletBalance || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 mt-6">
                  {(() => {
                     const currentRestaurant = restaurants.find(r => r.id === cart.restaurantId);
                     const distanceStr = currentRestaurant?.timeDist?.split('•')[1]?.trim() || "2 km";
                     const distance = parseFloat(distanceStr) || 2;
                     const deliveryFee = Math.round(platformSettings.deliveryBase + (distance * platformSettings.deliveryPerKm));
                     const subtotal = cart.items.reduce((sum, i) => sum + (i.price * i.qty), 0);
                     const discount = appliedCoupon ? Math.min(Math.round((subtotal * appliedCoupon.discount) / 100), appliedCoupon.maxDiscount) : 0;
                     const total = (subtotal + deliveryFee) - discount;

                     return (
                       <>
                        <div className="flex justify-between text-sm mb-2 text-gray-500">
                          <span>Subtotal</span>
                          <span>₹{subtotal}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-2 text-gray-500">
                          <span>Delivery & Taxes ({distance} km)</span>
                          <span>₹{deliveryFee}</span>
                        </div>
                        {appliedCoupon && (
                          <div className="flex justify-between text-sm mb-4 text-green-600 font-bold">
                            <span>Coupon Discount</span>
                            <span>- ₹{discount}</span>
                          </div>
                        )}
                        <button onClick={placeOrder} className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold text-lg shadow-md hover:bg-black transition active:scale-95 flex justify-between px-6">
                          <span>Pay Now</span>
                          <span>₹{total}</span>
                        </button>
                       </>
                     );
                  })()}
                </div>
             </div>
          )}
        </main>

        {/* Bottom Nav */}
        <nav className="bg-white border-t border-gray-100 fixed bottom-0 w-full z-50 px-6 py-2 flex justify-between items-center pb-safe text-[10px] font-medium">
          <NavButton icon={<Home />} label="Home" active={userSubView === 'home'} onClick={() => setUserSubView('home')} />
          <NavButton icon={<Utensils />} label="Dining" active={userSubView === 'dining'} onClick={() => setUserSubView('dining')} />
          <div className="relative" onClick={() => { if(cart.items.length > 0) setUserSubView('checkout'); else triggerToast("Cart is empty"); }}>
            <NavButton icon={<ShoppingBag />} label="Cart" active={userSubView === 'checkout'} />
            {cart.items.length > 0 && <span className="absolute top-0 right-2 bg-orange-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">{cart.items.reduce((s,i) => s + i.qty, 0)}</span>}
          </div>
          <NavButton icon={<UserIcon />} label="Profile" active={userSubView === 'profile'} onClick={() => setUserSubView('profile')} />
        </nav>

        {/* Language Modal */}
        {showLanguageModal && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 fade-in" onClick={() => setShowLanguageModal(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Select Language</h3>
                <button onClick={() => setShowLanguageModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <div className="space-y-2">
                {['English', 'Hindi', 'Spanish', 'French'].map(lang => (
                  <button 
                    key={lang}
                    onClick={() => { setAppLanguage(lang); setShowLanguageModal(false); triggerToast(`Language changed to ${lang}`); }}
                    className={`w-full text-left p-3 rounded-xl font-medium flex justify-between items-center ${appLanguage === lang ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
                  >
                    {lang}
                    {appLanguage === lang && <CheckCheck className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {showChangePasswordModal && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 fade-in" onClick={() => { setShowChangePasswordModal(false); setChangePasswordForm({ current: '', new: '', confirm: '' }); }}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Change Password</h3>
                <button onClick={() => { setShowChangePasswordModal(false); setChangePasswordForm({ current: '', new: '', confirm: '' }); }}><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <div className="space-y-3">
                <input 
                  type="password" 
                  value={changePasswordForm.current}
                  placeholder="Current Password"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition"
                  onChange={e => setChangePasswordForm({...changePasswordForm, current: e.target.value})}
                />
                <input 
                  type="password" 
                  value={changePasswordForm.new}
                  placeholder="New Password"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition"
                  onChange={e => setChangePasswordForm({...changePasswordForm, new: e.target.value})}
                />
                <input 
                  type="password" 
                  value={changePasswordForm.confirm}
                  placeholder="Confirm New Password"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition"
                  onChange={e => setChangePasswordForm({...changePasswordForm, confirm: e.target.value})}
                />
                <button 
                  onClick={() => {
                    if (!changePasswordForm.current || !changePasswordForm.new || !changePasswordForm.confirm) {
                      triggerToast("Please fill all fields");
                      return;
                    }
                    if (changePasswordForm.new !== changePasswordForm.confirm) {
                      triggerToast("Passwords do not match");
                      return;
                    }
                    // Mock API call
                    triggerToast("Password Changed Successfully!");
                    setShowChangePasswordModal(false);
                    setChangePasswordForm({ current: '', new: '', confirm: '' });
                  }}
                  className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-orange-600 transition mt-2"
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Terms Modal */}
        {showTermsModal && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 fade-in" onClick={() => setShowTermsModal(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-2 border-b border-gray-100">
                <h3 className="text-lg font-bold">Terms & Conditions</h3>
                <button onClick={() => setShowTermsModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <div className="prose prose-sm text-gray-600">
                <p><strong>1. Introduction</strong><br/>Welcome to Zayka. By using our app, you agree to these terms.</p>
                <p><strong>2. Orders</strong><br/>All orders are subject to availability. Prices may change without notice.</p>
                <p><strong>3. Delivery</strong><br/>Delivery times are estimates and not guaranteed.</p>
                <p><strong>4. Refunds</strong><br/>Refunds are processed according to our cancellation policy.</p>
                <p><strong>5. Privacy</strong><br/>We respect your privacy and protect your data.</p>
                <p className="mt-4 text-xs text-gray-400">Last updated: Oct 2023</p>
              </div>
            </div>
          </div>
        )}

        {/* About Modal */}
        {showAboutModal && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 fade-in" onClick={() => setShowAboutModal(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center" onClick={e => e.stopPropagation()}>
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mx-auto mb-4">
                <Utensils className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-gray-800 mb-1">Zayka</h2>
              <p className="text-gray-500 text-sm mb-6">Delivering Happiness</p>
              <p className="text-gray-600 text-sm mb-6">
                Zayka is your go-to app for delicious food delivery. We partner with the best restaurants to bring you a wide variety of cuisines right to your doorstep.
              </p>
              <div className="flex justify-center gap-4 mb-6">
                <a href="#" className="text-gray-400 hover:text-orange-500"><Globe className="w-5 h-5" /></a>
                <a href="#" className="text-gray-400 hover:text-orange-500"><MessageSquare className="w-5 h-5" /></a>
                <a href="#" className="text-gray-400 hover:text-orange-500"><Shield className="w-5 h-5" /></a>
              </div>
              <button onClick={() => setShowAboutModal(false)} className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-xl">Close</button>
            </div>
          </div>
        )}

        {/* Add Address Modal */}
        {showAddressModal && (
          <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 fade-in">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <h2 className="text-xl font-bold mb-4">Add New Address</h2>
              <input type="text" value={newAddressTitle} onChange={e => setNewAddressTitle(e.target.value)} placeholder="Save as (Home, Work)" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-3 focus:outline-none focus:border-orange-500 transition font-medium" />
              <textarea value={newAddressText} onChange={e => setNewAddressText(e.target.value)} placeholder="Complete Address" rows={3} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:border-orange-500 transition font-medium"></textarea>
              <div className="flex gap-3">
                <button onClick={() => setShowAddressModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold">Cancel</button>
                <button onClick={saveAddress} className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-bold">Save</button>
              </div>
            </div>
          </div>
        )}
        
        <Toast message={toastMsg} isVisible={showToast} onClose={() => setShowToast(false)} />
      </div>
    );
  }

  if (currentView === 'restaurant') {
    if (!currentRestaurantOwner) {
      return (
        <div className="min-h-screen bg-white p-6 flex flex-col items-center justify-center relative">
          <button onClick={() => setCurrentView('role')} className="absolute top-6 left-6 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <ArrowLeft className="text-gray-800" />
          </button>
          
          <div className="w-full max-w-sm">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
              <Store className="text-3xl text-blue-600" />
            </div>
            <h1 className="text-3xl font-black text-gray-800 mb-2">Partner {restaurantAuthMode === 'login' ? 'Login' : 'Sign Up'}</h1>
            <p className="text-gray-500 mb-8 text-sm">{restaurantAuthMode === 'login' ? 'Manage your restaurant business.' : 'Register your restaurant with us.'}</p>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              if (restaurantAuthMode === 'login') {
                handleRestaurantLogin(formData.get('mobile') as string, formData.get('password') as string);
              } else {
                if (!signupLocation) {
                  triggerToast("Please set your restaurant location!");
                  return;
                }
                handleRestaurantSignup(
                  formData.get('name') as string, 
                  formData.get('mobile') as string, 
                  formData.get('password') as string,
                  formData.get('restName') as string,
                  signupLocation.lat,
                  signupLocation.lng
                );
              }
            }}>
              {restaurantAuthMode === 'signup' && (
                <>
                  <input name="name" type="text" placeholder="Owner Name" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 mb-4 focus:outline-none focus:border-blue-500 transition font-medium" required />
                  <input name="restName" type="text" placeholder="Restaurant Name" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 mb-4 focus:outline-none focus:border-blue-500 transition font-medium" required />
                  
                  {/* Location Picker */}
                  <div className="mb-4">
                    <button 
                      type="button"
                      onClick={() => {
                        setIsLocatingSignup(true);
                        if ("geolocation" in navigator) {
                          navigator.geolocation.getCurrentPosition(
                            (position) => {
                              setSignupLocation({
                                lat: position.coords.latitude,
                                lng: position.coords.longitude
                              });
                              setIsLocatingSignup(false);
                              triggerToast("Location Set Successfully! 📍");
                            },
                            (error) => {
                              setIsLocatingSignup(false);
                              triggerToast("Unable to get location.");
                            }
                          );
                        } else {
                          setIsLocatingSignup(false);
                          triggerToast("Geolocation not supported.");
                        }
                      }}
                      className={`w-full border-2 border-dashed rounded-xl py-3 flex items-center justify-center gap-2 font-bold transition ${signupLocation ? 'border-green-500 text-green-600 bg-green-50' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                    >
                      {isLocatingSignup ? (
                        <span className="animate-pulse">Locating...</span>
                      ) : signupLocation ? (
                        <><CheckCheck className="w-5 h-5" /> Location Set</>
                      ) : (
                        <><MapPin className="w-5 h-5" /> Set Shop Location</>
                      )}
                    </button>
                    {signupLocation && <p className="text-xs text-green-600 mt-1 text-center font-medium">Coordinates: {signupLocation.lat.toFixed(4)}, {signupLocation.lng.toFixed(4)}</p>}
                  </div>
                </>
              )}
              <input name="mobile" type="tel" placeholder="10-digit Mobile Number" maxLength={10} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 mb-4 focus:outline-none focus:border-blue-500 transition font-medium" required />
              <input name="password" type="password" placeholder="Password" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 mb-6 focus:outline-none focus:border-blue-500 transition font-medium" required />
              
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition text-lg">
                {restaurantAuthMode === 'login' ? 'Login' : 'Register'}
              </button>
            </form>
            
            <p className="text-center mt-8 text-sm text-gray-600 font-medium">
              {restaurantAuthMode === 'login' ? 'New Partner?' : 'Already Registered?'} 
              <span onClick={() => setRestaurantAuthMode(restaurantAuthMode === 'login' ? 'signup' : 'login')} className="text-blue-600 font-bold cursor-pointer ml-1 hover:underline">
                {restaurantAuthMode === 'login' ? 'Register Here' : 'Login Here'}
              </span>
            </p>
          </div>
          <Toast message={toastMsg} isVisible={showToast} onClose={() => setShowToast(false)} />
        </div>
      );
    }

    return (
      <div className="p-4 max-w-4xl mx-auto min-h-screen bg-white">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setCurrentView('role')} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition">
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h2 className="text-xl font-bold text-gray-800">Partner Dashboard</h2>
          </div>
          <button onClick={() => { setCurrentRestaurantOwner(null); setManagedRestaurantId(null); setCurrentView('role'); }} className="text-sm text-red-500 font-bold bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition">Logout</button>
        </div>

        {/* Restaurant Selection (Simulated) */}
        {!managedRestaurantId ? (
          <div className="space-y-4">
            <p className="text-gray-600 mb-2">Select Restaurant to Manage:</p>
            {restaurants.filter(r => r.ownerId === currentRestaurantOwner).map(rest => (
              <div key={rest.id} onClick={() => setManagedRestaurantId(rest.id)} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:border-orange-500 flex items-center gap-4">
                <img src={rest.image} className="w-12 h-12 rounded-lg object-cover" />
                <h3 className="font-bold text-lg">{rest.name}</h3>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setManagedRestaurantId(null)} className="text-gray-500"><ArrowLeft className="w-5 h-5" /></button>
              <h3 className="font-bold text-lg">{restaurants.find(r => r.id === managedRestaurantId)?.name}</h3>
            </div>

            <div className="flex gap-2 mb-6 border-b border-gray-200 pb-2 overflow-x-auto hide-scrollbar">
              <button onClick={() => setRestaurantTab('orders')} className={`px-4 py-1.5 font-semibold text-sm rounded-full whitespace-nowrap ${restaurantTab === 'orders' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-white text-gray-600 border border-gray-200'}`}>Orders</button>
              <button onClick={() => setRestaurantTab('menu')} className={`px-4 py-1.5 font-semibold text-sm rounded-full whitespace-nowrap ${restaurantTab === 'menu' ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'bg-white text-gray-600 border border-gray-200'}`}>Menu</button>
              <button onClick={() => setRestaurantTab('marketing')} className={`px-4 py-1.5 font-semibold text-sm rounded-full whitespace-nowrap ${restaurantTab === 'marketing' ? 'bg-pink-50 text-pink-600 border border-pink-200' : 'bg-white text-gray-600 border border-gray-200'}`}>Marketing</button>
              <button onClick={() => setRestaurantTab('reviews')} className={`px-4 py-1.5 font-semibold text-sm rounded-full whitespace-nowrap ${restaurantTab === 'reviews' ? 'bg-yellow-50 text-yellow-600 border border-yellow-200' : 'bg-white text-gray-600 border border-gray-200'}`}>Reviews</button>
              <button onClick={() => setRestaurantTab('analytics')} className={`px-4 py-1.5 font-semibold text-sm rounded-full whitespace-nowrap ${restaurantTab === 'analytics' ? 'bg-purple-50 text-purple-600 border border-purple-200' : 'bg-white text-gray-600 border border-gray-200'}`}>Analytics</button>
              <button onClick={() => setRestaurantTab('payouts')} className={`px-4 py-1.5 font-semibold text-sm rounded-full whitespace-nowrap ${restaurantTab === 'payouts' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'bg-white text-gray-600 border border-gray-200'}`}>Payouts</button>
              <button onClick={() => setRestaurantTab('history')} className={`px-4 py-1.5 font-semibold text-sm rounded-full whitespace-nowrap ${restaurantTab === 'history' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-white text-gray-600 border border-gray-200'}`}>History</button>
              <button onClick={() => setRestaurantTab('settings')} className={`px-4 py-1.5 font-semibold text-sm rounded-full whitespace-nowrap ${restaurantTab === 'settings' ? 'bg-gray-100 text-gray-700 border border-gray-300' : 'bg-white text-gray-600 border border-gray-200'}`}>Settings</button>
            </div>

            {restaurantTab === 'orders' && (
              <div className="space-y-4">
                {orders.filter(o => (o.status === 'Pending' || o.status === 'Preparing') && o.restaurantId === managedRestaurantId).length === 0 ? (
                  <p className="text-gray-500 text-center mt-10">No active orders.</p>
                ) : (
                  orders.filter(o => (o.status === 'Pending' || o.status === 'Preparing') && o.restaurantId === managedRestaurantId).map(o => (
                    <div key={o.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex justify-between font-bold mb-2"><span>#{o.id}</span> <span>₹{o.total}</span></div>
                      <p className="text-sm text-gray-600 mb-3">{o.items.map(i => `${i.qty}x ${i.name}`).join(', ')}</p>
                      {o.status === 'Pending' ? (
                        <button onClick={() => updateOrderStatus(o.id, 'Preparing')} className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold">Accept Order</button>
                      ) : (
                        <button onClick={() => updateOrderStatus(o.id, 'Ready')} className="w-full bg-green-600 text-white py-2 rounded-lg font-bold">Mark Ready</button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {restaurantTab === 'menu' && (
              <div className="space-y-4">
                <button onClick={() => { setEditingItem(null); setShowItemModal(true); }} className="w-full border-2 border-dashed border-orange-500 text-orange-500 font-bold py-3 rounded-xl flex justify-center items-center gap-2 active:bg-orange-50 transition"><Plus className="w-4 h-4" /> Add New Item</button>
                
                {restaurants.find(r => r.id === managedRestaurantId)?.menu.map(item => (
                  <div key={item.id} className={`bg-white p-4 rounded-xl border shadow-sm flex justify-between items-center ${item.isAvailable === false ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                      <img src={item.image} className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                      <div>
                        <h4 className="font-bold text-gray-800">{item.name}</h4>
                        <p className="text-sm text-gray-500">₹{item.price}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => toggleItemAvailability(managedRestaurantId, item.id)} className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">
                        {item.isAvailable === false ? <EyeOff className="w-4 h-4 text-red-500" /> : <Eye className="w-4 h-4 text-green-600" />}
                      </button>
                      <button onClick={() => { setEditingItem(item); setShowItemModal(true); }} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {restaurantTab === 'marketing' && (
              <div className="space-y-4">
                <div className="bg-pink-50 p-4 rounded-xl border border-pink-100 mb-4">
                  <h3 className="text-lg font-bold text-pink-800 mb-1">Boost Your Sales 🚀</h3>
                  <p className="text-sm text-pink-600">Create custom coupons to attract more customers.</p>
                </div>

                <button onClick={() => { setEditingRestaurantCoupon(null); setShowCouponModal(true); }} className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 shadow-lg active:scale-95 transition"><Ticket className="w-4 h-4" /> Create New Coupon</button>

                <div className="space-y-3 mt-4">
                  {restaurants.find(r => r.id === managedRestaurantId)?.coupons?.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">No active coupons. Create one now!</p>
                  ) : (
                    restaurants.find(r => r.id === managedRestaurantId)?.coupons?.map((coupon, idx) => (
                      <div key={coupon.code} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-pink-500"></div>
                        <div>
                          <h4 className="font-black text-gray-800 text-lg tracking-wide">{coupon.code}</h4>
                          <p className="text-sm text-gray-600 font-medium">{coupon.desc}</p>
                          <p className="text-xs text-gray-400 mt-1">Min Order: ₹{coupon.minOrder} • Max Disc: ₹{coupon.maxDiscount}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setEditingRestaurantCoupon(coupon);
                              setShowCouponModal(true);
                            }}
                            className="p-2 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm("Delete this coupon?")) {
                                const updated = restaurants.map(r => {
                                  if (r.id === managedRestaurantId) {
                                    const newCoupons = r.coupons?.filter(c => c.code !== coupon.code) || [];
                                    return { ...r, coupons: newCoupons };
                                  }
                                  return r;
                                });
                                setRestaurants(updated);
                                triggerToast("Coupon Deleted!");
                              }
                            }}
                            className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {restaurantTab === 'reviews' && (
              <div className="space-y-4">
                {restaurants.find(r => r.id === managedRestaurantId)?.reviews?.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                    <Star className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500">No reviews yet.</p>
                  </div>
                ) : (
                  restaurants.find(r => r.id === managedRestaurantId)?.reviews?.map(review => (
                    <div key={review.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">
                            {review.customerName.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800">{review.customerName}</h4>
                            <p className="text-xs text-gray-400">{review.date}</p>
                          </div>
                        </div>
                        <div className="bg-green-50 text-green-700 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                          {review.rating} <Star className="w-3 h-3 fill-current" />
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed mb-3">"{review.comment}"</p>
                      
                      {review.reply ? (
                        <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-orange-500">
                          <p className="text-xs font-bold text-gray-500 uppercase mb-1">Your Reply</p>
                          <p className="text-sm text-gray-700">{review.reply}</p>
                        </div>
                      ) : (
                        replyingToReviewId === review.id ? (
                          <div className="mt-3">
                            <textarea 
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Write a reply..."
                              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-orange-500 outline-none mb-2"
                              rows={2}
                            ></textarea>
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => setReplyingToReviewId(null)} className="text-xs font-bold text-gray-500 px-3 py-1.5">Cancel</button>
                              <button 
                                onClick={() => {
                                  if (!replyText.trim()) return;
                                  const updated = restaurants.map(r => {
                                    if (r.id === managedRestaurantId) {
                                      return {
                                        ...r,
                                        reviews: r.reviews?.map(rev => rev.id === review.id ? { ...rev, reply: replyText } : rev)
                                      };
                                    }
                                    return r;
                                  });
                                  setRestaurants(updated);
                                  setReplyingToReviewId(null);
                                  setReplyText("");
                                  triggerToast("Reply Sent!");
                                }}
                                className="bg-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-lg"
                              >
                                Send Reply
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => { setReplyingToReviewId(review.id); setReplyText(""); }} className="text-orange-600 text-sm font-bold hover:underline mt-1">Reply to Customer</button>
                        )
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {restaurantTab === 'analytics' && (
              <div className="space-y-6">
                {(() => {
                  // --- REAL-TIME ANALYTICS LOGIC ---
                  const restaurantOrders = orders.filter(o => o.restaurantId === managedRestaurantId && o.status !== 'Cancelled');
                  
                  // 1. Key Metrics
                  const totalOrders = restaurantOrders.length;
                  const totalRevenue = restaurantOrders.reduce((sum, o) => sum + o.total, 0);
                  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
                  
                  const today = new Date();
                  const todaysOrders = restaurantOrders.filter(o => {
                    const d = o.createdAt ? new Date(o.createdAt) : new Date();
                    return d.getDate() === today.getDate() && 
                           d.getMonth() === today.getMonth() && 
                           d.getFullYear() === today.getFullYear();
                  });
                  const todaysRevenue = todaysOrders.reduce((sum, o) => sum + o.total, 0);

                  // 2. Chart Data (Last 7 Days)
                  const chartData = [];
                  for (let i = 6; i >= 0; i--) {
                    const d = new Date(today);
                    d.setDate(today.getDate() - i);
                    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                    
                    const dayOrders = restaurantOrders.filter(o => {
                      const orderDate = o.createdAt ? new Date(o.createdAt) : new Date();
                      return orderDate.getDate() === d.getDate() && 
                             orderDate.getMonth() === d.getMonth() && 
                             orderDate.getFullYear() === d.getFullYear();
                    });
                    
                    const sales = dayOrders.reduce((sum, o) => sum + o.total, 0);
                    chartData.push({ name: dayName, sales });
                  }

                  // 3. Top Selling Items
                  const itemStats: Record<string, { name: string, count: number, revenue: number }> = {};
                  restaurantOrders.forEach(order => {
                    order.items.forEach(item => {
                      if (!itemStats[item.name]) {
                        itemStats[item.name] = { name: item.name, count: 0, revenue: 0 };
                      }
                      itemStats[item.name].count += item.qty;
                      itemStats[item.name].revenue += (item.price * item.qty);
                    });
                  });
                  const topItems = Object.values(itemStats).sort((a, b) => b.count - a.count).slice(0, 5);

                  return (
                    <>
                      {/* Key Metrics Cards */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                          <p className="text-orange-600 text-xs font-bold uppercase">Today's Revenue</p>
                          <h3 className="text-2xl font-black text-gray-800">₹{todaysRevenue}</h3>
                          <p className="text-xs text-gray-500">{todaysOrders.length} orders today</p>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                          <p className="text-blue-600 text-xs font-bold uppercase">Total Revenue</p>
                          <h3 className="text-2xl font-black text-gray-800">₹{totalRevenue}</h3>
                          <p className="text-xs text-gray-500">Avg Order: ₹{avgOrderValue}</p>
                        </div>
                      </div>

                      {/* Sales Chart */}
                      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><BarChart2 className="w-5 h-5 text-purple-600" /> Weekly Sales</h3>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} tickFormatter={(value) => `₹${value}`} />
                              <Tooltip 
                                cursor={{ fill: '#f9fafb' }} 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} 
                                formatter={(value: number) => [`₹${value}`, 'Sales']}
                              />
                              <Bar dataKey="sales" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Top Items List */}
                      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Top Selling Items</h3>
                        {topItems.length === 0 ? (
                          <p className="text-gray-400 text-center py-4 text-sm">No sales data yet.</p>
                        ) : (
                          <div className="space-y-3">
                            {topItems.map((item, i) => (
                              <div key={i} className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0">
                                <div>
                                  <h4 className="font-bold text-gray-700 text-sm">{item.name}</h4>
                                  <p className="text-xs text-gray-400">{item.count} orders</p>
                                </div>
                                <span className="font-bold text-green-600 text-sm">₹{item.revenue}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {restaurantTab === 'payouts' && (
              <div className="space-y-6">
                {(() => {
                  // Calculate Real Earnings
                  const currentRest = restaurants.find(r => r.id === managedRestaurantId);
                  const restaurantDeliveredOrders = orders.filter(o => o.restaurantId === managedRestaurantId && o.status === 'Delivered');
                  const totalLifetimeRevenue = restaurantDeliveredOrders.reduce((sum, o) => sum + o.total, 0);
                  
                  // Apply Commission
                  const commissionRate = platformSettings.commission / 100;
                  const netRevenue = Math.round(totalLifetimeRevenue * (1 - commissionRate));

                  // Get Payout History from Restaurant Object
                  const payouts = currentRest?.payouts || [];
                  const totalWithdrawn = payouts.reduce((sum, p) => sum + p.amount, 0);
                  const withdrawableBalance = netRevenue - totalWithdrawn;
                  const bankDetails = currentRest?.bankDetails;

                  return (
                    <>
                      {/* Earnings Cards */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl text-white shadow-lg">
                          <p className="text-indigo-100 text-xs font-bold uppercase mb-1">Available Balance</p>
                          <h3 className="text-3xl font-black">₹{withdrawableBalance}</h3>
                          <p className="text-[10px] text-indigo-200 mt-1">Ready to withdraw (After {platformSettings.commission}% Comm.)</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                          <p className="text-gray-400 text-xs font-bold uppercase mb-1">Total Sales</p>
                          <h3 className="text-2xl font-black text-gray-800">₹{totalLifetimeRevenue}</h3>
                          <p className="text-[10px] text-gray-400 mt-1">Gross Revenue</p>
                        </div>
                      </div>

                      {/* Withdraw Action */}
                      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Request Payout</h3>
                        <div className="flex gap-3">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                            <input 
                              type="number" 
                              id="withdraw-amount"
                              placeholder="Enter Amount" 
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-4 py-3 focus:outline-none focus:border-indigo-500 transition font-medium"
                            />
                          </div>
                          <button 
                            onClick={() => {
                              const input = document.getElementById('withdraw-amount') as HTMLInputElement;
                              const amount = parseInt(input.value);
                              if (!amount || amount <= 0) {
                                triggerToast("Enter valid amount!");
                                return;
                              }
                              if (amount > withdrawableBalance) {
                                triggerToast("Insufficient Balance!");
                                return;
                              }
                              if (!bankDetails) {
                                triggerToast("Please add bank details first!");
                                return;
                              }

                              // Process Withdrawal
                              const newPayout: PayoutTransaction = {
                                id: 'TXN' + Date.now(),
                                amount: amount,
                                date: new Date().toLocaleDateString(),
                                status: 'Pending'
                              };

                              const updatedRestaurants = restaurants.map(r => {
                                if (r.id === managedRestaurantId) {
                                  return { ...r, payouts: [newPayout, ...(r.payouts || [])] };
                                }
                                return r;
                              });
                              
                              setRestaurants(updatedRestaurants);
                              input.value = '';
                              triggerToast("Withdrawal Request Sent! 💸");
                            }}
                            className="bg-indigo-600 text-white font-bold px-6 rounded-xl hover:bg-indigo-700 transition shadow-md active:scale-95"
                          >
                            Withdraw
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1"><Info className="w-3 h-3" /> Minimum withdrawal amount is ₹500.</p>
                      </div>

                      {/* Transaction History */}
                      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50">
                          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Transaction History</h3>
                        </div>
                        {payouts.length === 0 ? (
                          <div className="text-center py-8 text-gray-400 text-sm">No transactions yet.</div>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {payouts.map(txn => (
                              <div key={txn.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${txn.status === 'Processed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                    {txn.status === 'Processed' ? <CheckCheck className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-gray-800 text-sm">Withdrawal</h4>
                                    <p className="text-xs text-gray-400">{txn.date} • ID: {txn.id}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="block font-bold text-gray-800">- ₹{txn.amount}</span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${txn.status === 'Processed' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>{txn.status}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Bank Details */}
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-bold text-gray-700 text-sm">Bank Account</h4>
                          {bankDetails && <button onClick={() => setShowBankModal(true)} className="text-indigo-600 text-xs font-bold hover:underline">Edit</button>}
                        </div>
                        
                        {bankDetails ? (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                              <span className="font-black text-gray-400 text-[10px] uppercase">{bankDetails.bankName.substring(0, 4)}</span>
                            </div>
                            <div>
                              <p className="font-bold text-gray-800 text-sm">{bankDetails.bankName} - {bankDetails.accountNo.slice(-4).padStart(bankDetails.accountNo.length, '*')}</p>
                              <p className="text-xs text-gray-500">{bankDetails.holderName}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg bg-white">
                            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
                              <Wallet className="w-6 h-6 text-indigo-500" />
                            </div>
                            <p className="text-gray-500 text-xs mb-4 font-medium">Link your bank account to receive payouts</p>
                            <button 
                              onClick={() => setShowBankModal(true)}
                              className="bg-indigo-600 text-white text-xs font-bold px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition shadow-md"
                            >
                              Add Bank Account
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Edit Bank Details Modal */}
            {showBankModal && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Add/Update Bank Details</h3>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const newDetails = {
                      bankName: formData.get('bankName') as string,
                      accountNo: formData.get('accountNo') as string,
                      ifsc: formData.get('ifsc') as string,
                      holderName: formData.get('holderName') as string
                    };
                    
                    const updatedRestaurants = restaurants.map(r => {
                      if (r.id === managedRestaurantId) {
                        return { ...r, bankDetails: newDetails };
                      }
                      return r;
                    });
                    setRestaurants(updatedRestaurants);
                    setShowBankModal(false);
                    triggerToast("Bank Details Saved! 🏦");
                  }}>
                    {(() => {
                      const currentRest = restaurants.find(r => r.id === managedRestaurantId);
                      const bankDetails = currentRest?.bankDetails;
                      return (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Account Holder Name</label>
                            <input name="holderName" defaultValue={bankDetails?.holderName || ''} placeholder="e.g. Rahul Sharma" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-indigo-500" required />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Bank Name</label>
                            <input name="bankName" defaultValue={bankDetails?.bankName || ''} placeholder="e.g. HDFC Bank" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-indigo-500" required />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Account Number</label>
                            <input name="accountNo" type="password" defaultValue={bankDetails?.accountNo || ''} placeholder="Enter Account Number" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-indigo-500" required />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">IFSC Code</label>
                            <input name="ifsc" defaultValue={bankDetails?.ifsc || ''} placeholder="e.g. HDFC0001234" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-indigo-500" required />
                          </div>
                        </div>
                      );
                    })()}
                    <div className="flex gap-3 mt-6">
                      <button type="button" onClick={() => setShowBankModal(false)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl">Cancel</button>
                      <button type="submit" className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg">Save Details</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {restaurantTab === 'history' && (
              <div className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <input type="date" className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  <select className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <option>All Status</option>
                    <option>Delivered</option>
                    <option>Cancelled</option>
                  </select>
                </div>
                {orders.filter(o => o.restaurantId === managedRestaurantId && (o.status === 'Delivered' || o.status === 'Out for Delivery')).length === 0 ? (
                  <p className="text-gray-500 text-center mt-10">No past orders found.</p>
                ) : (
                  orders.filter(o => o.restaurantId === managedRestaurantId && (o.status === 'Delivered' || o.status === 'Out for Delivery')).map(o => (
                    <div key={o.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm opacity-75">
                      <div className="flex justify-between font-bold mb-1">
                        <span className="text-gray-800">#{o.id}</span>
                        <span className="text-green-600">₹{o.total}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{o.time} • {o.items.length} Items</p>
                      <div className="flex justify-between items-center">
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-[10px] font-bold uppercase">{o.status}</span>
                        <button className="text-blue-500 text-xs font-bold">View Details</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {restaurantTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Store className="w-5 h-5 text-blue-600" /> Restaurant Profile</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Restaurant Name</label>
                      <input type="text" defaultValue={restaurants.find(r => r.id === managedRestaurantId)?.name} className="w-full mt-1 border-b border-gray-200 py-2 focus:border-orange-500 outline-none font-medium" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                      <textarea defaultValue={restaurants.find(r => r.id === managedRestaurantId)?.description} rows={2} className="w-full mt-1 border-b border-gray-200 py-2 focus:border-orange-500 outline-none font-medium text-sm"></textarea>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <span className="font-bold text-gray-700">Accepting Orders</span>
                      <button 
                        onClick={() => {
                          const currentRest = restaurants.find(r => r.id === managedRestaurantId);
                          if (!currentRest) return;
                          
                          fetch(`/api/restaurants/${managedRestaurantId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ isOpen: !currentRest.isOpen })
                          })
                          .then(res => {
                            if (!res.ok) throw new Error('Failed to update status');
                            return res.json();
                          })
                          .then(updatedRestaurant => {
                            setRestaurants(prev => prev.map(r => r.id === managedRestaurantId ? updatedRestaurant : r));
                            triggerToast(updatedRestaurant.isOpen ? "Restaurant is now OPEN" : "Restaurant is now CLOSED");
                          })
                          .catch(err => {
                            console.error("Failed to update status", err);
                            // Fallback
                            const updated = restaurants.map(r => r.id === managedRestaurantId ? { ...r, isOpen: !r.isOpen } : r);
                            setRestaurants(updated);
                            triggerToast(updated.find(r => r.id === managedRestaurantId)?.isOpen ? "Restaurant is now OPEN" : "Restaurant is now CLOSED");
                          });
                        }}
                        className={`w-12 h-6 rounded-full p-1 transition-colors ${restaurants.find(r => r.id === managedRestaurantId)?.isOpen ? 'bg-green-500' : 'bg-gray-300'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${restaurants.find(r => r.id === managedRestaurantId)?.isOpen ? 'translate-x-6' : 'translate-x-0'}`}></div>
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-4">
                      <div>
                        <span className="font-bold text-gray-700 block">Order Notifications</span>
                        <span className="text-xs text-gray-400">
                          {notificationPermissionStatus === 'granted' ? '✅ Active' : 
                           notificationPermissionStatus === 'denied' ? '❌ Blocked by Browser' : 
                           'Get alerts for new orders'}
                        </span>
                        {notificationPermissionStatus === 'denied' && (
                          <p className="text-[10px] text-red-500 mt-1 max-w-[200px] leading-tight">
                            Please click the 🔒 Lock icon in your browser URL bar and 'Reset Permission' or 'Allow' Notifications.
                          </p>
                        )}
                      </div>
                      <button 
                        onClick={requestNotificationPermission}
                        disabled={notificationPermissionStatus === 'granted'}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                          notificationPermissionStatus === 'granted' 
                            ? 'bg-green-100 text-green-700 cursor-default' 
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        }`}
                      >
                        {notificationPermissionStatus === 'granted' ? 'Enabled' : 'Enable'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-4">
                      <div>
                        <span className="font-bold text-gray-700 block">Test Alert</span>
                        <span className="text-xs text-gray-400">Check if it works</span>
                      </div>
                      <button 
                        onClick={() => sendOrderNotification("TEST-123", 999)}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-200 transition"
                      >
                        Test Now
                      </button>
                    </div>
                  </div>
                  <button className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl mt-6">Save Changes</button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Add/Edit Item Modal */}
        {showItemModal && (
          <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 fade-in">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <h2 className="text-xl font-bold mb-4">{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
              <form onSubmit={handleSaveItem}>
                <div className="mb-3">
                  <label className="block text-xs font-bold text-gray-500 mb-1">Item Image</label>
                  <input type="file" name="image" accept="image/*" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100" />
                </div>
                <input name="name" defaultValue={editingItem?.name} placeholder="Item Name" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-3 focus:outline-none focus:border-orange-500 transition font-medium" required />
                <input name="price" type="number" defaultValue={editingItem?.price} placeholder="Price (₹)" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-3 focus:outline-none focus:border-orange-500 transition font-medium" required />
                <textarea name="desc" defaultValue={editingItem?.desc} placeholder="Description" rows={2} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-3 focus:outline-none focus:border-orange-500 transition font-medium" required />
                <div className="flex items-center gap-2 mb-4">
                  <input type="checkbox" name="veg" defaultChecked={editingItem?.veg} id="veg-check" className="w-4 h-4 accent-green-600" />
                  <label htmlFor="veg-check" className="text-sm font-medium text-gray-700">Is Veg?</label>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowItemModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold">Cancel</button>
                  <button type="submit" className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-bold">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Coupon Modal */}
        {showCouponModal && (
          <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 fade-in">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <h2 className="text-xl font-bold mb-4">{editingRestaurantCoupon ? 'Edit Coupon' : 'Create New Coupon'}</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const newCoupon: RestaurantCoupon = {
                  code: (formData.get('code') as string).toUpperCase(),
                  discount: Number(formData.get('discount')),
                  maxDiscount: Number(formData.get('maxDiscount')),
                  minOrder: Number(formData.get('minOrder')),
                  desc: formData.get('desc') as string,
                  isActive: true
                };

                const updated = restaurants.map(r => {
                  if (r.id === managedRestaurantId) {
                    let updatedCoupons = r.coupons || [];
                    
                    // Check for duplicates
                    const isDuplicate = updatedCoupons.some(c => 
                      c.code === newCoupon.code && 
                      (!editingRestaurantCoupon || c.code !== editingRestaurantCoupon.code)
                    );

                    if (isDuplicate) {
                      triggerToast("Coupon code already exists!");
                      return r; // Return without changes
                    }

                    if (editingRestaurantCoupon) {
                      updatedCoupons = updatedCoupons.map(c => c.code === editingRestaurantCoupon.code ? newCoupon : c);
                    } else {
                      updatedCoupons = [...updatedCoupons, newCoupon];
                    }
                    return { ...r, coupons: updatedCoupons };
                  }
                  return r;
                });
                
                // Check if update happened
                const currentRest = restaurants.find(r => r.id === managedRestaurantId);
                const newRest = updated.find(r => r.id === managedRestaurantId);
                
                if (currentRest === newRest) {
                   return;
                }

                setRestaurants(updated);
                setShowCouponModal(false);
                triggerToast(editingRestaurantCoupon ? "Coupon Updated!" : "Coupon Created Successfully!");
              }}>
                <input name="code" defaultValue={editingRestaurantCoupon?.code} placeholder="Coupon Code (e.g. SAVE50)" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-3 focus:outline-none focus:border-orange-500 transition font-medium uppercase" required />
                <div className="flex gap-3 mb-3">
                  <input name="discount" defaultValue={editingRestaurantCoupon?.discount} type="number" placeholder="Discount %" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition font-medium" required />
                  <input name="maxDiscount" defaultValue={editingRestaurantCoupon?.maxDiscount} type="number" placeholder="Max Off (₹)" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition font-medium" required />
                </div>
                <input name="minOrder" defaultValue={editingRestaurantCoupon?.minOrder} type="number" placeholder="Min Order Amount (₹)" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-3 focus:outline-none focus:border-orange-500 transition font-medium" required />
                <textarea name="desc" defaultValue={editingRestaurantCoupon?.desc} placeholder="Description (e.g. 50% off on all orders)" rows={2} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:border-orange-500 transition font-medium" required />
                
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowCouponModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold">Cancel</button>
                  <button type="submit" className="flex-1 bg-pink-500 text-white py-3 rounded-xl font-bold">{editingRestaurantCoupon ? 'Update Coupon' : 'Create Coupon'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <Toast message={toastMsg} isVisible={showToast} onClose={() => setShowToast(false)} />
      </div>
    );
  }

  if (currentView === 'delivery') {
    if (!currentRider) {
      return (
        <div className="min-h-screen bg-white p-6 flex flex-col items-center justify-center relative">
          <button onClick={() => setCurrentView('role')} className="absolute top-6 left-6 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <ArrowLeft className="text-gray-800" />
          </button>
          
          <div className="w-full max-w-sm">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
              <Bike className="text-3xl text-green-600" />
            </div>
            <h1 className="text-3xl font-black text-gray-800 mb-2">Rider {riderAuthMode === 'login' ? 'Login' : 'Sign Up'}</h1>
            <p className="text-gray-500 mb-8 text-sm">{riderAuthMode === 'login' ? 'Start delivering & earning.' : 'Join our delivery fleet.'}</p>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              if (riderAuthMode === 'login') {
                handleRiderLogin(formData.get('mobile') as string, formData.get('password') as string);
              } else {
                handleRiderSignup(
                  formData.get('name') as string, 
                  formData.get('mobile') as string, 
                  formData.get('password') as string
                );
              }
            }}>
              {riderAuthMode === 'signup' && (
                <input name="name" type="text" placeholder="Rider Name" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 mb-4 focus:outline-none focus:border-green-500 transition font-medium" required />
              )}
              <input name="mobile" type="tel" placeholder="10-digit Mobile Number" maxLength={10} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 mb-4 focus:outline-none focus:border-green-500 transition font-medium" required />
              <input name="password" type="password" placeholder="Password" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 mb-6 focus:outline-none focus:border-green-500 transition font-medium" required />
              
              <button type="submit" className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition text-lg">
                {riderAuthMode === 'login' ? 'Login' : 'Register'}
              </button>
            </form>
            
            <p className="text-center mt-8 text-sm text-gray-600 font-medium">
              {riderAuthMode === 'login' ? 'New Rider?' : 'Already Registered?'} 
              <span onClick={() => setRiderAuthMode(riderAuthMode === 'login' ? 'signup' : 'login')} className="text-green-600 font-bold cursor-pointer ml-1 hover:underline">
                {riderAuthMode === 'login' ? 'Join Now' : 'Login Here'}
              </span>
            </p>
          </div>
          <Toast message={toastMsg} isVisible={showToast} onClose={() => setShowToast(false)} />
        </div>
      );
    }

    return (
      <div className="p-4 max-w-4xl mx-auto min-h-screen bg-gray-50 pb-24">
        {/* Header */}
        <div className="bg-white p-4 rounded-2xl shadow-sm mb-6 flex justify-between items-center sticky top-4 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-lg">
              {currentRider.name.charAt(0)}
            </div>
            <div>
              <h2 className="font-bold text-gray-800 leading-tight">{currentRider.name}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${currentRider.isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                <span className="text-xs text-gray-500 font-medium">{currentRider.isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={toggleRiderStatus} 
            className={`w-12 h-7 rounded-full p-1 transition-colors ${currentRider.isOnline ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${currentRider.isOnline ? 'translate-x-5' : 'translate-x-0'}`}></div>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-400 text-xs font-bold uppercase mb-1">Today's Earnings</p>
            <h3 className="text-2xl font-black text-gray-800">₹{currentRider.earnings.today}</h3>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-400 text-xs font-bold uppercase mb-1">Completed</p>
            <h3 className="text-2xl font-black text-gray-800">{orders.filter(o => o.riderId === currentRider.id && o.status === 'Delivered').length}</h3>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white p-1 rounded-xl shadow-sm mb-6">
          <button onClick={() => setRiderTab('active')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${riderTab === 'active' ? 'bg-green-50 text-green-600' : 'text-gray-500'}`}>Active</button>
          <button onClick={() => setRiderTab('history')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${riderTab === 'history' ? 'bg-green-50 text-green-600' : 'text-gray-500'}`}>History</button>
          <button onClick={() => setRiderTab('earnings')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${riderTab === 'earnings' ? 'bg-green-50 text-green-600' : 'text-gray-500'}`}>Earnings</button>
        </div>

        {/* Content */}
        {riderTab === 'active' && (
          <div className="space-y-4">
            {/* Current Active Order */}
            {currentRider.currentOrderId && (
              <div className="bg-green-600 text-white p-5 rounded-2xl shadow-lg mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">Ongoing Delivery</span>
                      <h3 className="text-xl font-black mt-1">Order #{currentRider.currentOrderId}</h3>
                    </div>
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <Bike className="w-6 h-6" />
                    </div>
                  </div>
                  
                  {(() => {
                    const activeOrder = orders.find(o => o.id === currentRider.currentOrderId);
                    if (!activeOrder) return null;
                    return (
                      <>
                        <div className="space-y-3 mb-6">
                          <div className="flex items-start gap-3">
                            <Store className="w-5 h-5 opacity-80 mt-0.5" />
                            <div>
                              <p className="text-xs font-bold opacity-70 uppercase">Pick Up From</p>
                              <p className="font-bold text-sm">{restaurants.find(r => r.id === activeOrder.restaurantId)?.name}</p>
                              <p className="text-xs opacity-80">{restaurants.find(r => r.id === activeOrder.restaurantId)?.timeDist}</p>
                            </div>
                          </div>
                          <div className="w-0.5 h-4 bg-white/30 ml-2.5"></div>
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 opacity-80 mt-0.5" />
                            <div>
                              <p className="text-xs font-bold opacity-70 uppercase">Deliver To</p>
                              <p className="font-bold text-sm">{activeOrder.customerName}</p>
                              <p className="text-xs opacity-80">{activeOrder.deliveryAddress}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <a href={`tel:${activeOrder.customerMobile}`} className="flex-1 bg-white/20 hover:bg-white/30 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition">
                            <Smartphone className="w-4 h-4" /> Call
                          </a>
                          <a 
                            href={activeOrder.deliveryLocation 
                              ? `https://www.google.com/maps/search/?api=1&query=${activeOrder.deliveryLocation.lat},${activeOrder.deliveryLocation.lng}` 
                              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeOrder.deliveryAddress)}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="flex-1 bg-white/20 hover:bg-white/30 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition"
                          >
                            <MapPin className="w-4 h-4" /> Map
                          </a>
                        </div>

                        {activeOrder.deliveryLocation && (
                          <div className="mt-4 rounded-xl overflow-hidden border border-white/20 h-40 relative bg-white/10">
                            <iframe 
                              width="100%" 
                              height="100%" 
                              frameBorder="0" 
                              style={{border:0}} 
                              src={`https://maps.google.com/maps?q=${activeOrder.deliveryLocation.lat},${activeOrder.deliveryLocation.lng}&z=15&output=embed`} 
                              allowFullScreen
                              title="Customer Location"
                            ></iframe>
                          </div>
                        )}

                        {activeOrder.paymentMethod === 'Cash on Delivery' && (
                          <div className="mt-4 bg-red-500/20 border border-red-200/30 p-3 rounded-xl flex items-center gap-3">
                            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shrink-0 font-bold">₹</div>
                            <div>
                              <p className="font-bold text-sm text-red-100">Collect Cash</p>
                              <p className="text-lg font-black">₹{activeOrder.total}</p>
                            </div>
                          </div>
                        )}

                        <button 
                          onClick={() => setShowProofModal(true)}
                          className="w-full bg-white text-green-600 font-black py-4 rounded-xl mt-4 shadow-md active:scale-95 transition flex items-center justify-center gap-2"
                        >
                          <CheckCheck className="w-5 h-5" /> Mark Delivered
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Available Orders */}
            <h3 className="font-bold text-gray-800 text-lg px-1">New Orders ({orders.filter(o => o.status === 'Ready' && !o.riderId).length})</h3>
            
            {orders.filter(o => o.status === 'Ready' && !o.riderId).length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bike className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">No new orders nearby.</p>
                <p className="text-xs text-gray-400 mt-1">Stay online to receive alerts.</p>
              </div>
            ) : (
              orders.filter(o => o.status === 'Ready' && !o.riderId).map(order => (
                <div key={order.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                        <Store className="text-orange-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800">{restaurants.find(r => r.id === order.restaurantId)?.name}</h4>
                        <p className="text-xs text-gray-500">2.5 km • ₹40 Earning</p>
                      </div>
                    </div>
                    <span className="bg-green-50 text-green-700 px-2 py-1 rounded-lg text-xs font-bold">₹{order.total} Bill</span>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-xl mb-4">
                    <div className="flex items-start gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-gray-600 font-medium">{order.deliveryAddress}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 pl-6 mb-3">
                      <span className="bg-white border px-1.5 py-0.5 rounded">{order.paymentMethod}</span>
                      <span>• {order.items.length} Items</span>
                    </div>
                    
                    {order.deliveryLocation && (
                      <div className="w-full h-24 rounded-lg overflow-hidden border border-gray-200 mt-2">
                        <iframe 
                          width="100%" 
                          height="100%" 
                          frameBorder="0" 
                          style={{border:0}} 
                          src={`https://maps.google.com/maps?q=${order.deliveryLocation.lat},${order.deliveryLocation.lng}&z=14&output=embed`} 
                          allowFullScreen
                          title="Delivery Location"
                        ></iframe>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => acceptDelivery(order.id)}
                    disabled={!currentRider.isOnline || !!currentRider.currentOrderId}
                    className={`w-full py-3 rounded-xl font-bold text-sm shadow-sm transition active:scale-95 flex items-center justify-center gap-2 ${
                      !currentRider.isOnline 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : !!currentRider.currentOrderId 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {!currentRider.isOnline ? 'Go Online to Accept' : !!currentRider.currentOrderId ? 'Complete Current Order First' : 'Accept Delivery'}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {riderTab === 'history' && (
          <div className="space-y-4">
            {orders.filter(o => o.riderId === currentRider.id && o.status === 'Delivered').length === 0 ? (
              <div className="text-center py-10 text-gray-400">No delivery history.</div>
            ) : (
              orders.filter(o => o.riderId === currentRider.id && o.status === 'Delivered').map(order => (
                <div key={order.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center opacity-75">
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">Order #{order.id}</h4>
                    <p className="text-xs text-gray-500">{order.time} • {order.deliveryAddress.substring(0, 20)}...</p>
                  </div>
                  <div className="text-right">
                    <span className="block font-bold text-green-600 text-sm">+ ₹40</span>
                    <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">Delivered</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {riderTab === 'earnings' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-2xl text-white shadow-lg">
              <p className="text-green-100 text-xs font-bold uppercase mb-1">Total Earnings</p>
              <h3 className="text-4xl font-black">₹{currentRider.earnings.total}</h3>
              <div className="flex gap-4 mt-6 pt-6 border-t border-white/20">
                <div>
                  <p className="text-[10px] text-green-100 uppercase font-bold">Today</p>
                  <p className="text-xl font-bold">₹{currentRider.earnings.today}</p>
                </div>
                <div>
                  <p className="text-[10px] text-green-100 uppercase font-bold">This Week</p>
                  <p className="text-xl font-bold">₹{currentRider.earnings.week}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <h4 className="font-bold text-gray-800 mb-3">Payout History</h4>
              <div className="text-center py-6 text-gray-400 text-sm">No payouts yet.</div>
            </div>
          </div>
        )}

        <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
          <button onClick={() => { setCurrentRider(null); setCurrentView('role'); }} className="bg-white text-red-500 px-6 py-2 rounded-full shadow-lg border border-gray-100 font-bold text-sm flex items-center gap-2">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>

        {/* Proof of Delivery Modal */}
        {showProofModal && (
          <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 fade-in">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Camera className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-center mb-2">Proof of Delivery</h2>
              <p className="text-gray-500 text-center text-sm mb-6">Please upload a photo of the delivered package.</p>
              
              <div className="mb-6">
                <label className="block w-full border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50 transition">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
                  {proofFile ? (
                    <div className="text-green-600 font-bold flex flex-col items-center">
                      <CheckCheck className="w-8 h-8 mb-2" />
                      {proofFile.name}
                    </div>
                  ) : (
                    <div className="text-gray-400 flex flex-col items-center">
                      <Camera className="w-8 h-8 mb-2" />
                      <span className="text-sm font-bold">Tap to Capture</span>
                    </div>
                  )}
                </label>
              </div>

              <div className="flex gap-3">
                <button onClick={() => { setShowProofModal(false); setProofFile(null); }} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold">Cancel</button>
                <button onClick={completeDelivery} disabled={!proofFile} className={`flex-1 py-3 rounded-xl font-bold text-white transition ${proofFile ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 cursor-not-allowed'}`}>Complete</button>
              </div>
            </div>
          </div>
        )}

        <Toast message={toastMsg} isVisible={showToast} onClose={() => setShowToast(false)} />
      </div>
    );
  }

  if (currentView === 'admin') {
    return (
      <div className="flex flex-col md:flex-row h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="md:hidden bg-white p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 z-20">
          <h2 className="text-xl font-black text-orange-600 flex items-center gap-2">
            <Utensils className="w-6 h-6" /> Zayka Admin
          </h2>
          <button onClick={() => setAdminMobileMenuOpen(!adminMobileMenuOpen)} className="p-2 bg-gray-100 rounded-lg">
            {adminMobileMenuOpen ? <X className="w-6 h-6 text-gray-600" /> : <Menu className="w-6 h-6 text-gray-600" />}
          </button>
        </div>

        {/* Sidebar */}
        <div className={`w-full md:w-64 bg-white border-r border-gray-200 flex flex-col fixed md:relative z-10 h-[calc(100vh-65px)] md:h-screen transition-transform duration-300 ${adminMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="p-6 border-b border-gray-100 hidden md:block">
            <h2 className="text-2xl font-black text-orange-600 flex items-center gap-2">
              <Utensils className="w-6 h-6" /> Zayka Admin
            </h2>
          </div>
          
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <button onClick={() => { setAdminTab('dashboard'); setAdminMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${adminTab === 'dashboard' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}>
              <BarChart2 className="w-5 h-5" /> Dashboard
            </button>
            <button onClick={() => { setAdminTab('restaurants'); setAdminMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${adminTab === 'restaurants' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}>
              <Store className="w-5 h-5" /> Restaurants
            </button>
            <button onClick={() => { setAdminTab('users'); setAdminMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${adminTab === 'users' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}>
              <UserIcon className="w-5 h-5" /> Users
            </button>
            <button onClick={() => { setAdminTab('riders'); setAdminMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${adminTab === 'riders' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}>
              <Bike className="w-5 h-5" /> Riders
            </button>
            <button onClick={() => { setAdminTab('payouts'); setAdminMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${adminTab === 'payouts' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}>
              <Wallet className="w-5 h-5" /> Payouts
            </button>
            <button onClick={() => { setAdminTab('live-map'); setAdminMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${adminTab === 'live-map' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}>
              <Map className="w-5 h-5" /> Live Map
            </button>
            <button onClick={() => { setAdminTab('banners'); setAdminMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${adminTab === 'banners' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}>
              <Image className="w-5 h-5" /> Banners
            </button>
            <button onClick={() => { setAdminTab('support'); setAdminMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${adminTab === 'support' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}>
              <MessageSquare className="w-5 h-5" /> Support
            </button>
            <button onClick={() => { setAdminTab('notifications'); setAdminMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${adminTab === 'notifications' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}>
              <Bell className="w-5 h-5" /> Notifications
            </button>
            <button onClick={() => { setAdminTab('coupons'); setAdminMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${adminTab === 'coupons' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}>
              <Ticket className="w-5 h-5" /> Coupons
            </button>
            <button onClick={() => { setAdminTab('reports'); setAdminMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${adminTab === 'reports' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}>
              <FileText className="w-5 h-5" /> Reports
            </button>
            <button onClick={() => { setAdminTab('settings'); setAdminMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${adminTab === 'settings' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}>
              <Settings className="w-5 h-5" /> Settings
            </button>
          </nav>

          <div className="p-4 border-t border-gray-100">
            <button onClick={() => setCurrentView('role')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-500 hover:bg-red-50 transition">
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-20 md:pt-8">
          {adminTab === 'dashboard' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">+12%</span>
                  </div>
                  <h3 className="text-3xl font-black text-gray-800">{orders.length}</h3>
                  <p className="text-gray-500 text-sm font-medium">Total Orders</p>
                </div>
                
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">+8%</span>
                  </div>
                  <h3 className="text-3xl font-black text-gray-800">₹{orders.reduce((sum, o) => sum + o.total, 0)}</h3>
                  <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
                      <Store className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{restaurants.length}</span>
                  </div>
                  <h3 className="text-3xl font-black text-gray-800">{restaurants.filter(r => r.isOpen).length}</h3>
                  <p className="text-gray-500 text-sm font-medium">Active Restaurants</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{users.length}</span>
                  </div>
                  <h3 className="text-3xl font-black text-gray-800">{users.length}</h3>
                  <p className="text-gray-500 text-sm font-medium">Total Users</p>
                </div>
              </div>

              {/* Analytics Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Report */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-4">Weekly Sales Report</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={adminDashboardStats.salesData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="sales" fill="#f97316" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top Items */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-4">Top Selling Items</h3>
                  <div className="h-64 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={adminDashboardStats.topItemsData}
                          cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                        >
                          {['#f97316', '#3b82f6', '#22c55e', '#a855f7'].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Peak Hours */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm lg:col-span-2">
                  <h3 className="font-bold text-gray-800 mb-4">Peak Order Hours</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={adminDashboardStats.hoursData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Recent Orders Table */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800">Recent Orders</h3>
                  <button className="text-sm text-orange-600 font-bold hover:underline">View All</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[600px]">
                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                      <tr>
                        <th className="px-6 py-4">Order ID</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Restaurant</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {orders.slice(0, 5).map(order => (
                        <tr key={order.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 font-bold text-gray-800">#{order.id}</td>
                          <td className="px-6 py-4 text-gray-600">{order.customerName}</td>
                          <td className="px-6 py-4 text-gray-600">{restaurants.find(r => r.id === order.restaurantId)?.name}</td>
                          <td className="px-6 py-4 font-bold text-gray-800">₹{order.total}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                              order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                              order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {adminTab === 'restaurants' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Restaurants Management</h2>
                <div className="flex gap-3 w-full sm:w-auto">
                  <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="Search restaurants..." className="outline-none text-sm font-medium w-full" />
                  </div>
                  <button 
                    onClick={() => { setRestaurantForm({}); setShowAddRestaurantModal(true); }}
                    className="bg-orange-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-orange-700 transition"
                  >
                    <Plus className="w-4 h-4" /> Add New
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurants.map(rest => (
                  <div key={rest.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden group hover:border-orange-200 transition relative">
                    {/* Approval Badge */}
                    <div className="absolute top-3 left-3 z-10">
                       {rest.isApproved === false ? (
                         <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-sm">Rejected</span>
                       ) : rest.isApproved === true ? (
                         <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-sm">Approved</span>
                       ) : (
                         <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-sm">Pending</span>
                       )}
                    </div>

                    <div className="h-32 bg-gray-100 relative">
                      <img src={rest.image} className="w-full h-full object-cover" />
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm">
                        <Star className="w-3 h-3 text-orange-500 fill-current" /> {rest.rating}
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-gray-800">{rest.name}</h3>
                        <button 
                          onClick={() => handleToggleRestaurantStatus(rest.id)}
                          className={`px-2 py-1 rounded text-xs font-bold uppercase transition ${rest.isOpen ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                        >
                          {rest.isOpen ? 'Open' : 'Closed'}
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 mb-1">{rest.cuisines}</p>
                      <p className="text-xs text-gray-400 mb-4">{rest.address || "No address provided"}</p>
                      
                      <div className="grid grid-cols-3 gap-2 mb-4">
                         <button 
                           onClick={() => { setSelectedRestaurant(rest); setShowMenuModal(true); }}
                           className="flex items-center justify-center gap-1 bg-orange-50 text-orange-600 py-2 rounded-lg text-xs font-bold hover:bg-orange-100 transition"
                         >
                           <Utensils className="w-3 h-3" /> Menu
                         </button>
                         <button 
                           onClick={() => { setSelectedRestaurant(rest); setShowReviewsModal(true); }}
                           className="flex items-center justify-center gap-1 bg-blue-50 text-blue-600 py-2 rounded-lg text-xs font-bold hover:bg-blue-100 transition"
                         >
                           <MessageSquare className="w-3 h-3" /> Reviews
                         </button>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex gap-2">
                          {rest.isApproved !== true && (
                            <button onClick={() => handleApproveRestaurant(rest.id, true)} className="p-2 bg-green-50 rounded-lg hover:bg-green-100 text-green-600 transition" title="Approve">
                              <CheckCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => { setSelectedRestaurant(rest); setRestaurantForm(rest); setSignupLocation(rest.location || null); setShowEditRestaurantModal(true); }}
                            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600 transition"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteRestaurant(rest.id)}
                            className="p-2 bg-red-50 rounded-lg hover:bg-red-100 text-red-500 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-xs font-bold text-gray-400">
                          Comm: {rest.commissionRate || platformSettings.commission}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Restaurant Modal */}
              {showAddRestaurantModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 fade-in">
                  <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <h2 className="text-xl font-bold mb-4">Add New Restaurant</h2>
                    <form onSubmit={handleAddRestaurant} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Restaurant Name</label>
                          <input required type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2" 
                            value={restaurantForm.name || ''} onChange={e => setRestaurantForm({...restaurantForm, name: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Cuisines</label>
                          <input required type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2" 
                            value={restaurantForm.cuisines || ''} onChange={e => setRestaurantForm({...restaurantForm, cuisines: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Owner Name</label>
                          <input required type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2" 
                            value={restaurantForm.ownerName || ''} onChange={e => setRestaurantForm({...restaurantForm, ownerName: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Owner Mobile</label>
                          <input required type="tel" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2" 
                            value={restaurantForm.ownerMobile || ''} onChange={e => setRestaurantForm({...restaurantForm, ownerMobile: e.target.value})} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-bold text-gray-700 mb-1">Address</label>
                          <textarea required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2" 
                            value={restaurantForm.address || ''} onChange={e => setRestaurantForm({...restaurantForm, address: e.target.value})}></textarea>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Commission Rate (%)</label>
                          <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2" 
                            value={restaurantForm.commissionRate || platformSettings.commission} onChange={e => setRestaurantForm({...restaurantForm, commissionRate: Number(e.target.value)})} />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Image URL</label>
                          <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2" 
                            value={restaurantForm.image || ''} onChange={e => setRestaurantForm({...restaurantForm, image: e.target.value})} />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Delivery Radius (km)</label>
                          <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2" 
                            value={restaurantForm.deliveryRadius || 5} onChange={e => setRestaurantForm({...restaurantForm, deliveryRadius: Number(e.target.value)})} />
                        </div>

                        {/* Location Picker */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-bold text-gray-700 mb-1">Location</label>
                          <button 
                            type="button"
                            onClick={() => {
                              setIsLocatingSignup(true);
                              if ("geolocation" in navigator) {
                                navigator.geolocation.getCurrentPosition(
                                  (position) => {
                                    setSignupLocation({
                                      lat: position.coords.latitude,
                                      lng: position.coords.longitude
                                    });
                                    setIsLocatingSignup(false);
                                    triggerToast("Location Set! 📍");
                                  },
                                  (error) => {
                                    setIsLocatingSignup(false);
                                    triggerToast("Unable to get location.");
                                  }
                                );
                              } else {
                                setIsLocatingSignup(false);
                                triggerToast("Geolocation not supported.");
                              }
                            }}
                            className={`w-full border-2 border-dashed rounded-xl py-3 flex items-center justify-center gap-2 font-bold transition ${signupLocation ? 'border-green-500 text-green-600 bg-green-50' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                          >
                            {isLocatingSignup ? (
                              <span className="animate-pulse">Locating...</span>
                            ) : signupLocation ? (
                              <><CheckCheck className="w-5 h-5" /> Location Set ({signupLocation.lat.toFixed(4)}, {signupLocation.lng.toFixed(4)})</>
                            ) : (
                              <><MapPin className="w-5 h-5" /> Set Location</>
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setShowAddRestaurantModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold">Cancel</button>
                        <button type="submit" className="flex-1 bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700">Add Restaurant</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Edit Restaurant Modal */}
              {showEditRestaurantModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 fade-in">
                  <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <h2 className="text-xl font-bold mb-4">Edit Restaurant</h2>
                    <form onSubmit={handleUpdateRestaurant} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Restaurant Name</label>
                          <input required type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2" 
                            value={restaurantForm.name || ''} onChange={e => setRestaurantForm({...restaurantForm, name: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Cuisines</label>
                          <input required type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2" 
                            value={restaurantForm.cuisines || ''} onChange={e => setRestaurantForm({...restaurantForm, cuisines: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Owner Name</label>
                          <input required type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2" 
                            value={restaurantForm.ownerName || ''} onChange={e => setRestaurantForm({...restaurantForm, ownerName: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Owner Mobile</label>
                          <input required type="tel" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2" 
                            value={restaurantForm.ownerMobile || ''} onChange={e => setRestaurantForm({...restaurantForm, ownerMobile: e.target.value})} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-bold text-gray-700 mb-1">Address</label>
                          <textarea required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2" 
                            value={restaurantForm.address || ''} onChange={e => setRestaurantForm({...restaurantForm, address: e.target.value})}></textarea>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Commission Rate (%)</label>
                          <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2" 
                            value={restaurantForm.commissionRate || platformSettings.commission} onChange={e => setRestaurantForm({...restaurantForm, commissionRate: Number(e.target.value)})} />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Delivery Radius (km)</label>
                          <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2" 
                            value={restaurantForm.deliveryRadius || 5} onChange={e => setRestaurantForm({...restaurantForm, deliveryRadius: Number(e.target.value)})} />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Image URL</label>
                          <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2" 
                            value={restaurantForm.image || ''} onChange={e => setRestaurantForm({...restaurantForm, image: e.target.value})} />
                        </div>
                         
                        {/* Location Picker */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-bold text-gray-700 mb-1">Location</label>
                          <button 
                            type="button"
                            onClick={() => {
                              setIsLocatingSignup(true);
                              if ("geolocation" in navigator) {
                                navigator.geolocation.getCurrentPosition(
                                  (position) => {
                                    setSignupLocation({
                                      lat: position.coords.latitude,
                                      lng: position.coords.longitude
                                    });
                                    setIsLocatingSignup(false);
                                    triggerToast("Location Updated! 📍");
                                  },
                                  (error) => {
                                    setIsLocatingSignup(false);
                                    triggerToast("Unable to get location.");
                                  }
                                );
                              } else {
                                setIsLocatingSignup(false);
                                triggerToast("Geolocation not supported.");
                              }
                            }}
                            className={`w-full border-2 border-dashed rounded-xl py-3 flex items-center justify-center gap-2 font-bold transition ${signupLocation ? 'border-green-500 text-green-600 bg-green-50' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                          >
                            {isLocatingSignup ? (
                              <span className="animate-pulse">Locating...</span>
                            ) : signupLocation ? (
                              <><CheckCheck className="w-5 h-5" /> Location Set ({signupLocation.lat.toFixed(4)}, {signupLocation.lng.toFixed(4)})</>
                            ) : (
                              <><MapPin className="w-5 h-5" /> Update Location</>
                            )}
                          </button>
                        </div>

                         <div className="flex items-center gap-4 md:col-span-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={restaurantForm.isOpen || false} onChange={e => setRestaurantForm({...restaurantForm, isOpen: e.target.checked})} />
                              <span className="text-sm font-bold text-gray-700">Open for Business</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={restaurantForm.isApproved || false} onChange={e => setRestaurantForm({...restaurantForm, isApproved: e.target.checked})} />
                              <span className="text-sm font-bold text-gray-700">Approved</span>
                            </label>
                         </div>
                      </div>
                      
                      <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setShowEditRestaurantModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold">Cancel</button>
                        <button type="submit" className="flex-1 bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700">Update Restaurant</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Menu Modal */}
              {showMenuModal && selectedRestaurant && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 fade-in">
                  <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-xl font-bold">Manage: {selectedRestaurant.name}</h2>
                      </div>
                      <button onClick={() => setShowMenuModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X className="w-5 h-5" /></button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         {/* Add New Item Card */}
                         <div className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-gray-50 transition min-h-[150px]"
                              onClick={() => {
                                setMenuItemForm({ veg: true });
                                setShowAddMenuItemModal(true);
                              }}>
                            <Plus className="w-8 h-8 text-gray-400 mb-2" />
                            <span className="text-gray-500 font-bold">Add Item</span>
                         </div>
  
                         {selectedRestaurant.menu.map(item => (
                           <div key={item.id} className="border border-gray-200 rounded-xl p-3 flex gap-3">
                              <img src={item.image} className="w-20 h-20 rounded-lg object-cover" />
                              <div className="flex-1">
                                 <h4 className="font-bold text-gray-800">{item.name}</h4>
                                 <p className="text-xs text-gray-500 line-clamp-2">{item.desc}</p>
                                 <div className="flex justify-between items-center mt-2">
                                    <span className="font-bold text-gray-800">₹{item.price}</span>
                                    <div className="flex gap-1">
                                       <button className="p-1 bg-gray-100 rounded hover:bg-gray-200"><Edit2 className="w-3 h-3" /></button>
                                       <button className="p-1 bg-red-50 rounded hover:bg-red-100 text-red-500" onClick={() => handleDeleteMenuItem(selectedRestaurant.id, item.id)}><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                 </div>
                              </div>
                           </div>
                         ))}
                      </div>

                  </div>
                </div>
              )}

              {/* Add Menu Item Modal */}
              {showAddMenuItemModal && (
                <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 fade-in">
                  <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold">Add Menu Item</h2>
                      <button onClick={() => setShowAddMenuItemModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X className="w-5 h-5" /></button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Item Name</label>
                        <input 
                          type="text" 
                          value={menuItemForm.name || ''} 
                          onChange={e => setMenuItemForm({...menuItemForm, name: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition font-medium"
                          placeholder="e.g. Butter Chicken"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Price (₹)</label>
                        <input 
                          type="number" 
                          value={menuItemForm.price || ''} 
                          onChange={e => setMenuItemForm({...menuItemForm, price: Number(e.target.value)})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition font-medium"
                          placeholder="e.g. 250"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                        <textarea 
                          value={menuItemForm.desc || ''} 
                          onChange={e => setMenuItemForm({...menuItemForm, desc: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition font-medium resize-none"
                          rows={3}
                          placeholder="Short description..."
                        ></textarea>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Image URL</label>
                        <input 
                          type="text" 
                          value={menuItemForm.image || ''} 
                          onChange={e => setMenuItemForm({...menuItemForm, image: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition font-medium"
                          placeholder="https://..."
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="text-sm font-bold text-gray-700">Type:</label>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setMenuItemForm({...menuItemForm, veg: true})}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${menuItemForm.veg ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}
                          >
                            Veg
                          </button>
                          <button 
                            onClick={() => setMenuItemForm({...menuItemForm, veg: false})}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${!menuItemForm.veg ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}
                          >
                            Non-Veg
                          </button>
                        </div>
                      </div>

                      <button 
                        onClick={handleAddMenuItem}
                        className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-indigo-700 transition active:scale-95 mt-4"
                      >
                        Add Item
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Reviews Modal */}
              {showReviewsModal && selectedRestaurant && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 fade-in">
                  <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold">Reviews: {selectedRestaurant.name}</h2>
                      <button onClick={() => setShowReviewsModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X className="w-5 h-5" /></button>
                    </div>
                    
                    <div className="space-y-4">
                       {selectedRestaurant.reviews && selectedRestaurant.reviews.length > 0 ? (
                         selectedRestaurant.reviews.map(review => (
                           <div key={review.id} className="border border-gray-200 rounded-xl p-4">
                              <div className="flex justify-between items-start mb-2">
                                 <div>
                                    <h4 className="font-bold text-gray-800">{review.customerName}</h4>
                                    <div className="flex items-center gap-1">
                                       {[...Array(5)].map((_, i) => (
                                          <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-orange-500 fill-current' : 'text-gray-300'}`} />
                                       ))}
                                       <span className="text-xs text-gray-400 ml-2">{review.date}</span>
                                    </div>
                                 </div>
                              </div>
                              <p className="text-gray-600 text-sm">{review.comment}</p>
                           </div>
                         ))
                       ) : (
                         <div className="text-center py-10 text-gray-500">No reviews yet.</div>
                       )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {adminTab === 'users' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Registered Users</h2>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[600px]">
                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                      <tr>
                        <th className="px-6 py-4">User ID</th>
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Mobile</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map(user => (
                        <tr key={user.id} className={`hover:bg-gray-50 transition ${user.isBlocked ? 'bg-red-50' : ''}`}>
                          <td className="px-6 py-4 font-bold text-gray-800">#{user.id}</td>
                          <td className="px-6 py-4 font-medium text-gray-700">{user.name}</td>
                          <td className="px-6 py-4 text-gray-600">{user.mobile}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${user.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                              {user.isBlocked ? 'Blocked' : 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => toggleUserBlock(user.id)}
                              className={`font-bold hover:underline text-xs ${user.isBlocked ? 'text-green-600' : 'text-red-500'}`}
                            >
                              {user.isBlocked ? 'Unblock' : 'Block'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {adminTab === 'riders' && <AdminRiders />}

          {adminTab === 'payouts' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Payout Requests</h2>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[700px]">
                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                      <tr>
                        <th className="px-6 py-4">Request ID</th>
                        <th className="px-6 py-4">Restaurant</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {restaurants.flatMap(r => (r.payouts || []).map(p => ({ ...p, restaurantName: r.name, restaurantId: r.id }))).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((payout, idx) => (
                        <tr key={payout.id || idx} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 font-bold text-gray-800">{payout.id}</td>
                          <td className="px-6 py-4 font-medium text-gray-700">{payout.restaurantName}</td>
                          <td className="px-6 py-4 font-bold text-gray-800">₹{payout.amount}</td>
                          <td className="px-6 py-4 text-gray-600">{payout.date}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                              payout.status === 'Processed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {payout.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {payout.status === 'Pending' && (
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => {
                                    const updatedRestaurants = restaurants.map(r => {
                                      if (r.id === payout.restaurantId) {
                                        return {
                                          ...r,
                                          payouts: r.payouts?.map(p => p.id === payout.id ? { ...p, status: 'Processed' as const } : p)
                                        };
                                      }
                                      return r;
                                    });
                                    setRestaurants(updatedRestaurants);
                                    triggerToast(`Payout ${payout.id} Approved!`);
                                  }}
                                  className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 transition"
                                >
                                  Approve
                                </button>
                                <button 
                                  onClick={() => {
                                    const updatedRestaurants = restaurants.map(r => {
                                      if (r.id === payout.restaurantId) {
                                        return {
                                          ...r,
                                          payouts: r.payouts?.map(p => p.id === payout.id ? { ...p, status: 'Rejected' as const } : p)
                                        };
                                      }
                                      return r;
                                    });
                                    setRestaurants(updatedRestaurants);
                                    triggerToast(`Payout ${payout.id} Rejected!`);
                                  }}
                                  className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {restaurants.flatMap(r => r.payouts || []).length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-400">No payout requests found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {adminTab === 'live-map' && (
            <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Live Delivery Map</h2>
                <div className="flex gap-2">
                  <span className="flex items-center gap-1 text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> {riders.filter(r => r.isOnline).length} Online Riders</span>
                  <span className="flex items-center gap-1 text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full"><div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div> {orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length} Active Orders</span>
                </div>
              </div>
              
              <div className="flex-1 bg-gray-200 rounded-2xl border border-gray-300 relative overflow-hidden shadow-inner group">
                {/* Mock Map Background */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#cbd5e1 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>
                
                {/* Central Hub */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 bg-orange-500 rounded-full shadow-lg ring-4 ring-orange-200 animate-pulse"></div>
                </div>

                {/* Restaurants Markers */}
                {restaurants.map((rest, i) => (
                  <div key={rest.id} className="absolute" style={{ 
                    top: rest.location ? `${50 + (rest.location.lat - 28.6139) * 100}%` : `${20 + (i * 10)}%`, 
                    left: rest.location ? `${50 + (rest.location.lng - 77.2090) * 100}%` : `${10 + (i * 15)}%` 
                  }}>
                    <div className="relative group/marker cursor-pointer z-10">
                      <div className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-orange-500 text-orange-600 transform hover:scale-110 transition">
                        <Store className="w-4 h-4" />
                      </div>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/marker:opacity-100 transition pointer-events-none z-20">
                        {rest.name}
                      </div>
                      {/* Delivery Radius Circle (Simulated) */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-orange-500/20 bg-orange-500/5 rounded-full pointer-events-none"></div>
                    </div>
                  </div>
                ))}

                {/* Randomly placed Riders */}
                {riders.filter(r => r.isOnline).map((rider, i) => (
                  <div key={rider.id} className="absolute transition-all duration-1000 ease-in-out" style={{ top: `${30 + (i * 15) + Math.sin((mapTick + i)/2) * 5}%`, left: `${20 + (i * 20) + Math.cos((mapTick + i)/2) * 5}%` }}>
                    <div className="relative group/marker cursor-pointer">
                      <div className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-green-500 text-green-600 transform hover:scale-110 transition">
                        <Bike className="w-4 h-4" />
                      </div>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/marker:opacity-100 transition pointer-events-none">
                        {rider.name}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Randomly placed Active Orders */}
                {orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').map((order, i) => (
                  <div key={order.id} className="absolute transition-all duration-1000 ease-in-out" style={{ top: `${60 - (i * 10)}%`, left: `${70 - (i * 15)}%` }}>
                    <div className="relative group/marker cursor-pointer">
                      <div className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-blue-500 text-blue-600 transform hover:scale-110 transition">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/marker:opacity-100 transition pointer-events-none">
                        Order #{order.id} • ₹{order.total}
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur p-2 rounded-lg text-xs text-gray-500 shadow-sm">
                  Map View (Simulation)
                </div>
              </div>
            </div>
          )}

          {adminTab === 'coupons' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Coupon Management</h2>
                <button 
                  onClick={() => { setAdminCouponForm({}); setEditingCouponCode(null); setShowAdminCouponModal(true); }}
                  className="bg-orange-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-orange-700 transition"
                >
                  <Plus className="w-4 h-4" /> Add Coupon
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coupons.map((coupon, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative group">
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button onClick={() => { setAdminCouponForm(coupon); setEditingCouponCode(coupon.code); setShowAdminCouponModal(true); }} className="p-2 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteCoupon(coupon.code)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                        <Ticket className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-black text-xl text-gray-800">{coupon.code}</h3>
                        <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">{coupon.discount}% OFF</span>
                      </div>
                    </div>
                    <p className="text-gray-500 text-sm mb-4">{coupon.desc}</p>
                    <div className="flex justify-between items-center text-xs font-bold text-gray-400 border-t border-gray-100 pt-4">
                      <span>Min Order: ₹{coupon.minOrder}</span>
                      <span>Max Disc: ₹{coupon.maxDiscount}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Coupon Modal */}
              {showAdminCouponModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 fade-in">
                  <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold">{editingCouponCode ? 'Edit Coupon' : 'Add New Coupon'}</h2>
                      <button onClick={() => setShowAdminCouponModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X className="w-5 h-5" /></button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Coupon Code</label>
                        <input 
                          type="text" 
                          value={adminCouponForm.code || ''} 
                          onChange={e => setAdminCouponForm({...adminCouponForm, code: e.target.value.toUpperCase()})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold uppercase tracking-wider"
                          placeholder="e.g. SAVE50"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Discount (%)</label>
                          <input 
                            type="number" 
                            value={adminCouponForm.discount || ''} 
                            onChange={e => setAdminCouponForm({...adminCouponForm, discount: Number(e.target.value)})}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3"
                            placeholder="e.g. 20"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Max Discount (₹)</label>
                          <input 
                            type="number" 
                            value={adminCouponForm.maxDiscount || ''} 
                            onChange={e => setAdminCouponForm({...adminCouponForm, maxDiscount: Number(e.target.value)})}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3"
                            placeholder="e.g. 100"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Min Order Amount (₹)</label>
                        <input 
                          type="number" 
                          value={adminCouponForm.minOrder || ''} 
                          onChange={e => setAdminCouponForm({...adminCouponForm, minOrder: Number(e.target.value)})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3"
                          placeholder="e.g. 200"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                        <textarea 
                          value={adminCouponForm.desc || ''} 
                          onChange={e => setAdminCouponForm({...adminCouponForm, desc: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 resize-none"
                          rows={2}
                          placeholder="e.g. 50% off up to ₹100"
                        ></textarea>
                      </div>

                      <button 
                        onClick={handleAddCoupon}
                        className="w-full bg-orange-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-orange-700 transition active:scale-95 mt-4"
                      >
                        {editingCouponCode ? 'Update Coupon' : 'Create Coupon'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Delete Confirmation Modal */}
              {couponToDelete && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 fade-in">
                  <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                      <Trash2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Coupon?</h3>
                    <p className="text-gray-500 mb-6">Are you sure you want to delete <span className="font-bold text-gray-800">{couponToDelete}</span>? This action cannot be undone.</p>
                    <div className="flex gap-3">
                      <button onClick={() => setCouponToDelete(null)} className="flex-1 py-3 bg-gray-100 font-bold rounded-xl text-gray-600 hover:bg-gray-200">Cancel</button>
                      <button onClick={confirmDeleteCoupon} className="flex-1 py-3 bg-red-600 font-bold rounded-xl text-white hover:bg-red-700">Delete</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {adminTab === 'reports' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">System Reports</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sales Report */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between h-48 group hover:border-orange-200 transition">
                  <div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                      <BarChart2 className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-800">Sales Report</h3>
                    <p className="text-sm text-gray-500">Detailed breakdown of daily, weekly, and monthly revenue.</p>
                  </div>
                  <button onClick={() => triggerToast("Downloading Sales Report... 📄")} className="flex items-center justify-center gap-2 w-full bg-gray-50 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-100 transition mt-4">
                    <FileText className="w-4 h-4" /> Download CSV
                  </button>
                </div>

                {/* User Growth */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between h-48 group hover:border-orange-200 transition">
                  <div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                      <UserIcon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-800">User Growth</h3>
                    <p className="text-sm text-gray-500">New user registrations and retention metrics.</p>
                  </div>
                  <button onClick={() => triggerToast("Downloading User Report... 📄")} className="flex items-center justify-center gap-2 w-full bg-gray-50 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-100 transition mt-4">
                    <FileText className="w-4 h-4" /> Download CSV
                  </button>
                </div>

                {/* Restaurant Performance */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between h-48 group hover:border-orange-200 transition">
                  <div>
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mb-4">
                      <Store className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-800">Restaurant Performance</h3>
                    <p className="text-sm text-gray-500">Order volume, ratings, and commission data.</p>
                  </div>
                  <button onClick={() => triggerToast("Downloading Restaurant Report... 📄")} className="flex items-center justify-center gap-2 w-full bg-gray-50 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-100 transition mt-4">
                    <FileText className="w-4 h-4" /> Download CSV
                  </button>
                </div>

                {/* Rider Performance */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between h-48 group hover:border-orange-200 transition">
                  <div>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-4">
                      <Bike className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-800">Rider Performance</h3>
                    <p className="text-sm text-gray-500">Delivery times, earnings, and ratings.</p>
                  </div>
                  <button onClick={() => triggerToast("Downloading Rider Report... 📄")} className="flex items-center justify-center gap-2 w-full bg-gray-50 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-100 transition mt-4">
                    <FileText className="w-4 h-4" /> Download CSV
                  </button>
                </div>
              </div>
            </div>
          )}

          {adminTab === 'settings' && <AdminSettings />}

          {adminTab === 'banners' && <AdminBanners />}

          {adminTab === 'support' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Support Tickets</h2>
              
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[700px]">
                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                      <tr>
                        <th className="px-6 py-4">Ticket ID</th>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Issue</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {supportTickets.map(ticket => (
                        <tr key={ticket.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 font-bold text-gray-800">{ticket.id}</td>
                          <td className="px-6 py-4 font-medium text-gray-700">{ticket.user}</td>
                          <td className="px-6 py-4 text-gray-600">{ticket.issue}</td>
                          <td className="px-6 py-4 text-gray-500">{ticket.date}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                              ticket.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {ticket.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => {
                                const updated = supportTickets.map(t => t.id === ticket.id ? { ...t, status: ticket.status === 'Open' ? 'Resolved' : 'Open' as const } : t);
                                setSupportTickets(updated);
                                triggerToast(`Ticket ${ticket.id} Updated`);
                              }}
                              className="text-orange-600 font-bold hover:underline text-xs"
                            >
                              {ticket.status === 'Open' ? 'Mark Resolved' : 'Reopen'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {adminTab === 'notifications' && (
            <div className="space-y-6 max-w-2xl">
              <h2 className="text-2xl font-bold text-gray-800">Push Notifications</h2>
              
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Target Audience</label>
                  <div className="flex gap-4">
                    {['all', 'users', 'riders'].map(target => (
                      <button 
                        key={target}
                        onClick={() => setNotificationForm({ ...notificationForm, target })}
                        className={`flex-1 py-2 rounded-xl font-bold text-sm capitalize transition ${
                          notificationForm.target === target ? 'bg-orange-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {target}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Notification Title</label>
                  <input 
                    type="text" 
                    value={notificationForm.title}
                    onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                    placeholder="e.g., Diwali Sale is Live! 🎆"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition" 
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Message</label>
                  <textarea 
                    value={notificationForm.message}
                    onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                    placeholder="Type your message here..."
                    rows={4}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition resize-none" 
                  ></textarea>
                </div>

                <button 
                  onClick={sendPushNotification}
                  disabled={isSendingNotification}
                  className={`w-full font-bold py-3.5 rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 ${isSendingNotification ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                >
                  {isSendingNotification ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" /> Send Notification
                    </>
                  )}
                </button>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-blue-800">Pro Tip</p>
                  <p className="text-xs text-blue-600 mt-1">Use emojis to increase engagement rates. Notifications are delivered instantly to all active devices.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// --- SUB COMPONENTS ---

const RoleCard = ({ icon, title, subtitle, color, onClick }: any) => (
  <div onClick={onClick} className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm hover:border-orange-500 cursor-pointer transition flex items-center gap-4">
    <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center`}>{icon}</div>
    <div><h2 className="text-lg font-bold">{title}</h2><p className="text-gray-500 text-xs">{subtitle}</p></div>
  </div>
);

const NavButton = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 w-16 ${active ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'}`}>
    {React.cloneElement(icon, { className: "w-5 h-5" })}
    <span>{label}</span>
  </button>
);

const ProfileMenuItem = ({ icon, color, bg, label, onClick }: any) => (
  <div onClick={onClick} className="flex items-center gap-4 p-4 border-b border-gray-50 active:bg-gray-50 transition cursor-pointer">
    <div className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center ${color}`}>
      {React.cloneElement(icon, { className: "w-5 h-5" })}
    </div>
    <span className="flex-1 font-semibold text-[15px] text-gray-700">{label}</span>
    <ChevronRight className="text-gray-300 w-4 h-4" />
  </div>
);
