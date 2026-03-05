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

export interface User {
  name: string;
  mobile: string;
  password?: string;
  addresses: Address[];
  walletBalance: number;
}

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  restaurantId: number | null;
  items: OrderItem[];
  total: number;
  status: 'Pending' | 'Preparing' | 'Ready' | 'Out for Delivery' | 'Delivered';
  time: string;
  customerName: string;
  customerMobile: string;
  deliveryAddress: string;
  paymentMethod: string;
}
