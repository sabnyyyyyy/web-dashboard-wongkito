'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSWRConfig } from 'swr';
import { MenuItem, Order, StockItem, StoreSettings, CartItem, OrderStatus, OrderType, PaymentMethod, DashboardTab } from '@/types';
import { playChime } from '@/utils/format';
import { api, ApiError } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { menuKey, useMenu } from '@/hooks/useMenu';
import { stockKey, useStock } from '@/hooks/useStock';

// Menu, orders, stock and settings live in the database (/api/*); this context loads them after
// login and sends every change to the server. Only the POS cart and UI state stay in the browser.

export type { DashboardTab };

const DASHBOARD_TABS: readonly DashboardTab[] = [
  'dashboard',
  'overview',
  'pos',
  'orders',
  'menu',
  'inventory',
  'reports',
  'attendance',
  'team',
  'notifications',
  'profile',
  'settings',
];

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'order' | 'stock' | 'system';
  isRead: boolean;
}

export interface NewOrder {
  customerName: string;
  tableNumber?: string;
  orderType: OrderType;
  items: CartItem[];
  discount: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  notes?: string;
}

export type StockItemInput = Pick<
  StockItem,
  'name' | 'category' | 'unit' | 'currentStock' | 'minStock' | 'costPerUnit' | 'supplier'
>;

interface AppContextType {
  // Navigation
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  isOpenStore: boolean;
  setIsOpenStore: (open: boolean) => void;

  // True until the first load after login has finished.
  isDataLoading: boolean;

  // Menu (writes are owner-only on the server). Each mutation resolves to false when it failed;
  // the error has then already been shown to the user.
  menuItems: MenuItem[];
  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<boolean>;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => Promise<boolean>;
  deleteMenuItem: (id: string) => Promise<boolean>;
  toggleMenuAvailability: (id: string) => Promise<boolean>;

  // Orders
  orders: Order[];
  createOrder: (order: NewOrder) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => Promise<boolean>;

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
  addStockItem: (item: StockItemInput) => Promise<boolean>;
  updateStockItem: (id: string, updates: Partial<StockItem>) => Promise<boolean>;

  // Settings (owner-only writes)
  settings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<boolean>;

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

// Placeholder until /api/settings answers; the dashboard layout waits for that first load.
const EMPTY_SETTINGS: StoreSettings = {
  storeName: '',
  tagline: '',
  address: '',
  phone: '',
  taxRate: 0,
  serviceChargeRate: 0,
  receiptHeader: '',
  receiptFooter: '',
  wifiPassword: '',
  openHours: '',
};

// How often open dashboards pick up orders taken on another device.
const ORDER_REFRESH_MS = 15_000;

// Stable empty references so consumers do not re-render on every provider render.
const EMPTY_MENU: MenuItem[] = [];
const EMPTY_STOCK: StockItem[] = [];

const showError = (err: unknown) => {
  playChime('alert');
  alert(err instanceof Error ? err.message : 'Terjadi kesalahan. Coba lagi.');
};

const replaceById = <T extends { id: string }>(list: T[], item: T): T[] =>
  list.map((existing) => (existing.id === item.id ? item : existing));

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // SWR owns menu and stock. Keys include loginId so no data is shared between accounts.
  const loginId = user?.loginId ?? null;
  const menu = useMenu(loginId);
  const stock = useStock(loginId);
  const { mutate: mutateGlobal } = useSWRConfig();
  const previousLoginIdRef = useRef<string | null>(null);

  // Every tab is its own route (/pos, /team, ...), so the active tab is read from the URL.
  const router = useRouter();
  const pathname = usePathname();
  const segment = pathname.split('/')[1] as DashboardTab;
  const activeTab: DashboardTab = DASHBOARD_TABS.includes(segment) ? segment : 'dashboard';
  const setActiveTab = useCallback(
    (tab: DashboardTab) => router.push(tab === 'overview' ? '/dashboard' : `/${tab}`),
    [router]
  );
  const [isOpenStore, setIsOpenStore] = useState<boolean>(true);

