import { Link } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { useApp } from "../state/AppContext";
import { getTodayDate, getYesterdayDate } from "../lib/date";

export function HomePage() {
  const { bootstrapping, setMode, managerUnlocked } = useApp();
  const today = getTodayDate();
  const yesterday = getYesterdayDate();

  return (
    <AppShell
      title="明早吃什么"
      subtitle="像点外卖一样提前下早餐单，第二天一早按小票备餐。"
    >
      <section className="hero-card">
        <div className="hero-copy">
          <p className="hero-tag">家庭内部早餐系统</p>
          <h2>今晚下单，明早照着做，不再漏做漏煎蛋。</h2>
          <p>
            流程围绕一个家庭共享订单展开：今天创建订单，第二天在备餐页默认打开昨天的小票与清单。
          </p>
        </div>
        <div className="hero-actions">
          <Link className="primary-button" onClick={() => setMode("order")} to="/menu">
            进入点单
          </Link>
          <Link className="secondary-button" onClick={() => setMode("manage")} to="/prep">
            进入做饭 / 备餐
          </Link>
        </div>
      </section>

      <section className="card-grid">
        <article className="card">
          <p className="section-eyebrow">普通点单模式</p>
          <h3>像点外卖一样挑早餐</h3>
          <p className="muted-text">
            浏览菜单、加入购物车、补一个临时想吃的新品、提交到 {today} 今日订单。
          </p>
          <Link className="text-link" onClick={() => setMode("order")} to="/menu">
            去点餐页
          </Link>
        </article>

        <article className="card">
          <p className="section-eyebrow">做饭 / 管理模式</p>
          <h3>默认查看前一天的订单</h3>
          <p className="muted-text">
            明天早上进入备餐页，会默认展示 {yesterday} 创建的订单，并支持勾选完成项。
          </p>
          <Link className="text-link" onClick={() => setMode("manage")} to="/prep">
            去备餐页
          </Link>
        </article>

        <article className="card">
          <p className="section-eyebrow">趣味配送页</p>
          <h3>厨房 → 制作中 → 送达你的胃里</h3>
          <p className="muted-text">
            没有骑手，没有地图，但保留轻松有趣的进度体验。
          </p>
          <Link className="text-link" to={`/progress/${today}`}>
            看今日进度
          </Link>
        </article>
      </section>

      <section className="card">
        <div className="section-header">
          <div>
            <p className="section-eyebrow">当前状态</p>
            <h3>启动概览</h3>
          </div>
        </div>
        <div className="summary-list">
          <div className="summary-row">
            <span>数据源</span>
            <strong>{bootstrapping ? "加载中..." : "已就绪"}</strong>
          </div>
          <div className="summary-row">
            <span>今天订单</span>
            <Link to={`/orders/${today}`}>{today} 今日订单</Link>
          </div>
          <div className="summary-row">
            <span>管理解锁</span>
            <strong>{managerUnlocked ? "已解锁" : "待输入 PIN"}</strong>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
