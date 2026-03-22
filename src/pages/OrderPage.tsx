import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppShell } from "../components/AppShell";
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
      title="订单页"
      subtitle={`${date} 创建的订单明早可直接在备餐页查看。`}
      actions={
        <Link className="secondary-button compact-button" to={`/progress/${date}`}>
          配送页
        </Link>
      }
    >
      <section className="card">
        <div className="section-header">
          <div>
            <p className="section-eyebrow">订单概览</p>
            <h2>{date} 今日订单</h2>
            <p className="muted-text">{formatDisplayDate(date)}</p>
          </div>
          {savedHint ? <span className="success-hint">{savedHint}</span> : null}
        </div>

        {loading ? (
          <p className="muted-text">正在读取订单...</p>
        ) : draftItems.length === 0 ? (
          <div className="empty-card">
            <h3>这个日期还没有早餐单</h3>
            <p className="muted-text">你可以先去点餐页下单，或者直接从下面快速添加。</p>
          </div>
        ) : (
          <div className="stack-list">
            {draftItems.map((item, index) => (
              <article className="ticket-row" key={`${item.menuItemId ?? item.name}-${index}`}>
                <div>
                  <h3>{item.name}</h3>
                  <p className="muted-text">{item.description || item.note || "早餐备餐项"}</p>
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
                    删除
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
            <p className="section-eyebrow">快速添加</p>
            <h3>从当前菜单库继续补单</h3>
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
          <p className="tiny-text">修改后保存，会更新当前日期对应的订单内容。</p>
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
              setSavedHint("已保存");
              window.setTimeout(() => setSavedHint(""), 1600);
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? "保存中..." : "保存订单修改"}
        </button>
      </section>
    </AppShell>
  );
}
