export interface RestaurantCoupon {
  code: string;
  discount: number;
  maxDiscount: number;
  minOrder: number;
  desc: string;
  isActive: boolean;
}

export interface Review {
  id: number;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  reply?: string;
}

export interface MenuItem {
  id: number;
  name: string;
  price: number;
  desc: string;
  image: string;
  veg: boolean;
  isAvailable?: boolean;
}

export interface Restaurant {
  id: number;
  name: string;
  image: string;
  rating: string;
  timeDist: string;
  cuisines: string;
  menu: MenuItem[];
  isOpen?: boolean;
  description?: string;
  ownerId?: string; // Mobile number of the owner
  password?: string;
  coupons?: RestaurantCoupon[];
  reviews?: Review[];
  payouts?: PayoutTransaction[];
  isApproved?: boolean;
  commissionRate?: number;
  address?: string;
  ownerName?: string;
  ownerMobile?: string;
  ownerEmail?: string;
  location?: { lat: number; lng: number };
  deliveryRadius?: number; // in km
}

export interface PayoutTransaction {
  id: string;
  amount: number;
  date: string;
  status: 'Pending' | 'Processed' | 'Rejected';
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
}

export interface Cart {
  restaurantId: number | null;
  items: CartItem[];
}

export interface Address {
  title: string;
  text: string;
  icon: string;
  color: string;
}

export interface WalletTransaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  date: string;
  desc: string;
}

export interface User {
  id: number;
  name: string;
  mobile: string;
  email?: string;
  password?: string;
  addresses: Address[];
  walletBalance: number;
  transactions?: WalletTransaction[];
  isBlocked?: boolean;
  location?: { lat: number; lng: number };
}

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface Rider {
  id: number;
  name: string;
  mobile: string;
  password?: string;
  isOnline: boolean;
  earnings: {
    today: number;
    week: number;
    total: number;
  };
  currentOrderId?: string | null;
  rating?: number;
  totalRatings?: number;
  isApproved?: boolean;
  documents?: string[];
  payouts?: PayoutTransaction[];
}

export interface Banner {
  id: string;
  image: string;
  active: boolean;
}

export interface SupportTicket {
  id: string;
  user: string;
  issue: string;
  status: 'Open' | 'Resolved';
  date: string;
  description?: string;
}

export interface Order {
  id: string;
  restaurantId: number | null;
  items: OrderItem[];
  total: number;
  status: 'Pending' | 'Preparing' | 'Ready' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  time: string;
  customerName: string;
  customerMobile: string;
  deliveryAddress: string;
  paymentMethod: string;
  riderId?: number | null;
  deliveryFee?: number;
  proofOfDelivery?: string;
  riderRating?: number;
  deliveryLocation?: { lat: number; lng: number };
  createdAt?: number; // Timestamp
}
