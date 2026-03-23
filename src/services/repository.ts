import {
  type Database,
  get,
  ref as databaseRef,
  remove,
  set
} from "firebase/database";
import { db, ensureFirebaseReady, isFirebaseConfigured } from "../lib/firebase";
import { getTodayDate, nowIso, toOrderLabel } from "../lib/date";
import { sampleMenuItems } from "../lib/sampleData";
import { createId, mergeOrderItems, sortByUpdatedAt } from "../lib/utils";
import type {
  AppRepository,
  DailyOrder,
  MenuDraft,
  MenuItem,
  OrderDraftItem,
  OrderItem,
  OrderProgressStage,
  RepositoryStatus
} from "../types";

const LOCAL_MENU_KEY = "what-to-eat.menu.v1";
const LOCAL_ORDER_KEY = "what-to-eat.orders.v1";
const ROOT_PATH = "whatToEat";
const MENU_ITEMS_PATH = `${ROOT_PATH}/menuItems`;
const ORDERS_PATH = `${ROOT_PATH}/orders`;
const PERMISSION_HINT =
  "Firebase blocked access to whatToEat/*. Please allow this path in Realtime Database rules.";

function getDb(): Database {
  if (!db) {
    throw new Error("Realtime Database is not initialized.");
  }

  return db;
}

function toObjectMap<T extends { id: string }>(items: T[]) {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}

function fromObjectMap<T>(value: unknown): T[] {
  if (!value || typeof value !== "object") {
    return [];
  }

  return Object.values(value as Record<string, T>);
}

