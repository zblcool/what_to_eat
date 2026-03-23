export type UserMode = "order" | "manage";

export type OrderProgressStage =
  | "submitted"
  | "accepted"
  | "cooking"
  | "almost-ready"
  | "delivered";

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  recipeNote?: string;
  keepInLibrary: boolean;
  createdByMode: UserMode;
  archived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  menuItemId?: string;
  name: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  quantity: number;
  note?: string;
  source: "menu" | "adhoc";
  keepInLibrary: boolean;
}

export interface OrderItem {
  id: string;
  menuItemId?: string;
  name: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  quantity: number;
  note?: string;
  prepDone: boolean;
  source: "menu" | "adhoc";
  keepInLibrary: boolean;
}

export interface DailyOrder {
  id: string;
  orderDate: string;
  label: string;
  status: OrderProgressStage;
  customerNote?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface MenuDraft {
  id?: string;
  name: string;
  description?: string;
  category?: string;
  recipeNote?: string;
  keepInLibrary: boolean;
  imageUrl?: string;
  file?: File | null;
  createdByMode: UserMode;
}

export interface OrderDraftItem {
  menuItemId?: string;
  name: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  quantity: number;
  note?: string;
  source: "menu" | "adhoc";
  keepInLibrary: boolean;
}

export interface RepositoryStatus {
  source: "firebase" | "local";
  setupMessage?: string;
}

export interface AppRepository {
  getStatus(): RepositoryStatus;
  seedSampleMenuIfNeeded(): Promise<void>;
  getMenuItems(): Promise<MenuItem[]>;
  saveMenuItem(draft: MenuDraft): Promise<MenuItem>;
  deleteMenuItem(id: string): Promise<void>;
  uploadImage(file: File): Promise<string>;
  getOrderByDate(date: string): Promise<DailyOrder | null>;
  saveOrder(
    date: string,
    items: OrderDraftItem[],
    customerNote?: string
  ): Promise<DailyOrder>;
  updateOrderItemQuantity(
    date: string,
    itemId: string,
    quantity: number
  ): Promise<DailyOrder | null>;
  removeOrderItem(date: string, itemId: string): Promise<DailyOrder | null>;
  addItemsToOrder(
    date: string,
    items: OrderDraftItem[],
    customerNote?: string
  ): Promise<DailyOrder>;
  togglePrepDone(
    date: string,
    itemId: string,
    prepDone: boolean
  ): Promise<DailyOrder | null>;
  setOrderStatus(
    date: string,
    status: OrderProgressStage
  ): Promise<DailyOrder | null>;
}

export interface RuntimeNotice {
  message: string;
}