  // Only orders and settings still use local state. Menu and stock come from SWR below.
  const [isCoreLoading, setIsCoreLoading] = useState<boolean>(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(EMPTY_SETTINGS);

  const menuItems = loginId ? (menu.data ?? EMPTY_MENU) : EMPTY_MENU;
  const stockItems = loginId ? (stock.data ?? EMPTY_STOCK) : EMPTY_STOCK;
  const menuMutate = menu.mutate;
  const stockMutate = stock.mutate;

  const menuErrorKey = menu.error ? `${menu.error.status}:${menu.error.message}` : null;
  const stockErrorKey = stock.error ? `${stock.error.status}:${stock.error.message}` : null;
  const lastMenuErrorKey = useRef<string | null>(null);
  const lastStockErrorKey = useRef<string | null>(null);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOrderType, setCartOrderType] = useState<OrderType>('dine_in');
  const [cartTableNumber, setCartTableNumber] = useState<string>('Meja 01');
  const [cartCustomerName, setCartCustomerName] = useState<string>('Pelanggan');
  const [cartDiscount, setCartDiscount] = useState<number>(0);

  // Receipt
  const [lastCompletedOrder, setLastCompletedOrder] = useState<Order | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  // Notifications (kept in the browser for this session)
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Load the remaining non-SWR data once per login; reset on logout/account switch.
  // SWR owns menu and stock, so they are intentionally not fetched here anymore.
  useEffect(() => {
    previousLoginIdRef.current = loginId;
    if (!loginId) return;

    let cancelled = false;

    Promise.all([api<{ orders: Order[] }>('/api/orders'), api<{ settings: StoreSettings }>('/api/settings')])
      .then(([ordersRes, settingsRes]) => {
        if (cancelled) return;
        setOrders(ordersRes.orders);
        setSettings(settingsRes.settings);
      })
      .catch((err) => {
        if (!cancelled && !(err instanceof ApiError && err.status === 401)) showError(err);
      })
      .finally(() => {
        if (!cancelled) setIsCoreLoading(false);
      });

    const refresh = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      api<{ orders: Order[] }>('/api/orders')
        .then((res) => {
          if (!cancelled) setOrders(res.orders);
        })
        .catch(() => {
          // Background refresh; the next user action will surface any real problem.
        });
    }, ORDER_REFRESH_MS);

