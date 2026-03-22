import { AppShell } from "../components/AppShell";
import { LocalizedLink, useI18n } from "../i18n";
import { useApp } from "../state/AppContext";
import { getTodayDate, getYesterdayDate } from "../lib/date";

export function HomePage() {
  const { bootstrapping, setMode, managerUnlocked } = useApp();
  const { text } = useI18n();
  const today = getTodayDate();
  const yesterday = getYesterdayDate();

  return (
    <AppShell
      title={text("明早吃什么", "Breakfast Planner")}
      subtitle={text(
        "像点外卖一样提前下早餐单，第二天一早按小票备餐。",
        "Order tomorrow's breakfast tonight and prep from a simple kitchen ticket."
      )}
    >
      <section className="hero-card">
        <div className="hero-copy">
          <p className="hero-tag">{text("家庭内部早餐系统", "Private Family Breakfast App")}</p>
          <h2>{text("今晚下单，明早照着做，不再漏做漏煎蛋。", "Order tonight, cook with confidence tomorrow.")}</h2>
          <p>
            {text(
              "流程围绕一个家庭共享订单展开：今天创建订单，第二天在备餐页默认打开昨天的小票与清单。",
              "Each day creates one shared family order. The next morning, the prep page opens yesterday's ticket by default."
            )}
          </p>
        </div>
        <div className="hero-actions">
          <LocalizedLink className="primary-button" onClick={() => setMode("order")} to="/menu">
            {text("进入点单", "Start Ordering")}
          </LocalizedLink>
          <LocalizedLink className="secondary-button" onClick={() => setMode("manage")} to="/prep">
            {text("进入做饭 / 备餐", "Open Prep View")}
          </LocalizedLink>
        </div>
      </section>

      <section className="card-grid">
        <article className="card">
          <p className="section-eyebrow">{text("普通点单模式", "Order Mode")}</p>
          <h3>{text("像点外卖一样挑早餐", "Pick breakfast like a delivery app")}</h3>
          <p className="muted-text">
            {text(
              `浏览菜单、加入购物车、补一个临时想吃的新品、提交到 ${today} 今日订单。`,
              `Browse the menu, add items to cart, add one-off dishes, and save into the ${today} order.`
            )}
          </p>
          <LocalizedLink className="text-link" onClick={() => setMode("order")} to="/menu">
            {text("去点餐页", "Open Menu")}
          </LocalizedLink>
        </article>

        <article className="card">
          <p className="section-eyebrow">{text("做饭 / 管理模式", "Kitchen / Admin Mode")}</p>
          <h3>{text("默认查看前一天的订单", "Default to yesterday's order")}</h3>
          <p className="muted-text">
            {text(
              `明天早上进入备餐页，会默认展示 ${yesterday} 创建的订单，并支持勾选完成项。`,
              `Tomorrow morning, the prep page opens the ${yesterday} order and lets you check off finished items.`
            )}
          </p>
          <LocalizedLink className="text-link" onClick={() => setMode("manage")} to="/prep">
            {text("去备餐页", "Open Prep")}
          </LocalizedLink>
        </article>

        <article className="card">
          <p className="section-eyebrow">{text("趣味配送页", "Fun Progress Page")}</p>
          <h3>{text("厨房 → 制作中 → 送达你的胃里", "Kitchen → Cooking → Delivered To Your Stomach")}</h3>
          <p className="muted-text">
            {text(
              "没有骑手，没有地图，但保留轻松有趣的进度体验。",
              "No rider, no map, just a playful breakfast progress flow."
            )}
          </p>
          <LocalizedLink className="text-link" to={`/progress/${today}`}>
            {text("看今日进度", "View Today's Progress")}
          </LocalizedLink>
        </article>
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <p className="section-eyebrow">{text("当前状态", "Current Status")}</p>
            <h3>{text("启动概览", "Startup Summary")}</h3>
          </div>
        </div>
        <div className="summary-list">
          <div className="summary-row">
            <span>{text("数据源", "Data Source")}</span>
            <strong>{bootstrapping ? text("加载中...", "Loading...") : text("已就绪", "Ready")}</strong>
          </div>
          <div className="summary-row">
            <span>{text("今天订单", "Today's Order")}</span>
            <LocalizedLink to={`/orders/${today}`}>{today} {text("今日订单", "Daily Order")}</LocalizedLink>
          </div>
          <div className="summary-row">
            <span>{text("管理解锁", "Admin Access")}</span>
            <strong>{managerUnlocked ? text("已解锁", "Unlocked") : text("待输入 PIN", "PIN Required")}</strong>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
