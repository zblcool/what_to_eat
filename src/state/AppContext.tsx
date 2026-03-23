import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren
} from "react";
import { getTodayDate } from "../lib/date";
import { getCategories, cartItemFromMenuItem, cartToOrderDraft, orderItemsCount } from "../lib/utils";
import { repository } from "../services/repository";
import type {
  CartItem,
  DailyOrder,
  MenuDraft,
  MenuItem,
  OrderDraftItem,
  OrderProgressStage,
  RepositoryStatus,
  RuntimeNotice,
  UserMode
} from "../types";

interface AppContextValue {
  mode: UserMode;
  setMode: (mode: UserMode) => void;
  managerUnlocked: boolean;
  unlockManager: (pinInput: string) => boolean;
  repositoryStatus: RepositoryStatus;
  runtimeNotice: RuntimeNotice | null;
  bootstrapping: boolean;
  menuItems: MenuItem[];
  categories: string[];
  refreshMenu: () => Promise<void>;
  saveMenuLibraryItem: (draft: MenuDraft) => Promise<MenuItem>;
  deleteMenuLibraryItem: (id: string) => Promise<void>;
  cart: CartItem[];
  cartCount: number;
  addMenuItemToCart: (item: MenuItem) => void;
  addCustomDishToCart: (draft: MenuDraft) => Promise<void>;
  updateCartItemQuantity: (cartItemId: string, quantity: number) => void;
  removeCartItem: (cartItemId: string) => void;
  clearCart: () => void;
  submitCartToTodayOrder: (customerNote?: string) => Promise<DailyOrder>;
  fetchOrderByDate: (date: string) => Promise<DailyOrder | null>;
  saveOrderItems: (
    date: string,
    items: OrderDraftItem[],
    customerNote?: string
  ) => Promise<DailyOrder>;
  addItemsToOrder: (
    date: string,
    items: OrderDraftItem[],
    customerNote?: string
  ) => Promise<DailyOrder>;
  setOrderItemQuantity: (
    date: string,
    itemId: string,
    quantity: number
  ) => Promise<DailyOrder | null>;
  removeOrderItem: (date: string, itemId: string) => Promise<DailyOrder | null>;
  togglePrepDone: (
    date: string,
    itemId: string,
    prepDone: boolean
  ) => Promise<DailyOrder | null>;
  setOrderStatus: (
    date: string,
    status: OrderProgressStage
  ) => Promise<DailyOrder | null>;
}

const AppContext = createContext<AppContextValue | null>(null);

const CART_STORAGE_KEY = "what-to-eat.cart.v1";
const MODE_STORAGE_KEY = "what-to-eat.mode.v1";
const MANAGER_SESSION_KEY = "what-to-eat.manage-session.v1";

function readLocalCart(): CartItem[] {
  const rawValue = localStorage.getItem(CART_STORAGE_KEY);
  if (!rawValue) {
    return [];
  }

  try {
    return JSON.parse(rawValue) as CartItem[];
  } catch (error) {
    console.error("Failed to parse cart cache", error);
    return [];
  }
}

function readLocalMode(): UserMode {
  const cached = localStorage.getItem(MODE_STORAGE_KEY);
  return cached === "manage" ? "manage" : "order";
}