    return () => {
      cancelled = true;
      clearInterval(refresh);
      setIsCoreLoading(true);
      setOrders([]);
      setCart([]);
      setNotifications([]);

      // Clear SWR entries of the account we are leaving. Never revalidate while clearing.
      const staleLoginId = previousLoginIdRef.current;
      if (staleLoginId) {
        void mutateGlobal(menuKey(staleLoginId), undefined, { revalidate: false });
        void mutateGlobal(stockKey(staleLoginId), undefined, { revalidate: false });
      }
    };
  }, [loginId, mutateGlobal]);

  // SWR exposes errors as state. Show each distinct error once; ignore session loss handled by auth.
  useEffect(() => {
    if (!menuErrorKey) {
      lastMenuErrorKey.current = null;
      return;
    }
    if (lastMenuErrorKey.current === menuErrorKey) return;
    lastMenuErrorKey.current = menuErrorKey;
    if (menu.error && menu.error.status !== 401) showError(menu.error);
  }, [menuErrorKey, menu.error]);

  useEffect(() => {
    if (!stockErrorKey) {
      lastStockErrorKey.current = null;
      return;
    }
    if (lastStockErrorKey.current === stockErrorKey) return;
    lastStockErrorKey.current = stockErrorKey;
    if (stock.error && stock.error.status !== 401) showError(stock.error);
  }, [stockErrorKey, stock.error]);

  // An SWR error resolves the waiting state instead of leaving the dashboard loading forever.
  // While logged out there is no dashboard data to wait for.
  const waitingForCore = !!loginId && isCoreLoading;
  const waitingForSWR =
    !!loginId && ((menu.data === undefined && !menu.error) || (stock.data === undefined && !stock.error));
  const isDataLoading = waitingForCore || waitingForSWR;

  // Menu Methods
  const saveMenuItem = async (id: string | null, item: Omit<MenuItem, 'id'>): Promise<boolean> => {
    try {
      const { item: saved } = await api<{ item: MenuItem }>(id ? `/api/menu/${encodeURIComponent(id)}` : '/api/menu', {
        method: id ? 'PUT' : 'POST',
        body: item,
      });
      await menuMutate(
        (current) => (id ? replaceById(current ?? [], saved) : [...(current ?? []), saved]),
        { revalidate: true }
      );
      return true;
    } catch (err) {
      showError(err);
      return false;
    }
  };

  const addMenuItem = (item: Omit<MenuItem, 'id'>) => saveMenuItem(null, item);

  const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    const current = menuItems.find((m) => m.id === id);
    if (!current) return false;
    const { id: _id, ...rest } = { ...current, ...updates };
    return saveMenuItem(id, rest);
  };

  const deleteMenuItem = async (id: string) => {
    try {
      await api(`/api/menu/${encodeURIComponent(id)}`, { method: 'DELETE' });
      await menuMutate((current) => (current ?? []).filter((item) => item.id !== id), { revalidate: true });
      return true;
    } catch (err) {
      showError(err);
      return false;
    }
  };

  const toggleMenuAvailability = (id: string) => {
    const current = menuItems.find((m) => m.id === id);
    return current ? updateMenuItem(id, { isAvailable: !current.isAvailable }) : Promise.resolve(false);
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

  // Orders Methods. The server recalculates prices, tax and change and takes the portions off stock.
  const createOrder = async (order: NewOrder): Promise<Order | null> => {
    let newOrder: Order;
    try {
      ({ order: newOrder } = await api<{ order: Order }>('/api/orders', {
        method: 'POST',
        body: {
          customerName: order.customerName,
          tableNumber: order.tableNumber,
          orderType: order.orderType,
          items: order.items.map((ci) => ({ menuItemId: ci.menuItem.id, quantity: ci.quantity, notes: ci.notes ?? '' })),
          discount: order.discount,
          paymentMethod: order.paymentMethod,
          amountPaid: order.amountPaid,
          notes: order.notes ?? '',
        },
      }));
    } catch (err) {
      showError(err);
      return null;
    }

    setOrders((prev) => [newOrder, ...prev]);
    // The checkout response contains menu items returned after the stock deduction.
    // Patch the SWR cache with those authoritative numbers; revalidate only if they are missing.
    const hasFreshMenuStock = newOrder.items.every((ci) => typeof ci.menuItem?.stock === 'number');
    if (hasFreshMenuStock && menu.data) {
      await menuMutate(
        (current) =>
          (current ?? []).map((m) => {
            const sold = newOrder.items.find((ci) => ci.menuItem.id === m.id);
            return sold ? sold.menuItem : m;
          }),
        { revalidate: false }
      );
    } else {
      void menuMutate();
    }
    setLastCompletedOrder(newOrder);
    setShowReceiptModal(true);
    clearCart();

    setNotifications((prev) => [
      {
        id: 'notif-' + newOrder.id,
        title: 'Transaksi Sukses!',
        message: `${newOrder.orderNumber} • ${newOrder.customerName} (${newOrder.items.length} item)`,
        time: 'Baru saja',
        type: 'order',
        isRead: false,
      },
      ...prev,
    ]);

    return newOrder;
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { order } = await api<{ order: Order }>(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        body: { status: newStatus },
      });
      setOrders((prev) => replaceById(prev, order));
      if (newStatus === 'cancelled') {
        // Cancelling returned the portions to the menu stock; revalidate the SWR cache.
        void menuMutate();
      }
      return true;
    } catch (err) {
      showError(err);
      return false;
    }
  };

  // Stock Methods
  const addStockItem = async (item: StockItemInput) => {
    try {
      const { item: saved } = await api<{ item: StockItem }>('/api/stock', { method: 'POST', body: item });
      await stockMutate((current) => [...(current ?? []), saved].sort((a, b) => a.name.localeCompare(b.name)), {
        revalidate: true,
      });
      return true;
    } catch (err) {
      showError(err);
      return false;
    }
  };

  const updateStockItem = async (id: string, updates: Partial<StockItem>) => {
    const current = stockItems.find((s) => s.id === id);
    if (!current) return false;
    try {
      const { item: saved } = await api<{ item: StockItem }>(`/api/stock/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: { ...current, ...updates },
      });
      await stockMutate((current) => replaceById(current ?? [], saved), { revalidate: true });
      return true;
    } catch (err) {
      showError(err);
      return false;
    }
  };

  // Settings
  const updateSettings = async (newSettings: Partial<StoreSettings>) => {
    try {
      const { settings: saved } = await api<{ settings: StoreSettings }>('/api/settings', {
        method: 'PUT',
        body: { ...settings, ...newSettings },
      });
      setSettings(saved);
      return true;
    } catch (err) {
      showError(err);
      return false;
    }
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
        isDataLoading,
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
        addStockItem,
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
