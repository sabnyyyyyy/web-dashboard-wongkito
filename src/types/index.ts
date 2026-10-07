export interface User {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'kasir';
  avatar?: string;
  shift?: string;
}

export type MenuCategory = 'all' | 'kopi' | 'non-kopi' | 'makanan' | 'cemilan' | 'signature';

export interface MenuItem {
  id: string;
  name: string;
  category: 'kopi' | 'non-kopi' | 'makanan' | 'cemilan' | 'signature';
  price: number;
  costPrice: number;
  description: string;
  image: string;
  isAvailable: boolean;
  stock: number;
  popular?: boolean;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

export type OrderStatus = 'pending' | 'processing' | 'ready' | 'completed' | 'cancelled';
export type OrderType = 'dine_in' | 'takeaway' | 'delivery';
export type PaymentMethod = 'cash' | 'qris' | 'transfer' | 'debit';

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  tableNumber?: string;
  orderType: OrderType;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid' | 'unpaid';
  amountPaid: number;
  change: number;
  status: OrderStatus;
  createdAt: string;
  cashierName: string;
  notes?: string;
}

export interface StockItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  costPerUnit: number;
  supplier: string;
  lastRestocked: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  address: string;
  phone: string;
  taxRate: number; // in percentage e.g. 10
  serviceChargeRate: number;
  receiptHeader: string;
  receiptFooter: string;
  wifiPassword?: string;
  openHours: string;
}

export interface AttendanceRecord {
  id: string;
  staffName: string;
  role: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Terlambat';
  avatar?: string;
}

export interface CashierTeamMember {
  id: string;
  initials: string;
  name: string;
  phone: string;
  shift: string;
  username: string;
  status: 'Aktif' | 'Nonaktif';
}


