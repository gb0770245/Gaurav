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
    name: "Aman Kumar", 
    mobile: "9876543210", 
    password: "123",
    addresses: [],
    walletBalance: 500
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
    menu: [
      { id: 101, name: "Classic Cheeseburger", price: 150, desc: "Juicy beef patty with melted cheese and fresh veggies.", image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=200&q=80", veg: false, isAvailable: true },
      { id: 102, name: "Crispy Veggie Burger", price: 120, desc: "Crispy potato and pea patty with house special sauce.", image: "https://images.unsplash.com/photo-1585238342024-78d387f4a707?auto=format&fit=crop&w=200&q=80", veg: true, isAvailable: true },
      { id: 103, name: "French Fries", price: 80, desc: "Golden crinkle cut salted fries.", image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=200&q=80", veg: true, isAvailable: true }
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
    menu: [
      { id: 201, name: "Margherita Pizza", price: 250, desc: "Classic delight with 100% real mozzarella cheese.", image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=200&q=80", veg: true, isAvailable: true },
      { id: 202, name: "Pepperoni Pizza", price: 350, desc: "Topped with spicy chicken pepperoni and cheese.", image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=200&q=80", veg: false, isAvailable: true }
    ]
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
    menu: [
      { id: 301, name: "Butter Chicken", price: 280, desc: "Chicken cooked in a smooth buttery and creamy tomato sauce.", image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=200&q=80", veg: false, isAvailable: true },
      { id: 302, name: "Dal Makhani", price: 190, desc: "Black lentil cooked overnight with butter and cream.", image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=200&q=80", veg: true, isAvailable: true }
    ]
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
    paymentMethod: "Online"
  }
];
