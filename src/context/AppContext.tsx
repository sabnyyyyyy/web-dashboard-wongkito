'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  MenuItem,
  Order,
  StockItem,
  StoreSettings,
  CartItem,
  OrderStatus,
  OrderType,
  PaymentMethod,
} from '@/types';
import {
  INITIAL_MENU,
  INITIAL_ORDERS,
  INITIAL_STOCKS,
  INITIAL_STORE_SETTINGS,
} from '@/data/mockData';
import { playChime } from '@/utils/format';

export type DashboardTab =
  | 'dashboard'
  | 'overview'
  | 'pos'
  | 'orders'
  | 'menu'
  | 'inventory'
  | 'reports'
  | 'attendance'
  | 'team'
  | 'notifications'
  | 'profile'
  | 'settings';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'order' | 'stock' | 'system';
  isRead: boolean;
}

interface AppContextType {
  // Navigation
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  isOpenStore: boolean;
  setIsOpenStore: (open: boolean) => void;

  // Menu
  menuItems: MenuItem[];
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  toggleMenuAvailability: (id: string) => void;

  // Orders
  orders: Order[];
  createOrder: (orderData: {
    customerName: string;
    tableNumber?: string;
    orderType: OrderType;
    items: CartItem[];
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    paymentMethod: PaymentMethod;
    amountPaid: number;
    notes?: string;
    cashierName: string;
  }) => Order;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;

