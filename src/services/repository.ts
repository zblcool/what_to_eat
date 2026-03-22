import {
  type Firestore,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc
} from "firebase/firestore";
import { getDownloadURL, ref, type FirebaseStorage, uploadBytes } from "firebase/storage";
import { db, ensureFirebaseReady, isFirebaseConfigured, storage } from "../lib/firebase";
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

function getDb(): Firestore {
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }

  return db;
}

function getStorageInstance(): FirebaseStorage {
  if (!storage) {
    throw new Error("Storage is not initialized.");
  }

  return storage;
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

function createOrder(date: string, items: OrderItem[], createdAt?: string): DailyOrder {
  const now = nowIso();
  return {
    id: date,
    orderDate: date,
    label: toOrderLabel(date),
    status: "submitted",
    items,
    createdAt: createdAt ?? now,
    updatedAt: now
  };
}

async function seedSampleMenuIfNeeded() {
  if (isFirebaseConfigured && db) {
    const firestore = getDb();
    await ensureFirebaseReady();
    const snapshot = await getDocs(query(collection(firestore, "menuItems")));

    if (!snapshot.empty) {
      return;
    }

    await Promise.all(
      sampleMenuItems.map((item) =>
        setDoc(doc(firestore, "menuItems", item.id), item)
      )
    );
    return;
  }

  const existing = readJson<MenuItem[]>(LOCAL_MENU_KEY, []);
  if (existing.length > 0) {
    return;
  }

  writeJson(LOCAL_MENU_KEY, sampleMenuItems);
}

async function getMenuItems(): Promise<MenuItem[]> {
  if (isFirebaseConfigured && db) {
    const firestore = getDb();
    await ensureFirebaseReady();
    const snapshot = await getDocs(query(collection(firestore, "menuItems")));
    return sortByUpdatedAt(snapshot.docs.map((item) => item.data() as MenuItem));
  }

  return sortByUpdatedAt(readJson<MenuItem[]>(LOCAL_MENU_KEY, []));
}

async function uploadImage(file: File): Promise<string> {
  if (isFirebaseConfigured && storage) {
    const firebaseStorage = getStorageInstance();
    await ensureFirebaseReady();
    const fileRef = ref(
      firebaseStorage,
      `menu-images/${Date.now()}-${file.name}`
    );
    await uploadBytes(fileRef, file);
    return getDownloadURL(fileRef);
  }

  return fileToDataUrl(file);
}

async function saveMenuItem(draft: MenuDraft): Promise<MenuItem> {
  const now = nowIso();
  const imageUrl = draft.file ? await uploadImage(draft.file) : draft.imageUrl;

  if (isFirebaseConfigured && db) {
    const firestore = getDb();
    await ensureFirebaseReady();
    const id = draft.id ?? createId("menu");
    const itemRef = doc(firestore, "menuItems", id);
    const existing = await getDoc(itemRef);
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
      createdAt: existing.exists() ? (existing.data() as MenuItem).createdAt : now,
      updatedAt: now
    };
    await setDoc(itemRef, item);
    return item;
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
    const firestore = getDb();
    await ensureFirebaseReady();
    await deleteDoc(doc(firestore, "menuItems", id));
    return;
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
    const firestore = getDb();
    await ensureFirebaseReady();
    const snapshot = await getDoc(doc(firestore, "orders", date));
    return snapshot.exists() ? (snapshot.data() as DailyOrder) : null;
  }

  const orders = readLocalOrders();
  return orders[date] ?? null;
}

async function saveOrder(date: string, items: OrderDraftItem[]): Promise<DailyOrder> {
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
    const firestore = getDb();
    await ensureFirebaseReady();
    const orderRef = doc(firestore, "orders", date);
    const existing = await getDoc(orderRef);
    const existingOrder = existing.exists() ? (existing.data() as DailyOrder) : null;
    const order = createOrder(date, orderItems, existingOrder?.createdAt);
    await setDoc(orderRef, order);
    return order;
  }

  const orders = readLocalOrders();
  const existingOrder = orders[date];
  const order = createOrder(date, orderItems, existingOrder?.createdAt);
  orders[date] = order;
  writeLocalOrders(orders);
  return order;
}

async function addItemsToOrder(date: string, items: OrderDraftItem[]): Promise<DailyOrder> {
  const existingOrder = await getOrderByDate(date);
  const mergedItems = mergeOrderItems(existingOrder?.items ?? [], items);
  const order = createOrder(date, mergedItems, existingOrder?.createdAt);
  order.status = existingOrder?.status ?? "submitted";

  if (isFirebaseConfigured && db) {
    const firestore = getDb();
    await ensureFirebaseReady();
    await setDoc(doc(firestore, "orders", date), order);
    return order;
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
    const firestore = getDb();
    await ensureFirebaseReady();
    await setDoc(doc(firestore, "orders", date), updatedOrder);
    return updatedOrder;
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