function normalizeRepositoryError(error: unknown): Error {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";

  if (/permission denied/i.test(message) || /permission_denied/i.test(message)) {
    return new Error(PERMISSION_HINT);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Operation failed.");
}

function getStatus(): RepositoryStatus {
  if (isFirebaseConfigured) {
    return {
      source: "firebase"
    };
  }

  return {
    source: "local",
    setupMessage: "未检测到 Firebase 配置，当前使用本地演示数据。"
  };
}

function readJson<T>(key: string, fallback: T): T {
  const rawValue = localStorage.getItem(key);
  if (!rawValue) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch (error) {
    console.error(`Failed to parse local storage key ${key}`, error);
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function normalizeCustomerNote(customerNote?: string) {
  const trimmed = customerNote?.trim();
  return trimmed ? trimmed : undefined;
}

function createOrder(
  date: string,
  items: OrderItem[],
  createdAt?: string,
  customerNote?: string
): DailyOrder {
  const now = nowIso();
  return {
    id: date,
    orderDate: date,
    label: toOrderLabel(date),
    status: "submitted",
    customerNote: normalizeCustomerNote(customerNote),
    items,
    createdAt: createdAt ?? now,
    updatedAt: now
  };
}

async function seedSampleMenuIfNeeded() {
  if (isFirebaseConfigured && db) {
    try {
      const database = getDb();
      await ensureFirebaseReady();
      const snapshot = await get(databaseRef(database, MENU_ITEMS_PATH));

      if (snapshot.exists()) {
        return;
      }

      await set(databaseRef(database, MENU_ITEMS_PATH), toObjectMap(sampleMenuItems));
      return;
    } catch (error) {
      throw normalizeRepositoryError(error);
    }
  }

  const existing = readJson<MenuItem[]>(LOCAL_MENU_KEY, []);
  if (existing.length > 0) {
    return;
  }

  writeJson(LOCAL_MENU_KEY, sampleMenuItems);
}

async function getMenuItems(): Promise<MenuItem[]> {
  if (isFirebaseConfigured && db) {
    try {
      const database = getDb();
      await ensureFirebaseReady();
      const snapshot = await get(databaseRef(database, MENU_ITEMS_PATH));
      return sortByUpdatedAt(fromObjectMap<MenuItem>(snapshot.val()));
    } catch (error) {
      throw normalizeRepositoryError(error);
    }
  }

  return sortByUpdatedAt(readJson<MenuItem[]>(LOCAL_MENU_KEY, []));
}

async function uploadImage(file: File): Promise<string> {
  return fileToDataUrl(file);
}

async function saveMenuItem(draft: MenuDraft): Promise<MenuItem> {
  const now = nowIso();
  const imageUrl = draft.file ? await uploadImage(draft.file) : draft.imageUrl;

  if (isFirebaseConfigured && db) {
    try {
      const database = getDb();
      await ensureFirebaseReady();
      const id = draft.id ?? createId("menu");
      const itemRef = databaseRef(database, `${MENU_ITEMS_PATH}/${id}`);
      let existingCreatedAt: string | undefined;

      try {
        const existing = await get(itemRef);
        existingCreatedAt = existing.exists()
          ? (existing.val() as MenuItem).createdAt
          : undefined;
      } catch (error) {
        if (!/permission denied/i.test(error instanceof Error ? error.message : "")) {
          throw error;
        }
      }

      const item: MenuItem = {
        id,
        name: draft.name.trim(),
        description: draft.description?.trim(),
        category: draft.category?.trim(),
        recipeNote: draft.recipeNote?.trim(),
        imageUrl,
        keepInLibrary: draft.keepInLibrary,
        createdByMode: draft.createdByMode,
        archived: false,
        createdAt: existingCreatedAt ?? now,
        updatedAt: now
      };
      await set(itemRef, item);
      return item;
    } catch (error) {
      throw normalizeRepositoryError(error);
    }
  }

  const currentItems = readJson<MenuItem[]>(LOCAL_MENU_KEY, []);
  const existingIndex = currentItems.findIndex((item) => item.id === draft.id);
  const currentItem = existingIndex >= 0 ? currentItems[existingIndex] : null;
  const item: MenuItem = {
    id: draft.id ?? createId("menu"),
    name: draft.name.trim(),
    description: draft.description?.trim(),
    category: draft.category?.trim(),
    recipeNote: draft.recipeNote?.trim(),
    imageUrl,
    keepInLibrary: draft.keepInLibrary,
    createdByMode: draft.createdByMode,
    archived: false,
    createdAt: currentItem?.createdAt ?? now,
    updatedAt: now
  };

  if (existingIndex >= 0) {
    currentItems.splice(existingIndex, 1, item);
  } else {
    currentItems.push(item);
  }

  writeJson(LOCAL_MENU_KEY, currentItems);
  return item;
}

async function deleteMenuItem(id: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      const database = getDb();
      await ensureFirebaseReady();
      await remove(databaseRef(database, `${MENU_ITEMS_PATH}/${id}`));
      return;
    } catch (error) {
      throw normalizeRepositoryError(error);
    }
  }

  const currentItems = readJson<MenuItem[]>(LOCAL_MENU_KEY, []);
  writeJson(
    LOCAL_MENU_KEY,
    currentItems.filter((item) => item.id !== id)
  );
}

function readLocalOrders(): Record<string, DailyOrder> {
  return readJson<Record<string, DailyOrder>>(LOCAL_ORDER_KEY, {});
}

function writeLocalOrders(orders: Record<string, DailyOrder>) {
  writeJson(LOCAL_ORDER_KEY, orders);
}

async function getOrderByDate(date: string): Promise<DailyOrder | null> {
  if (isFirebaseConfigured && db) {
    try {
      const database = getDb();
      await ensureFirebaseReady();
      const snapshot = await get(databaseRef(database, `${ORDERS_PATH}/${date}`));
      return snapshot.exists() ? (snapshot.val() as DailyOrder) : null;
    } catch (error) {
      throw normalizeRepositoryError(error);
    }
  }

  const orders = readLocalOrders();
  return orders[date] ?? null;
}

async function saveOrder(
  date: string,
  items: OrderDraftItem[],
  customerNote?: string
): Promise<DailyOrder> {
  const orderItems: OrderItem[] = items
    .filter((item) => item.quantity > 0)
    .map((item) => ({
      id: createId("order-item"),
      menuItemId: item.menuItemId,
      name: item.name,
      description: item.description,
      category: item.category,
      imageUrl: item.imageUrl,
      quantity: item.quantity,
      note: item.note,
      prepDone: false,
      source: item.source,
      keepInLibrary: item.keepInLibrary
    }));

  if (isFirebaseConfigured && db) {
    try {
      const database = getDb();
      await ensureFirebaseReady();
      const orderRef = databaseRef(database, `${ORDERS_PATH}/${date}`);
      const existing = await get(orderRef);
      const existingOrder = existing.exists() ? (existing.val() as DailyOrder) : null;
      const order = createOrder(
        date,
        orderItems,
        existingOrder?.createdAt,
        customerNote ?? existingOrder?.customerNote
      );
      order.status = existingOrder?.status ?? "submitted";
      await set(orderRef, order);
      return order;
    } catch (error) {
      throw normalizeRepositoryError(error);
    }
  }

  const orders = readLocalOrders();
  const existingOrder = orders[date];
  const order = createOrder(
    date,
    orderItems,
    existingOrder?.createdAt,
    customerNote ?? existingOrder?.customerNote
  );
  order.status = existingOrder?.status ?? "submitted";
  orders[date] = order;
  writeLocalOrders(orders);
  return order;
}

async function addItemsToOrder(
  date: string,
  items: OrderDraftItem[],
  customerNote?: string
): Promise<DailyOrder> {
  const existingOrder = await getOrderByDate(date);
  const mergedItems = mergeOrderItems(existingOrder?.items ?? [], items);
  const order = createOrder(
    date,
    mergedItems,
    existingOrder?.createdAt,
    customerNote ?? existingOrder?.customerNote
  );
  order.status = existingOrder?.status ?? "submitted";

  if (isFirebaseConfigured && db) {
    try {
      const database = getDb();
      await ensureFirebaseReady();
      await set(databaseRef(database, `${ORDERS_PATH}/${date}`), order);
      return order;
    } catch (error) {
      throw normalizeRepositoryError(error);
    }
  }

  const orders = readLocalOrders();
  orders[date] = order;
  writeLocalOrders(orders);
  return order;
}

async function updateExistingOrder(
  date: string,
  updater: (order: DailyOrder) => DailyOrder | null
): Promise<DailyOrder | null> {
  const existingOrder = await getOrderByDate(date);
  if (!existingOrder) {
    return null;
  }

  const updatedOrder = updater(existingOrder);
  if (!updatedOrder) {
    return null;
  }

  updatedOrder.updatedAt = nowIso();

  if (isFirebaseConfigured && db) {
    try {
      const database = getDb();
      await ensureFirebaseReady();
      await set(databaseRef(database, `${ORDERS_PATH}/${date}`), updatedOrder);
      return updatedOrder;
    } catch (error) {
      throw normalizeRepositoryError(error);
    }
  }

  const orders = readLocalOrders();
  orders[date] = updatedOrder;
  writeLocalOrders(orders);
  return updatedOrder;
}

async function updateOrderItemQuantity(
  date: string,
  itemId: string,
  quantity: number
): Promise<DailyOrder | null> {
  return updateExistingOrder(date, (order) => ({
    ...order,
    items: order.items
      .map((item) => (item.id === itemId ? { ...item, quantity } : item))
      .filter((item) => item.quantity > 0)
  }));
}

async function removeOrderItem(date: string, itemId: string): Promise<DailyOrder | null> {
  return updateExistingOrder(date, (order) => ({
    ...order,
    items: order.items.filter((item) => item.id !== itemId)
  }));
}

async function togglePrepDone(
  date: string,
  itemId: string,
  prepDone: boolean
): Promise<DailyOrder | null> {
  return updateExistingOrder(date, (order) => ({
    ...order,
    items: order.items.map((item) =>
      item.id === itemId ? { ...item, prepDone } : item
    )
  }));
}

async function setOrderStatus(
  date: string,
  status: OrderProgressStage
): Promise<DailyOrder | null> {
  return updateExistingOrder(date, (order) => ({
    ...order,
    status
  }));
}

async function ensureTodayOrderExists(): Promise<void> {
  const today = getTodayDate();
  const currentOrder = await getOrderByDate(today);
  if (currentOrder) {
    return;
  }
  await saveOrder(today, []);
}

export const repository: AppRepository & {
  ensureTodayOrderExists: () => Promise<void>;
} = {
  getStatus,
  seedSampleMenuIfNeeded,
  getMenuItems,
  saveMenuItem,
  deleteMenuItem,
  uploadImage,
  getOrderByDate,
  saveOrder,
  updateOrderItemQuantity,
  removeOrderItem,
  addItemsToOrder,
  togglePrepDone,
  setOrderStatus,
  ensureTodayOrderExists
};