  // POS Cart
  cart: CartItem[];
  addToCart: (item: MenuItem, notes?: string) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, delta: number) => void;
  updateCartItemNotes: (itemId: string, notes: string) => void;
  clearCart: () => void;
  cartOrderType: OrderType;
  setCartOrderType: (type: OrderType) => void;
  cartTableNumber: string;
  setCartTableNumber: (table: string) => void;
  cartCustomerName: string;
  setCartCustomerName: (name: string) => void;
  cartDiscount: number;
  setCartDiscount: (discount: number) => void;

  // Stock
  stockItems: StockItem[];
  restockItem: (id: string, addedStock: number, totalCost: number) => void;
  updateStockItem: (id: string, updates: Partial<StockItem>) => void;

  // Settings
  settings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => void;

  // Receipt Modal
  lastCompletedOrder: Order | null;
  setLastCompletedOrder: (order: Order | null) => void;
  showReceiptModal: boolean;
  setShowReceiptModal: (show: boolean) => void;

  // Notifications
  notifications: AppNotification[];
  markAllNotificationsAsRead: () => void;
  unreadCount: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [isOpenStore, setIsOpenStore] = useState<boolean>(true);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [stockItems, setStockItems] = useState<StockItem[]>(INITIAL_STOCKS);
  const [settings, setSettings] = useState<StoreSettings>(INITIAL_STORE_SETTINGS);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOrderType, setCartOrderType] = useState<OrderType>('dine_in');
  const [cartTableNumber, setCartTableNumber] = useState<string>('Meja 01');
  const [cartCustomerName, setCartCustomerName] = useState<string>('Pelanggan');
  const [cartDiscount, setCartDiscount] = useState<number>(0);

  // Receipt
  const [lastCompletedOrder, setLastCompletedOrder] = useState<Order | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'notif-1',
      title: 'Pesanan Baru Masuk!',
      message: 'Pesanan WK-20261006-004 (Meja 02) menunggu disiapkan.',
      time: '10 menit yang lalu',
      type: 'order',
      isRead: false,
    },
    {
      id: 'notif-2',
      title: 'Peringatan Stok Menipis',
      message: 'Stok Ikan Tenggiri Giling sisa 3.2 Kg (di bawah batas 5 Kg).',
      time: '1 jam yang lalu',
      type: 'stock',
      isRead: false,
    },
  ]);

  // Load saved data from localStorage if present
  useEffect(() => {
    const savedMenu = localStorage.getItem('wongkito_menu');
    if (savedMenu) {
      try {
        setMenuItems(JSON.parse(savedMenu));
      } catch {
        // ignore
      }
    }
    const savedOrders = localStorage.getItem('wongkito_orders');
    if (savedOrders) {
      try {
        setOrders(JSON.parse(savedOrders));
      } catch {
        // ignore
      }
    }
  }, []);

  // Save changes
  useEffect(() => {
    localStorage.setItem('wongkito_menu', JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem('wongkito_orders', JSON.stringify(orders));
  }, [orders]);

  // Menu Methods
  const addMenuItem = (item: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = {
      ...item,
      id: 'm-' + Date.now(),
    };
    setMenuItems((prev) => [newItem, ...prev]);
  };

  const updateMenuItem = (id: string, updates: Partial<MenuItem>) => {
    setMenuItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const deleteMenuItem = (id: string) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleMenuAvailability = (id: string) => {
    setMenuItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isAvailable: !item.isAvailable } : item
      )
    );
  };

  // Cart Methods
  const addToCart = (item: MenuItem, notes?: string) => {
    playChime('click');
    setCart((prev) => {
      const existing = prev.find((ci) => ci.menuItem.id === item.id);
      if (existing) {
        return prev.map((ci) =>
          ci.menuItem.id === item.id
            ? { ...ci, quantity: ci.quantity + 1, notes: notes || ci.notes }
            : ci
        );
      }
      return [...prev, { menuItem: item, quantity: 1, notes: notes || '' }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((ci) => ci.menuItem.id !== itemId));
  };

  const updateCartQuantity = (itemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((ci) => {
          if (ci.menuItem.id === itemId) {
            const newQty = ci.quantity + delta;
            return newQty > 0 ? { ...ci, quantity: newQty } : null;
          }
          return ci;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const updateCartItemNotes = (itemId: string, notes: string) => {
    setCart((prev) =>
      prev.map((ci) => (ci.menuItem.id === itemId ? { ...ci, notes } : ci))
    );
  };

  const clearCart = () => {
    setCart([]);
    setCartDiscount(0);
  };

  // Orders Methods
  const createOrder = (orderData: {
    customerName: string;
    tableNumber?: string;
    orderType: OrderType;
    items: CartItem[];
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    paymentMethod: PaymentMethod;
    amountPaid: number;
    notes?: string;
    cashierName: string;
  }): Order => {
    const orderCount = orders.length + 1;
    const padCount = String(orderCount).padStart(3, '0');
    const orderNumber = `WK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${padCount}`;

    const change = Math.max(0, orderData.amountPaid - orderData.total);

    const newOrder: Order = {
      id: 'ord-' + Date.now(),
      orderNumber,
      customerName: orderData.customerName || 'Pelanggan',
      tableNumber: orderData.orderType === 'dine_in' ? orderData.tableNumber : undefined,
      orderType: orderData.orderType,
      items: orderData.items,
      subtotal: orderData.subtotal,
      tax: orderData.tax,
      discount: orderData.discount,
      total: orderData.total,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: 'paid',
      amountPaid: orderData.amountPaid,
      change,
      status: 'pending',
      createdAt: new Date().toISOString(),
      cashierName: orderData.cashierName,
      notes: orderData.notes,
    };

    setOrders((prev) => [newOrder, ...prev]);
    setLastCompletedOrder(newOrder);
    setShowReceiptModal(true);
    clearCart();

    // Add notification
    const newNotif: AppNotification = {
      id: 'notif-' + Date.now(),
      title: 'Transaksi Sukses!',
      message: `${orderNumber} • ${newOrder.customerName} (${newOrder.items.length} item)`,
      time: 'Baru saja',
      type: 'order',
      isRead: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    playChime('click');
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
    );
  };

  // Stock Methods
  const restockItem = (id: string, addedStock: number, _totalCost: number) => {
    setStockItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              currentStock: item.currentStock + addedStock,
              lastRestocked: new Date().toISOString().slice(0, 10),
            }
          : item
      )
    );
  };

  const updateStockItem = (id: string, updates: Partial<StockItem>) => {
    setStockItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  // Settings
  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isOpenStore,
        setIsOpenStore,
        menuItems,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        toggleMenuAvailability,
        orders,
        createOrder,
        updateOrderStatus,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        updateCartItemNotes,
        clearCart,
        cartOrderType,
        setCartOrderType,
        cartTableNumber,
        setCartTableNumber,
        cartCustomerName,
        setCartCustomerName,
        cartDiscount,
        setCartDiscount,
        stockItems,
        restockItem,
        updateStockItem,
        settings,
        updateSettings,
        lastCompletedOrder,
        setLastCompletedOrder,
        showReceiptModal,
        setShowReceiptModal,
        notifications,
        markAllNotificationsAsRead,
        unreadCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
