import { Restaurant, User, Order } from './types';

export interface Coupon {
  code: string;
  discount: number; // Percentage
  maxDiscount: number;
  minOrder: number;
  desc: string;
}

export const COUPONS: Coupon[] = [
  { code: "ZAYKA50", discount: 50, maxDiscount: 100, minOrder: 199, desc: "50% OFF up to ₹100 on orders above ₹199" },
  { code: "WELCOME20", discount: 20, maxDiscount: 50, minOrder: 99, desc: "20% OFF on your first order" },
  { code: "PARTY100", discount: 15, maxDiscount: 150, minOrder: 500, desc: "Flat 15% OFF on party orders above ₹500" }
];

export const INITIAL_USERS: User[] = [
  { 
    id: 1,
    name: "Aman Kumar", 
    mobile: "9876543210", 
    email: "aman@example.com",
    password: "123",
    addresses: [],
    walletBalance: 500,
    transactions: [
      { id: "TXN1001", amount: 500, type: 'credit', date: '2023-10-25', desc: 'Added money to wallet' },
      { id: "TXN1002", amount: 240, type: 'debit', date: '2023-10-24', desc: 'Order #ORD9021' }
    ],
    location: { lat: 28.6139, lng: 77.2090 } // Connaught Place, New Delhi
  }
];

export const RESTAURANTS: Restaurant[] = [
  { 
    id: 1, 
    name: "Burger Haven", 
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80",
    rating: "4.6",
    timeDist: "25-30 min • 2.5 km",
    cuisines: "American, Fast Food",
    isOpen: true,
    description: "Best burgers in town with fresh ingredients.",
    location: { lat: 28.6200, lng: 77.2100 }, // Near CP
    deliveryRadius: 5,
    menu: [
      { id: 101, name: "Classic Cheeseburger", price: 150, desc: "Juicy beef patty with melted cheese and fresh veggies.", image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=200&q=80", veg: false, isAvailable: true },
      { id: 102, name: "Crispy Veggie Burger", price: 120, desc: "Crispy potato and pea patty with house special sauce.", image: "https://images.unsplash.com/photo-1585238342024-78d387f4a707?auto=format&fit=crop&w=200&q=80", veg: true, isAvailable: true },
      { id: 103, name: "French Fries", price: 80, desc: "Golden crinkle cut salted fries.", image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=200&q=80", veg: true, isAvailable: true }
    ],
    coupons: [
      { code: "BURGER20", discount: 20, maxDiscount: 50, minOrder: 200, desc: "20% off on orders above ₹200", isActive: true }
    ],
    reviews: [
      { id: 1, customerName: "Rahul S.", rating: 5, comment: "Best burgers in town! Loved the cheesy fries.", date: "2023-10-15", reply: "Thanks Rahul! Glad you liked it." },
      { id: 2, customerName: "Priya M.", rating: 4, comment: "Good taste but delivery was slightly late.", date: "2023-10-12" }
    ]
  },
  { 
    id: 2, 
    name: "Pizza Paradise", 
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=300&q=80",
    rating: "4.3",
    timeDist: "30-40 min • 3.2 km",
    cuisines: "Italian, Pizzas, Fast Food",
    isOpen: true,
    description: "Authentic Italian pizzas baked in wood-fired oven.",
    location: { lat: 28.6300, lng: 77.2200 }, // Slightly further
    deliveryRadius: 8,
    menu: [
      { id: 201, name: "Margherita Pizza", price: 250, desc: "Classic delight with 100% real mozzarella cheese.", image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=200&q=80", veg: true, isAvailable: true },
      { id: 202, name: "Pepperoni Pizza", price: 350, desc: "Topped with spicy chicken pepperoni and cheese.", image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=200&q=80", veg: false, isAvailable: true }
    ],
    coupons: [],
    reviews: []
  },
  { 
    id: 3, 
    name: "Desi Dhaba", 
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80",
    rating: "4.5",
    timeDist: "35-45 min • 4.1 km",
    cuisines: "North Indian, Punjabi",
    isOpen: true,
    description: "Traditional North Indian cuisine with rich flavors.",
    location: { lat: 28.5500, lng: 77.2500 }, // Farther away
    deliveryRadius: 10,
    menu: [
      { id: 301, name: "Butter Chicken", price: 280, desc: "Chicken cooked in a smooth buttery and creamy tomato sauce.", image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=200&q=80", veg: false, isAvailable: true },
      { id: 302, name: "Dal Makhani", price: 190, desc: "Black lentil cooked overnight with butter and cream.", image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=200&q=80", veg: true, isAvailable: true }
    ],
    coupons: [],
    reviews: []
  }
];

import { Rider } from './types';

export const INITIAL_RIDERS: Rider[] = [
  {
    id: 1,
    name: "Raju Delivery",
    mobile: "9988776655",
    password: "123",
    isOnline: true,
    earnings: { today: 450, week: 2100, total: 8500 },
    currentOrderId: null,
    rating: 4.8,
    totalRatings: 120
  }
];

export const INITIAL_ORDERS: Order[] = [
  { 
    id: "ORD9021", 
    restaurantId: 1, 
    items: [{name: "Crispy Veggie Burger", qty: 2, price: 120}], 
    total: 240, 
    status: "Pending", 
    time: "1:20 PM",
    customerName: "Test User",
    customerMobile: "9876543210",
    deliveryAddress: "123 Main St",
    paymentMethod: "Online",
    createdAt: Date.now()
  }
];
