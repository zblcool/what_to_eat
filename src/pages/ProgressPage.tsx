import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { useI18n } from "../i18n";
import { useApp } from "../state/AppContext";
import { getTodayDate } from "../lib/date";
import type { DailyOrder, OrderProgressStage } from "../types";

type StageConfigItem = {
  key: OrderProgressStage;
  title: string;
  description: string;
};

export function ProgressPage() {
  const { date = getTodayDate() } = useParams();
  const { fetchOrderByDate, managerUnlocked, setOrderStatus } = useApp();
  const { text } = useI18n();
  const [order, setOrder] = useState<DailyOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const managerPinConfigured = Boolean(import.meta.env.VITE_MANAGER_PIN?.trim());
  const canControl = managerUnlocked || !managerPinConfigured;
  const stageConfig: StageConfigItem[] = [
    {
      key: "submitted",
      title: text("已下单", "Order Placed"),
      description: text("明早菜单已经锁定，厨房开始记账。", "Tomorrow's breakfast is locked in and the kitchen has it on the list.")
    },
    {
      key: "accepted",
      title: text("厨房已接单", "Kitchen Accepted"),
      description: text("总厨已看见订单，正在安排锅碗瓢盆。", "The kitchen has seen the order and is getting set up.")
    },
    {
      key: "cooking",
      title: text("正在制作", "Cooking"),
      description: text("锅已经热了，鸡蛋和面包正在排队。", "The pan is hot and breakfast is on the way.")
    },
    {
      key: "almost-ready",
      title: text("即将送达", "Almost Ready"),
      description: text("离餐桌只差最后一步装盘。", "Just one last step before it reaches the table.")
    },
    {
      key: "delivered",
      title: text("已送达你的胃里", "Delivered To Your Stomach"),
      description: text("恭喜，早餐任务圆满结束。", "Breakfast mission accomplished.")
    }
  ];

  useEffect(() => {
    let cancelled = false;

    async function loadOrder() {
      setLoading(true);
      const currentOrder = await fetchOrderByDate(date);
      if (!cancelled) {
        setOrder(currentOrder);
        setLoading(false);
      }
    }

    void loadOrder();

    return () => {
      cancelled = true;
    };
  }, [date]);

  const activeStage = order?.status ?? "submitted";
  const activeIndex = stageConfig.findIndex((stage) => stage.key === activeStage);

  return (
    <AppShell
      title={text("配送 / 进度", "Progress")}
      subtitle={text(
        "用外卖感的方式展示早餐进度，但没有骑手、没有地图。",
        "A playful delivery-style progress page without riders or maps."
      )}
    >
      <section className="card progress-hero">
        <p className="section-eyebrow">{text("趣味流程", "Playful Flow")}</p>
        <h2>{date} {text("早餐旅程", "Breakfast Journey")}</h2>
        <p className="muted-text">
          {loading
            ? text("读取订单中...", "Loading order...")
            : order
              ? text(
                  `当前共 ${order.items.length} 项，状态为「${stageConfig[activeIndex]?.title ?? stageConfig[0].title}」`,
                  `${order.items.length} items in this order. Current status: "${stageConfig[activeIndex]?.title ?? stageConfig[0].title}".`
                )
              : text("这个日期还没有订单，先去点一份吧。", "There is no order for this date yet.")}
        </p>
      </section>

      <section className="timeline">
        {stageConfig.map((stage, index) => (
          <article
            className={
              index <= activeIndex ? "timeline-item active" : "timeline-item"
            }
            key={stage.key}
          >
            <div className="timeline-dot" />
            <div>
              <h3>{stage.title}</h3>
              <p className="muted-text">{stage.description}</p>
            </div>
          </article>
        ))}
      </section>

      {canControl && order ? (
        <section className="card">
          <div className="section-header">
            <div>
              <p className="section-eyebrow">{text("做饭方控制", "Kitchen Control")}</p>
              <h3>{text("切换进度", "Update Progress")}</h3>
            </div>
          </div>
          <div className="quick-add-grid">
            {stageConfig.map((stage) => (
              <button
                key={stage.key}
                type="button"
                className={
                  activeStage === stage.key ? "quick-add-chip active" : "quick-add-chip"
                }
                onClick={async () => {
                  const updatedOrder = await setOrderStatus(date, stage.key);
                  setOrder(updatedOrder);
                }}
              >
                {stage.title}
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}