export function AppProvider({ children }: PropsWithChildren) {
  const [bootstrapping, setBootstrapping] = useState(true);
  const [repositoryStatus] = useState<RepositoryStatus>(repository.getStatus());
  const [runtimeNotice, setRuntimeNotice] = useState<RuntimeNotice | null>(null);
  const [mode, setModeState] = useState<UserMode>(readLocalMode);
  const [managerUnlocked, setManagerUnlocked] = useState(
    sessionStorage.getItem(MANAGER_SESSION_KEY) === "unlocked"
  );
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>(readLocalCart);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        await repository.seedSampleMenuIfNeeded();
        const items = await repository.getMenuItems();
        if (!cancelled) {
          setMenuItems(items);
        }
      } catch (error) {
        if (!cancelled) {
          setRuntimeNotice({
            message:
              error instanceof Error ? error.message : "Failed to load menu data."
          });
        }
      } finally {
        if (!cancelled) {
          setBootstrapping(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshMenu() {
    try {
      const items = await repository.getMenuItems();
      setMenuItems(items);
      setRuntimeNotice(null);
    } catch (error) {
      setRuntimeNotice({
        message: error instanceof Error ? error.message : "Failed to refresh menu."
      });
      throw error;
    }
  }

  function setMode(nextMode: UserMode) {
    setModeState(nextMode);
  }

  function unlockManager(pinInput: string) {
    const managerPin = import.meta.env.VITE_MANAGER_PIN?.trim();
    if (!managerPin || pinInput.trim() === managerPin) {
      sessionStorage.setItem(MANAGER_SESSION_KEY, "unlocked");
      setManagerUnlocked(true);
      setModeState("manage");
      return true;
    }
    return false;
  }

  function addMenuItemToCart(item: MenuItem) {
    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (cartItem) => cartItem.menuItemId === item.id
      );

      if (existingItem) {
        return currentCart.map((cartItem) =>
          cartItem.menuItemId === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }

      return [...currentCart, cartItemFromMenuItem(item)];
    });
  }

  async function addCustomDishToCart(draft: MenuDraft) {
    if (draft.keepInLibrary) {
      try {
        const savedItem = await repository.saveMenuItem(draft);
        await refreshMenu();
        addMenuItemToCart(savedItem);
        setRuntimeNotice(null);
        return;
      } catch (error) {
        setRuntimeNotice({
          message:
            error instanceof Error ? error.message : "Failed to save dish."
        });
        throw error;
      }
    }

    const imageUrl = draft.file ? await repository.uploadImage(draft.file) : draft.imageUrl;

    setCart((currentCart) => [
      ...currentCart,
      {
        id: `adhoc-${Date.now()}`,
        name: draft.name.trim(),
        description: draft.description?.trim(),
        category: draft.category?.trim(),
        imageUrl,
        quantity: 1,
        note: draft.recipeNote?.trim(),
        source: "adhoc",
        keepInLibrary: false
      }
    ]);
  }

  function updateCartItemQuantity(cartItemId: string, quantity: number) {
    setCart((currentCart) =>
      currentCart
        .map((item) => (item.id === cartItemId ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0)
    );
  }

  function removeCartItem(cartItemId: string) {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== cartItemId)
    );
  }

  function clearCart() {
    setCart([]);
  }

  async function submitCartToTodayOrder(customerNote?: string) {
    try {
      const today = getTodayDate();
      const draftItems = cart.map(cartToOrderDraft);
      const order = await repository.addItemsToOrder(today, draftItems, customerNote);
      setCart([]);
      setRuntimeNotice(null);
      return order;
    } catch (error) {
      setRuntimeNotice({
        message:
          error instanceof Error ? error.message : "Failed to submit order."
      });
      throw error;
    }
  }

  async function fetchOrderByDate(date: string) {
    try {
      const order = await repository.getOrderByDate(date);
      setRuntimeNotice(null);
      return order;
    } catch (error) {
      setRuntimeNotice({
        message: error instanceof Error ? error.message : "Failed to load order."
      });
      throw error;
    }
  }

  async function saveOrderItems(
    date: string,
    items: OrderDraftItem[],
    customerNote?: string
  ) {
    try {
      const order = await repository.saveOrder(date, items, customerNote);
      setRuntimeNotice(null);
      return order;
    } catch (error) {
      setRuntimeNotice({
        message: error instanceof Error ? error.message : "Failed to save order."
      });
      throw error;
    }
  }

  async function addItemsToOrder(
    date: string,
    items: OrderDraftItem[],
    customerNote?: string
  ) {
    try {
      const order = await repository.addItemsToOrder(date, items, customerNote);
      setRuntimeNotice(null);
      return order;
    } catch (error) {
      setRuntimeNotice({
        message: error instanceof Error ? error.message : "Failed to add items."
      });
      throw error;
    }
  }

  async function saveMenuLibraryItem(draft: MenuDraft) {
    try {
      const savedItem = await repository.saveMenuItem(draft);
      await refreshMenu();
      setRuntimeNotice(null);
      return savedItem;
    } catch (error) {
      setRuntimeNotice({
        message: error instanceof Error ? error.message : "Failed to save menu item."
      });
      throw error;
    }
  }

  async function deleteMenuLibraryItem(id: string) {
    try {
      await repository.deleteMenuItem(id);
      await refreshMenu();
      setRuntimeNotice(null);
    } catch (error) {
      setRuntimeNotice({
        message:
          error instanceof Error ? error.message : "Failed to delete menu item."
      });
      throw error;
    }
  }

  async function setOrderItemQuantity(date: string, itemId: string, quantity: number) {
    try {
      const order = await repository.updateOrderItemQuantity(date, itemId, quantity);
      setRuntimeNotice(null);
      return order;
    } catch (error) {
      setRuntimeNotice({
        message:
          error instanceof Error ? error.message : "Failed to update quantity."
      });
      throw error;
    }
  }

  async function removeOrderItem(date: string, itemId: string) {
    try {
      const order = await repository.removeOrderItem(date, itemId);
      setRuntimeNotice(null);
      return order;
    } catch (error) {
      setRuntimeNotice({
        message: error instanceof Error ? error.message : "Failed to remove item."
      });
      throw error;
    }
  }

  async function togglePrepDone(date: string, itemId: string, prepDone: boolean) {
    try {
      const order = await repository.togglePrepDone(date, itemId, prepDone);
      setRuntimeNotice(null);
      return order;
    } catch (error) {
      setRuntimeNotice({
        message:
          error instanceof Error ? error.message : "Failed to update prep state."
      });
      throw error;
    }
  }

  async function setOrderStatus(date: string, status: OrderProgressStage) {
    try {
      const order = await repository.setOrderStatus(date, status);
      setRuntimeNotice(null);
      return order;
    } catch (error) {
      setRuntimeNotice({
        message:
          error instanceof Error ? error.message : "Failed to update progress."
      });
      throw error;
    }
  }

  const value: AppContextValue = {
    mode,
    setMode,
    managerUnlocked,
    unlockManager,
    repositoryStatus,
    runtimeNotice,
    bootstrapping,
    menuItems,
    categories: getCategories(menuItems),
    refreshMenu,
    saveMenuLibraryItem,
    deleteMenuLibraryItem,
    cart,
    cartCount: orderItemsCount(cart),
    addMenuItemToCart,
    addCustomDishToCart,
    updateCartItemQuantity,
    removeCartItem,
    clearCart,
    submitCartToTodayOrder,
    fetchOrderByDate,
    saveOrderItems,
    addItemsToOrder,
    setOrderItemQuantity,
    removeOrderItem,
    togglePrepDone,
    setOrderStatus
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
