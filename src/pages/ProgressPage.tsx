import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { useApp } from "../state/AppContext";
import { getTodayDate } from "../lib/date";
import type { DailyOrder, OrderProgressStage } from "../types";

const stageConfig: Array<{
  key: OrderProgressStage;
  title: string;
  description: string;
}> = [
  {
    key: "submitted",
    title: "已下单",
    description: "明早菜单已经锁定，厨房开始记账。"
  },
  {
    key: "accepted",
    title: "厨房已接单",
    description: "总厨已看见订单，正在安排锅碗瓢盆。"
  },
  {
    key: "cooking",
    title: "正在制作",
    description: "锅已经热了，鸡蛋和面包正在排队。"
  },
  {
    key: "almost-ready",
    title: "即将送达",
    description: "离餐桌只差最后一步装盘。"
  },
  {
    key: "delivered",
    title: "已送达你的胃里",
    description: "恭喜，早餐任务圆满结束。"
  }
];

export function ProgressPage() {
  const { date = getTodayDate() } = useParams();
  const { fetchOrderByDate, managerUnlocked, setOrderStatus } = useApp();
  const [order, setOrder] = useState<DailyOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const managerPinConfigured = Boolean(import.meta.env.VITE_MANAGER_PIN?.trim());
  const canControl = managerUnlocked || !managerPinConfigured;

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
      title="配送 / 进度"
      subtitle="用外卖感的方式展示早餐进度，但没有骑手、没有地图。"
    >
      <section className="card progress-hero">
        <p className="section-eyebrow">趣味流程</p>
        <h2>{date} 早餐旅程</h2>
        <p className="muted-text">
          {loading
            ? "读取订单中..."
            : order
              ? `当前共 ${order.items.length} 项，状态为「${stageConfig[activeIndex]?.title ?? "已下单"}」`
              : "这个日期还没有订单，先去点一份吧。"}
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
              <p className="section-eyebrow">做饭方控制</p>
              <h3>切换进度</h3>
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
