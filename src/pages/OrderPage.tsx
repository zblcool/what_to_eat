import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { LocalizedLink, useI18n } from "../i18n";
import { useApp } from "../state/AppContext";
import { formatDisplayDate, getTodayDate } from "../lib/date";
import type { DailyOrder, OrderDraftItem } from "../types";

function appendMenuItem(items: OrderDraftItem[], menuItem: Parameters<typeof toDraftFromMenu>[0]) {
  const existingIndex = items.findIndex(
    (item) => item.menuItemId === menuItem.id
  );

  if (existingIndex >= 0) {
    return items.map((item, index) =>
      index === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
    );
  }

  return [...items, toDraftFromMenu(menuItem)];
}

function toDraftFromMenu(menuItem: {
  id: string;
  name: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  keepInLibrary: boolean;
}) {
  return {
    menuItemId: menuItem.id,
    name: menuItem.name,
    description: menuItem.description,
    category: menuItem.category,
    imageUrl: menuItem.imageUrl,
    quantity: 1,
    source: "menu" as const,
    keepInLibrary: menuItem.keepInLibrary
  };
}

export function OrderPage() {
  const { date = getTodayDate() } = useParams();
  const { fetchOrderByDate, menuItems, saveOrderItems } = useApp();
  const { text } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedHint, setSavedHint] = useState("");
  const [order, setOrder] = useState<DailyOrder | null>(null);
  const [draftItems, setDraftItems] = useState<OrderDraftItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadOrder() {
      setLoading(true);
      const currentOrder = await fetchOrderByDate(date);
      if (!cancelled) {
        setOrder(currentOrder);
        setDraftItems(
          (currentOrder?.items ?? []).map((item) => ({
            menuItemId: item.menuItemId,
            name: item.name,
            description: item.description,
            category: item.category,
            imageUrl: item.imageUrl,
            quantity: item.quantity,
            note: item.note,
            source: item.source,
            keepInLibrary: item.keepInLibrary
          }))
        );
        setLoading(false);
      }
    }

    void loadOrder();

    return () => {
      cancelled = true;
    };
  }, [date]);

  return (
    <AppShell
      title={text("订单页", "Order Details")}
      subtitle={text(
        `${date} 创建的订单明早可直接在备餐页查看。`,
        `The order created on ${date} will be ready for tomorrow's prep view.`
      )}
      actions={
        <LocalizedLink className="secondary-button compact-button" to={`/progress/${date}`}>
          {text("配送页", "Progress")}
        </LocalizedLink>
      }
    >
      <section className="card">
        <div className="section-header">
          <div>
            <p className="section-eyebrow">{text("订单概览", "Order Overview")}</p>
            <h2>{date} {text("今日订单", "Daily Order")}</h2>
            <p className="muted-text">{formatDisplayDate(date)}</p>
          </div>
          {savedHint ? <span className="success-hint">{savedHint}</span> : null}
        </div>

        {loading ? (
          <p className="muted-text">{text("正在读取订单...", "Loading order...")}</p>
        ) : draftItems.length === 0 ? (
          <div className="empty-card">
            <h3>{text("这个日期还没有早餐单", "No breakfast order for this date")}</h3>
            <p className="muted-text">{text("你可以先去点餐页下单，或者直接从下面快速添加。", "Start from the menu page, or use quick add below.")}</p>
          </div>
        ) : (
          <div className="stack-list">
            {draftItems.map((item, index) => (
              <article className="ticket-row" key={`${item.menuItemId ?? item.name}-${index}`}>
                <div>
                  <h3>{item.name}</h3>
                  <p className="muted-text">{item.description || item.note || text("早餐备餐项", "Breakfast prep item")}</p>
                </div>
                <div className="line-item-actions">
                  <div className="quantity-control">
                    <button
                      type="button"
                      onClick={() =>
                        setDraftItems((currentItems) =>
                          currentItems
                            .map((draftItem, draftIndex) =>
                              draftIndex === index
                                ? { ...draftItem, quantity: draftItem.quantity - 1 }
                                : draftItem
                            )
                            .filter((draftItem) => draftItem.quantity > 0)
                        )
                      }
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setDraftItems((currentItems) =>
                          currentItems.map((draftItem, draftIndex) =>
                            draftIndex === index
                              ? { ...draftItem, quantity: draftItem.quantity + 1 }
                              : draftItem
                          )
                        )
                      }
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() =>
                      setDraftItems((currentItems) =>
                        currentItems.filter((_, draftIndex) => draftIndex !== index)
                      )
                    }
                  >
                    {text("删除", "Remove")}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <p className="section-eyebrow">{text("快速添加", "Quick Add")}</p>
            <h3>{text("从当前菜单库继续补单", "Add more from the current menu")}</h3>
          </div>
        </div>
        <div className="quick-add-grid">
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className="quick-add-chip"
              onClick={() => setDraftItems((currentItems) => appendMenuItem(currentItems, item))}
            >
              <span>{item.name}</span>
              <strong>+1</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="sticky-action-card">
        <div>
          <p className="tiny-text">{text("修改后保存，会更新当前日期对应的订单内容。", "Save changes to update this date's order.")}</p>
        </div>
        <button
          type="button"
          className="primary-button"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              const savedOrder = await saveOrderItems(date, draftItems);
              setOrder(savedOrder);
              setSavedHint(text("已保存", "Saved"));
              window.setTimeout(() => setSavedHint(""), 1600);
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? text("保存中...", "Saving...") : text("保存订单修改", "Save Changes")}
        </button>
      </section>
    </AppShell>
  );
}
