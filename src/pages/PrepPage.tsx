import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { ModeGate } from "../components/ModeGate";
import { useI18n } from "../i18n";
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
  const { text } = useI18n();
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
      title={text("备餐 / 出单", "Prep / Kitchen Ticket")}
      subtitle={text(
        "默认打开前一天的订单，用小票式清单帮助第二天早上少漏做。",
        "By default, this page opens yesterday's order as a simple prep checklist."
      )}
    >
      <ModeGate
        title={text("备餐页需要做饭模式", "Prep view requires kitchen mode")}
        description={text(
          "这里会显示前一天的订单小票、备餐清单和完成勾选。",
          "This page shows yesterday's ticket, prep list, and completion checklist."
        )}
      >
        <section className="card">
          <div className="section-header">
            <div>
              <p className="section-eyebrow">{text("日期切换", "Date Switch")}</p>
              <h2>{text("选择要查看的订单", "Choose an order date")}</h2>
            </div>
          </div>
          <label className="field inline-field">
            <span>{text("订单日期", "Order Date")}</span>
            <input
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              type="date"
            />
          </label>
        </section>

        <section className="receipt-card">
          <div className="receipt-header">
            <p className="section-eyebrow">{text("厨房出单票", "Kitchen Ticket")}</p>
            <h2>{selectedDate} {text("今日订单", "Daily Order")}</h2>
            <p className="muted-text">{formatDisplayDate(selectedDate)}</p>
          </div>

          {loading ? (
            <p className="muted-text">{text("正在读取订单...", "Loading order...")}</p>
          ) : !order || order.items.length === 0 ? (
            <div className="empty-card">
              <h3>{text("这一天没有早餐单", "No breakfast order for this date")}</h3>
              <p className="muted-text">{text("可以切换其他日期查看历史订单。", "Switch to another date to view history.")}</p>
            </div>
          ) : (
            <>
              <div className="receipt-meta">
                <span>{text(`总项数 ${order.items.length}`, `${order.items.length} items`)}</span>
                <span>{text(`已完成 ${completedCount}`, `${completedCount} done`)}</span>
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
                          text("暂无备注", "No note")}
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
