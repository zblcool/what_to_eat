import { useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { DishForm } from "../components/DishForm";
import { useApp } from "../state/AppContext";
import { getTodayDate } from "../lib/date";

export function MenuPage() {
  const {
    cart,
    cartCount,
    categories,
    menuItems,
    addMenuItemToCart,
    addCustomDishToCart,
    updateCartItemQuantity
  } = useApp();
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const today = getTodayDate();

  const filteredMenuItems =
    selectedCategory === "全部"
      ? menuItems
      : menuItems.filter((item) => item.category === selectedCategory);

  return (
    <AppShell
      title="早餐点餐"
      subtitle="参考外卖点餐体验，但为家庭内部流程做了轻量化改造。"
      actions={
        <Link className="secondary-button compact-button" to={`/orders/${today}`}>
          今日订单
        </Link>
      }
    >
      <section className="card">
        <div className="section-header">
          <div>
            <p className="section-eyebrow">菜单库</p>
            <h2>今天想吃什么</h2>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setShowCustomForm((current) => !current)}
          >
            {showCustomForm ? "收起临时菜品" : "新增临时菜品"}
          </button>
        </div>

        <div className="chip-row">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={
                selectedCategory === category ? "category-chip active" : "category-chip"
              }
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {showCustomForm ? (
        <DishForm
          createdByMode="order"
          defaultKeepInLibrary={false}
          submitLabel="加入购物车"
          title="新增本次想吃的早餐"
          onCancel={() => setShowCustomForm(false)}
          onSubmit={async (draft) => {
            await addCustomDishToCart(draft);
            setShowCustomForm(false);
          }}
        />
      ) : null}

      <section className="menu-grid">
        {filteredMenuItems.map((item) => {
          const existingCartItem = cart.find((cartItem) => cartItem.menuItemId === item.id);
          return (
            <article className="dish-card" key={item.id}>
              <div className="dish-card-media">
                {item.imageUrl ? (
                  <img alt={item.name} src={item.imageUrl} />
                ) : (
                  <div className="dish-placeholder">{item.category || "早餐"}</div>
                )}
              </div>
              <div className="dish-card-content">
                <div className="dish-card-head">
                  <div>
                    <p className="dish-category">{item.category || "未分类"}</p>
                    <h3>{item.name}</h3>
                  </div>
                  <span className="dish-badge">家庭常备</span>
                </div>
                {item.description ? <p className="muted-text">{item.description}</p> : null}
                <div className="dish-card-footer">
                  <div>
                    <strong>明早待做</strong>
                    <p className="tiny-text">{item.recipeNote || "可在备餐页查看制作提示"}</p>
                  </div>
                  {existingCartItem ? (
                    <div className="quantity-control">
                      <button
                        type="button"
                        onClick={() =>
                          updateCartItemQuantity(
                            existingCartItem.id,
                            existingCartItem.quantity - 1
                          )
                        }
                      >
                        -
                      </button>
                      <span>{existingCartItem.quantity}</span>
                      <button type="button" onClick={() => addMenuItemToCart(item)}>
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="add-button"
                      onClick={() => addMenuItemToCart(item)}
                    >
                      加入
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <div className="checkout-bar">
        <div>
          <p className="checkout-bar-kicker">购物车</p>
          <strong>{cartCount} 份早餐已加入</strong>
        </div>
        <Link className="primary-button" to="/cart">
          去结算
        </Link>
      </div>
    </AppShell>
  );
}
