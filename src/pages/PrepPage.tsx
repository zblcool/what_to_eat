import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { ModeGate } from "../components/ModeGate";
import { useApp } from "../state/AppContext";
import { formatDisplayDate, getYesterdayDate } from "../lib/date";
import type { DailyOrder, MenuItem } from "../types";

function resolveRecipeNote(itemId: string | undefined, menuItems: MenuItem[]) {
  if (!itemId) {
    return "";
  }

  return menuItems.find((item) => item.id === itemId)?.recipeNote ?? "";
}

export function PrepPage() {
  const { fetchOrderByDate, menuItems, togglePrepDone } = useApp();
  const [selectedDate, setSelectedDate] = useState(getYesterdayDate());
  const [order, setOrder] = useState<DailyOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadOrder() {
      setLoading(true);
      const currentOrder = await fetchOrderByDate(selectedDate);
      if (!cancelled) {
        setOrder(currentOrder);
        setLoading(false);
      }
    }

    void loadOrder();

    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const completedCount = order?.items.filter((item) => item.prepDone).length ?? 0;

  return (
    <AppShell
      title="备餐 / 出单"
      subtitle="默认打开前一天的订单，用小票式清单帮助第二天早上少漏做。"
    >
      <ModeGate
        title="备餐页需要做饭模式"
        description="这里会显示前一天的订单小票、备餐清单和完成勾选。"
      >
        <section className="card">
          <div className="section-header">
            <div>
              <p className="section-eyebrow">日期切换</p>
              <h2>选择要查看的订单</h2>
            </div>
          </div>
          <label className="field inline-field">
            <span>订单日期</span>
            <input
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              type="date"
            />
          </label>
        </section>

        <section className="receipt-card">
          <div className="receipt-header">
            <p className="section-eyebrow">厨房出单票</p>
            <h2>{selectedDate} 今日订单</h2>
            <p className="muted-text">{formatDisplayDate(selectedDate)}</p>
          </div>

          {loading ? (
            <p className="muted-text">正在读取订单...</p>
          ) : !order || order.items.length === 0 ? (
            <div className="empty-card">
              <h3>这一天没有早餐单</h3>
              <p className="muted-text">可以切换其他日期查看历史订单。</p>
            </div>
          ) : (
            <>
              <div className="receipt-meta">
                <span>总项数 {order.items.length}</span>
                <span>已完成 {completedCount}</span>
              </div>
              <div className="receipt-list">
                {order.items.map((item) => (
                  <label className="receipt-item" key={item.id}>
                    <input
                      checked={item.prepDone}
                      onChange={async (event) => {
                        const updatedOrder = await togglePrepDone(
                          selectedDate,
                          item.id,
                          event.target.checked
                        );
                        setOrder(updatedOrder);
                      }}
                      type="checkbox"
                    />
                    <div className="receipt-item-copy">
                      <div className="receipt-title-row">
                        <h3>{item.name}</h3>
                        <strong>x {item.quantity}</strong>
                      </div>
                      <p className="muted-text">
                        {item.note ||
                          resolveRecipeNote(item.menuItemId, menuItems) ||
                          item.description ||
                          "暂无备注"}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}
        </section>
      </ModeGate>
    </AppShell>
  );
}
