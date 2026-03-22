import type { CartItem, MenuItem, OrderDraftItem, OrderItem } from "../types";

export function createId(prefix = "id"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function sortByUpdatedAt<T extends { updatedAt: string }>(items: T[]): T[] {
  return [...items].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt)
  );
}

export function cartItemFromMenuItem(menuItem: MenuItem): CartItem {
  return {
    id: `menu-${menuItem.id}`,
    menuItemId: menuItem.id,
    name: menuItem.name,
    description: menuItem.description,
    category: menuItem.category,
    imageUrl: menuItem.imageUrl,
    quantity: 1,
    source: "menu",
    keepInLibrary: menuItem.keepInLibrary
  };
}

export function cartToOrderDraft(item: CartItem): OrderDraftItem {
  return {
    menuItemId: item.menuItemId,
    name: item.name,
    description: item.description,
    category: item.category,
    imageUrl: item.imageUrl,
    quantity: item.quantity,
    note: item.note,
    source: item.source,
    keepInLibrary: item.keepInLibrary
  };
}

function toMergeKey(item: Pick<OrderDraftItem, "menuItemId" | "name" | "source">) {
  return item.menuItemId ? `menu:${item.menuItemId}` : `${item.source}:${item.name.trim()}`;
}

export function mergeOrderItems(
  existingItems: OrderItem[],
  incomingItems: OrderDraftItem[]
): OrderItem[] {
  const map = new Map<string, OrderItem>();

  for (const item of existingItems) {
    map.set(toMergeKey(item), { ...item });
  }

  for (const item of incomingItems) {
    const key = toMergeKey(item);
    const current = map.get(key);

    if (current) {
      current.quantity += item.quantity;
      current.note = item.note ?? current.note;
      current.description = item.description ?? current.description;
      current.category = item.category ?? current.category;
      current.imageUrl = item.imageUrl ?? current.imageUrl;
      current.keepInLibrary = item.keepInLibrary;
    } else {
      map.set(key, {
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
      });
    }
  }

  return Array.from(map.values()).sort((left, right) =>
    left.name.localeCompare(right.name, "zh-CN")
  );
}

export function getCategories(menuItems: MenuItem[]): string[] {
  const categorySet = new Set(
    menuItems.map((item) => item.category).filter(Boolean) as string[]
  );

  return ["全部", ...Array.from(categorySet).sort((left, right) => left.localeCompare(right, "zh-CN"))];
}

export function orderItemsCount(items: Array<{ quantity: number }>): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
