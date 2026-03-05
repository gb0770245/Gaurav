import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Store, Bike, PieChart, Smartphone, Lock, UserPlus, 
  MapPin, Search, Mic, Star, CloudRain, Sparkles, ChevronRight, 
  ArrowLeft, ShoppingBag, Home, Utensils, User as UserIcon,
  Plus, Trash2, CreditCard, Bell, Settings, LogOut, Ticket,
  CheckCheck, Percent, ChevronDown, X, Wallet, Edit2, Eye, EyeOff,
  BarChart2, History, Power, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { INITIAL_USERS, RESTAURANTS, INITIAL_ORDERS, COUPONS, Coupon } from './data';
import { User as UserType, Restaurant, Order, Cart, Address, MenuItem } from './types';
import { Toast } from './components/Toast';

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
  
  // User Sub-views
  const [userSubView, setUserSubView] = useState<'home' | 'menu' | 'profile' | 'cart' | 'checkout'>('home');
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

  // Restaurant Panel State
  const [restaurantTab, setRestaurantTab] = useState<'orders' | 'menu' | 'analytics' | 'history' | 'settings' | 'payouts'>('orders');
  const [managedRestaurantId, setManagedRestaurantId] = useState<number | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null); // null means adding new
  const [restaurantAuthMode, setRestaurantAuthMode] = useState<'login' | 'signup'>('login');
  const [currentRestaurantOwner, setCurrentRestaurantOwner] = useState<string | null>(null); // Mobile number of logged in owner
  const [notificationAlert, setNotificationAlert] = useState<{title: string, body: string} | null>(null);
  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState<NotificationPermission>(
    "Notification" in window ? Notification.permission : 'default'
  );
  
  // Bank Details State
  const [bankDetails, setBankDetails] = useState<{
    bankName: string;
    accountNo: string;
    ifsc: string;
    holderName: string;
  } | null>(null);
  const [showBankModal, setShowBankModal] = useState(false);
  
  // Payout History State
  const [payoutHistory, setPayoutHistory] = useState<{id: string, date: string, amount: number, status: string}[]>([]);

  // --- HELPERS ---
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

    // 3. Play Sound
    try {
      const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
      audio.play().catch(e => console.log("Audio play failed", e));
    } catch (e) {
      console.error("Audio failed", e);
    }

    // Auto hide in-app alert after 5s
    setTimeout(() => setNotificationAlert(null), 5000);
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

  const handleRestaurantSignup = (name: string, mobile: string, pass: string, restName: string) => {
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
      password: pass
    };

    setRestaurants([...restaurants, newRest]);
    setCurrentRestaurantOwner(mobile);
    setManagedRestaurantId(newRest.id);
    triggerToast("Restaurant registered successfully!");
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
    const newUser: UserType = { name, mobile, password: pass, addresses: [], walletBalance: 0 };
    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    setCheckoutName(newUser.name);
    setCheckoutMobile(newUser.mobile);
    setCurrentView('user');
    setUserSubView('home');
    triggerToast("Registration successful!");
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

  const applyCoupon = () => {
    const code = couponCodeInput.trim().toUpperCase();
    if (!code) {
      triggerToast("Please enter a coupon code!");
      return;
    }

    const coupon = COUPONS.find(c => c.code === code);
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
    
    const subtotal = cart.items.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const discount = appliedCoupon ? Math.min(Math.round((subtotal * appliedCoupon.discount) / 100), appliedCoupon.maxDiscount) : 0;
    const total = (subtotal + 70) - discount; // +70 for taxes/delivery
    
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
      paymentMethod: method
    };

    setOrders([newOrder, ...orders]);
    setCart({ restaurantId: null, items: [] });
    setUserSubView('home');
    triggerToast(`Order Placed Successfully via ${method}!`);
    
    // Simulate Real-time Notification to Restaurant
    setTimeout(() => {
      sendOrderNotification(newOrder.id, newOrder.total);
    }, 2000);
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
    setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
    triggerToast(`Order marked as ${status}`);
  };

  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchTerm(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        triggerToast("Voice recognition failed. Try again.");
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      triggerToast("Voice search not supported in this browser.");
    }
  };

  const addMoneyToWallet = (amount: number) => {
    if (currentUser) {
      // Razorpay Integration for Wallet
      const options = {
        key: "rzp_test_TYbUv2o12n324", // Test Key
        amount: amount * 100, // Amount in paise
        currency: "INR",
        name: "Zayka Wallet Recharge",
        description: "Add Money to Wallet",
        image: "https://cdn-icons-png.flaticon.com/512/2956/2956869.png",
        handler: function (response: any) {
          const updatedUser = { ...currentUser, walletBalance: (currentUser.walletBalance || 0) + amount };
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
        triggerToast("Razorpay SDK failed to load. Simulating success...");
        // Fallback simulation
        setTimeout(() => {
          const updatedUser = { ...currentUser, walletBalance: (currentUser.walletBalance || 0) + amount };
          setCurrentUser(updatedUser);
          setUsers(users.map(u => u.mobile === currentUser.mobile ? updatedUser : u));
          triggerToast(`₹${amount} added to wallet (Simulated)!`);
        }, 1000);
      }
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

    const updatedRestaurants = restaurants.map(rest => {
      if (rest.id === managedRestaurantId) {
        if (editingItem) {
          // Edit existing
          return {
            ...rest,
            menu: rest.menu.map(item => item.id === editingItem.id ? { ...item, name, price, desc, veg, image: imageUrl } : item)
          };
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
          return { ...rest, menu: [...rest.menu, newItem] };
        }
      }
      return rest;
    });

    setRestaurants(updatedRestaurants);
    setShowItemModal(false);
    setEditingItem(null);
    triggerToast(editingItem ? "Item Updated Successfully!" : "New Item Added Successfully!");
  };

  const toggleItemAvailability = (restId: number, itemId: number) => {
    setRestaurants(restaurants.map(rest => {
      if (rest.id === restId) {
        return {
          ...rest,
          menu: rest.menu.map(item => item.id === itemId ? { ...item, isAvailable: !item.isAvailable } : item)
        };
      }
      return rest;
    }));
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
          <RoleCard icon={<PieChart className="text-purple-600" />} title="Admin" subtitle="Management" color="bg-purple-50" onClick={() => setCurrentView('admin')} />
        </div>
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
            <div onClick={() => setCurrentView('role')} className="cursor-pointer">
              <h1 className="font-bold text-orange-500 text-lg leading-tight flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {userSubView === 'home' ? 'Home' : 'Back'}
              </h1>
              <p className="text-xs text-gray-500">
                {currentUser?.addresses[0]?.text.substring(0, 25) || "Location not set"}...
              </p>
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
                    placeholder="Search for restaurant..." 
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
                {['Pure Veg', 'Rating 4.5+', 'Fast Delivery', 'Offers'].map((f, i) => (
                  <button key={i} className="whitespace-nowrap border border-gray-200 rounded-full px-4 py-2 text-sm font-semibold text-gray-700 bg-white shadow-sm">
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

              {/* Restaurants */}
              <div className="mt-8 px-4 pb-4">
                <h2 className="mb-4 text-[19px] font-bold text-[#1a1a1a]">Restaurants to explore</h2>
                <div className="flex flex-col gap-4">
                  {restaurants
                    .filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()))
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
                      <button className="text-orange-500 font-bold text-sm bg-orange-50 px-3 py-1.5 rounded-lg">EDIT</button>
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
                      <ProfileMenuItem icon={<Settings />} color="text-gray-600" bg="bg-gray-100" label="Settings" onClick={() => setProfileSubView('settings')} />
                      <div onClick={() => setCurrentView('role')} className="flex items-center gap-4 p-4 active:bg-red-50 transition cursor-pointer">
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
                        {orders.length === 0 ? (
                          <div className="text-center py-10 bg-white rounded-xl border border-gray-100">
                            <ShoppingBag className="mx-auto text-gray-300 w-10 h-10 mb-3" />
                            <p className="text-gray-500 text-sm">No orders yet.</p>
                          </div>
                        ) : (
                          orders.map(order => (
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
                                <button className="text-orange-500 font-bold text-xs border border-orange-500 px-3 py-1.5 rounded-lg">REORDER</button>
                              </div>
                            </div>
                          ))
                        )}
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
                          <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Saved Cards</h3>
                          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                            <div className="w-10 h-6 bg-blue-900 rounded flex items-center justify-center text-white text-[10px] italic font-bold">VISA</div>
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-800 text-sm">HDFC Bank</h4>
                              <p className="text-xs text-gray-500 mt-0.5">**** **** **** 1234</p>
                            </div>
                            <button className="text-red-500 text-sm"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      </div>
                    )}
                    {['info', 'coupons', 'notifications', 'settings'].includes(profileSubView!) && (
                      <div className="text-center py-10 text-gray-400">Feature coming soon!</div>
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
                  <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Delivery Details</h3>
                    <input type="text" value={checkoutName} onChange={e => setCheckoutName(e.target.value)} placeholder="Full Name" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-3 focus:outline-none focus:border-orange-500 transition font-medium" />
                    <input type="tel" value={checkoutMobile} onChange={e => setCheckoutMobile(e.target.value)} placeholder="Mobile Number" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition font-medium" />
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
                          {COUPONS.map(c => (
                            <div key={c.code} onClick={() => setCouponCodeInput(c.code)} className="border border-dashed border-gray-300 rounded-lg p-2 min-w-[150px] cursor-pointer hover:bg-gray-50 shrink-0">
                              <p className="font-bold text-gray-800 text-xs">{c.code}</p>
                              <p className="text-[10px] text-gray-500 leading-tight mt-1">{c.desc}</p>
                            </div>
                          ))}
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
                  <div className="flex justify-between text-sm mb-2 text-gray-500">
                    <span>Subtotal</span>
                    <span>₹{cart.items.reduce((sum, i) => sum + (i.price * i.qty), 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2 text-gray-500">
                    <span>Delivery & Taxes</span>
                    <span>₹70</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-sm mb-4 text-green-600 font-bold">
                      <span>Coupon Discount</span>
                      <span>- ₹{Math.min(Math.round((cart.items.reduce((sum, i) => sum + (i.price * i.qty), 0) * appliedCoupon.discount) / 100), appliedCoupon.maxDiscount)}</span>
                    </div>
                  )}
                  <button onClick={placeOrder} className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold text-lg shadow-md hover:bg-black transition active:scale-95 flex justify-between px-6">
                    <span>Pay Now</span>
                    <span>₹{(cart.items.reduce((sum, i) => sum + (i.price * i.qty), 0) + 70) - (appliedCoupon ? Math.min(Math.round((cart.items.reduce((sum, i) => sum + (i.price * i.qty), 0) * appliedCoupon.discount) / 100), appliedCoupon.maxDiscount) : 0)}</span>
                  </button>
                </div>
             </div>
          )}
        </main>

        {/* Bottom Nav */}
        <nav className="bg-white border-t border-gray-100 fixed bottom-0 w-full z-50 px-6 py-2 flex justify-between items-center pb-safe text-[10px] font-medium">
          <NavButton icon={<Home />} label="Home" active={userSubView === 'home'} onClick={() => setUserSubView('home')} />
          <NavButton icon={<Utensils />} label="Dining" />
          <div className="relative" onClick={() => { if(cart.items.length > 0) setUserSubView('checkout'); else triggerToast("Cart is empty"); }}>
            <NavButton icon={<ShoppingBag />} label="Cart" active={userSubView === 'checkout'} />
            {cart.items.length > 0 && <span className="absolute top-0 right-2 bg-orange-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">{cart.items.reduce((s,i) => s + i.qty, 0)}</span>}
          </div>
          <NavButton icon={<UserIcon />} label="Profile" active={userSubView === 'profile'} onClick={() => setUserSubView('profile')} />
        </nav>

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
                handleRestaurantSignup(
                  formData.get('name') as string, 
                  formData.get('mobile') as string, 
                  formData.get('password') as string,
                  formData.get('restName') as string
                );
              }
            }}>
              {restaurantAuthMode === 'signup' && (
                <>
                  <input name="name" type="text" placeholder="Owner Name" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 mb-4 focus:outline-none focus:border-blue-500 transition font-medium" required />
                  <input name="restName" type="text" placeholder="Restaurant Name" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 mb-4 focus:outline-none focus:border-blue-500 transition font-medium" required />
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

            {restaurantTab === 'analytics' && (
              <div className="space-y-6">
                {(() => {
                  // --- REAL-TIME ANALYTICS LOGIC ---
                  const restaurantOrders = orders.filter(o => o.restaurantId === managedRestaurantId && o.status !== 'Cancelled');
                  
                  // 1. Key Metrics
                  const totalOrders = restaurantOrders.length;
                  const totalRevenue = restaurantOrders.reduce((sum, o) => sum + o.total, 0);
                  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
                  
                  const today = new Date().toDateString();
                  const todaysOrders = restaurantOrders.filter(o => new Date(o.date).toDateString() === today);
                  const todaysRevenue = todaysOrders.reduce((sum, o) => sum + o.total, 0);

                  // 2. Chart Data (Last 7 Days)
                  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                  const chartData = days.map(day => ({ name: day, sales: 0 }));
                  
                  restaurantOrders.forEach(order => {
                    const d = new Date(order.date);
                    const dayName = days[d.getDay()];
                    const dayData = chartData.find(c => c.name === dayName);
                    if (dayData) dayData.sales += order.total;
                  });

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
                  const restaurantDeliveredOrders = orders.filter(o => o.restaurantId === managedRestaurantId && o.status === 'Delivered');
                  const totalLifetimeRevenue = restaurantDeliveredOrders.reduce((sum, o) => sum + o.total, 0);
                  const totalWithdrawn = payoutHistory.reduce((sum, p) => sum + p.amount, 0);
                  const withdrawableBalance = totalLifetimeRevenue - totalWithdrawn;

                  return (
                    <>
                      {/* Earnings Cards */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl text-white shadow-lg">
                          <p className="text-indigo-100 text-xs font-bold uppercase mb-1">Total Earnings</p>
                          <h3 className="text-2xl font-black">₹{totalLifetimeRevenue}</h3>
                          <p className="text-xs text-indigo-100 mt-2 opacity-80">Lifetime Revenue</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                          <p className="text-gray-500 text-xs font-bold uppercase mb-1">Withdrawable</p>
                          <h3 className="text-2xl font-black text-gray-800">₹{withdrawableBalance}</h3>
                          <button 
                            onClick={() => {
                              if (withdrawableBalance <= 0) {
                                triggerToast("No balance to withdraw!");
                                return;
                              }
                              if (!bankDetails) {
                                triggerToast("Please add bank details first!");
                                return;
                              }
                              
                              const newPayout = {
                                id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
                                date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                                amount: withdrawableBalance,
                                status: 'Processing'
                              };
                              setPayoutHistory([newPayout, ...payoutHistory]);
                              triggerToast(`Withdrawal Request of ₹${withdrawableBalance} Sent!`);
                            }}
                            disabled={withdrawableBalance <= 0}
                            className={`mt-3 w-full text-white text-xs font-bold py-2 rounded-lg transition ${withdrawableBalance > 0 ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-300 cursor-not-allowed'}`}
                          >
                            Withdraw Now
                          </button>
                        </div>
                      </div>

                      {/* Recent Transactions */}
                      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Wallet className="w-5 h-5 text-indigo-600" /> Recent Payouts</h3>
                        {payoutHistory.length === 0 ? (
                          <div className="text-center py-8 text-gray-400 text-sm">No payout history yet.</div>
                        ) : (
                          <div className="space-y-4">
                            {payoutHistory.map((txn, i) => (
                              <div key={i} className="flex justify-between items-center border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${txn.status === 'Success' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                                    {txn.status === 'Success' ? <CheckCheck className="w-5 h-5 text-green-600" /> : <History className="w-5 h-5 text-yellow-600" />}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-gray-800 text-sm">Payout #{txn.id}</h4>
                                    <p className="text-xs text-gray-500">{txn.date}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="font-bold text-gray-800 block">₹{txn.amount}</span>
                                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${txn.status === 'Success' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>{txn.status}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}

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
              </div>
            )}

            {/* Edit Bank Details Modal */}
            {showBankModal && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">{bankDetails ? 'Update' : 'Add'} Bank Details</h3>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    setBankDetails({
                      bankName: formData.get('bankName') as string,
                      accountNo: formData.get('accountNo') as string,
                      ifsc: formData.get('ifsc') as string,
                      holderName: formData.get('holderName') as string
                    });
                    setShowBankModal(false);
                    triggerToast(bankDetails ? "Bank Details Updated Successfully!" : "Bank Account Added Successfully!");
                  }}>
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
                          const updated = restaurants.map(r => r.id === managedRestaurantId ? { ...r, isOpen: !r.isOpen } : r);
                          setRestaurants(updated);
                          triggerToast(updated.find(r => r.id === managedRestaurantId)?.isOpen ? "Restaurant is now OPEN" : "Restaurant is now CLOSED");
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

        <Toast message={toastMsg} isVisible={showToast} onClose={() => setShowToast(false)} />
      </div>
    );
  }

  if (currentView === 'delivery') {
    return (
      <div className="p-4 max-w-4xl mx-auto min-h-screen bg-white">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setCurrentView('role')} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition">
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h2 className="text-xl font-bold text-gray-800">Rider Dashboard</h2>
          </div>
          <button onClick={() => setCurrentView('role')} className="text-sm text-gray-500 underline">Logout</button>
        </div>
        <div className="space-y-4">
          {orders.filter(o => o.status === 'Ready' || o.status === 'Out for Delivery').length === 0 ? (
            <p className="text-gray-500 text-center mt-10">No deliveries available.</p>
          ) : (
            orders.filter(o => o.status === 'Ready' || o.status === 'Out for Delivery').map(o => (
              <div key={o.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between font-bold mb-1"><span>Order #{o.id}</span> <span className="text-xs bg-gray-100 px-2 py-1 rounded">{o.status}</span></div>
                <p className="text-sm text-gray-500 mb-2">To: {o.deliveryAddress}</p>
                {o.status === 'Ready' ? (
                  <button onClick={() => updateOrderStatus(o.id, 'Out for Delivery')} className="w-full bg-orange-500 text-white py-2 rounded-lg font-bold">Pick Up</button>
                ) : (
                  <button onClick={() => updateOrderStatus(o.id, 'Delivered')} className="w-full bg-green-600 text-white py-2 rounded-lg font-bold">Mark Delivered</button>
                )}
              </div>
            ))
          )}
        </div>
        <Toast message={toastMsg} isVisible={showToast} onClose={() => setShowToast(false)} />
      </div>
    );
  }

  if (currentView === 'admin') {
    return (
      <div className="p-4 max-w-5xl mx-auto min-h-screen bg-white">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setCurrentView('role')} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition">
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h2 className="text-xl font-bold text-gray-800">System Admin</h2>
          </div>
          <button onClick={() => setCurrentView('role')} className="text-sm text-gray-500 underline">Logout</button>
        </div>
        <div className="space-y-3">
          {orders.map(o => (
            <div key={o.id} className="bg-white p-3 rounded-lg border border-gray-200 flex justify-between items-center text-sm">
              <div><span className="font-bold">#{o.id}</span><br/><span className="text-gray-500">₹{o.total}</span></div>
              <div className="font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded">{o.status}</div>
            </div>
          ))}
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
