import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { useApp } from "../state/AppContext";
import { getTodayDate } from "../lib/date";

export function CartPage() {
  const {
    cart,
    cartCount,
    clearCart,
    removeCartItem,
    submitCartToTodayOrder,
    updateCartItemQuantity
  } = useApp();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const today = getTodayDate();

  return (
    <AppShell
      title="购物车 / 结算"
      subtitle="没有付款流程，提交后会生成今天创建、供明早参考的订单。"
    >
      {cart.length === 0 ? (
        <section className="card empty-card">
          <h2>购物车还是空的</h2>
          <p className="muted-text">先去挑几样明早想吃的早餐吧。</p>
          <Link className="primary-button" to="/menu">
            返回点餐页
          </Link>
        </section>
      ) : (
        <>
          <section className="stack-list">
            {cart.map((item) => (
              <article className="card line-item-card" key={item.id}>
                <div className="line-item-main">
                  <div className="line-item-media">
                    {item.imageUrl ? (
                      <img alt={item.name} src={item.imageUrl} />
                    ) : (
                      <div className="dish-placeholder small">{item.category || "早餐"}</div>
                    )}
                  </div>
                  <div>
                    <h3>{item.name}</h3>
                    {item.description ? <p className="muted-text">{item.description}</p> : null}
                    <p className="tiny-text">{item.keepInLibrary ? "会保留在菜单库" : "仅本次订单使用"}</p>
                  </div>
                </div>
                <div className="line-item-actions">
                  <div className="quantity-control">
                    <button
                      type="button"
                      onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => removeCartItem(item.id)}
                  >
                    删除
                  </button>
                </div>
              </article>
            ))}
          </section>

          <section className="card summary-card">
            <div className="summary-list">
              <div className="summary-row">
                <span>订单名称</span>
                <strong>{today} 今日订单</strong>
              </div>
              <div className="summary-row">
                <span>总份数</span>
                <strong>{cartCount}</strong>
              </div>
              <div className="summary-row">
                <span>说明</span>
                <strong>今天提交，明早制作</strong>
              </div>
            </div>
            <div className="action-row">
              <button type="button" className="secondary-button" onClick={clearCart}>
                清空购物车
              </button>
              <button
                type="button"
                className="primary-button"
                disabled={submitting}
                onClick={async () => {
                  setSubmitting(true);
                  try {
                    const order = await submitCartToTodayOrder();
                    navigate(`/orders/${order.orderDate}`);
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                {submitting ? "提交中..." : "提交订单"}
              </button>
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}
