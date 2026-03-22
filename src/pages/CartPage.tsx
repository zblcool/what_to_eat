import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { LocalizedLink, useI18n } from "../i18n";
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
  const { localizePath, text } = useI18n();

  return (
    <AppShell
      title={text("购物车 / 结算", "Cart / Review")}
      subtitle={text(
        "没有付款流程，提交后会生成今天创建、供明早参考的订单。",
        "There is no payment step. Submitting saves today's order for tomorrow morning."
      )}
    >
      {cart.length === 0 ? (
        <section className="card empty-card">
          <h2>{text("购物车还是空的", "Your cart is empty")}</h2>
          <p className="muted-text">{text("先去挑几样明早想吃的早餐吧。", "Pick a few breakfast items first.")}</p>
          <LocalizedLink className="primary-button" to="/menu">
            {text("返回点餐页", "Back To Menu")}
          </LocalizedLink>
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
                      <div className="dish-placeholder small">{item.category || text("早餐", "Breakfast")}</div>
                    )}
                  </div>
                  <div>
                    <h3>{item.name}</h3>
                    {item.description ? <p className="muted-text">{item.description}</p> : null}
                    <p className="tiny-text">
                      {item.keepInLibrary
                        ? text("会保留在菜单库", "Saved in the family menu")
                        : text("仅本次订单使用", "Only for this order")}
                    </p>
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
                    {text("删除", "Remove")}
                  </button>
                </div>
              </article>
            ))}
          </section>

          <section className="card summary-card">
            <div className="summary-list">
              <div className="summary-row">
                <span>{text("订单名称", "Order Name")}</span>
                <strong>{today} {text("今日订单", "Daily Order")}</strong>
              </div>
              <div className="summary-row">
                <span>{text("总份数", "Total Items")}</span>
                <strong>{cartCount}</strong>
              </div>
              <div className="summary-row">
                <span>{text("说明", "Note")}</span>
                <strong>{text("今天提交，明早制作", "Submit today, cook tomorrow")}</strong>
              </div>
            </div>
            <div className="action-row">
              <button type="button" className="secondary-button" onClick={clearCart}>
                {text("清空购物车", "Clear Cart")}
              </button>
              <button
                type="button"
                className="primary-button"
                disabled={submitting}
                onClick={async () => {
                  setSubmitting(true);
                  try {
                    const order = await submitCartToTodayOrder();
                    navigate(localizePath(`/orders/${order.orderDate}`));
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                {submitting ? text("提交中...", "Submitting...") : text("提交订单", "Submit Order")}
              </button>
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}
