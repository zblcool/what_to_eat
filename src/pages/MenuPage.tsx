import { useState } from "react";
import { AppShell } from "../components/AppShell";
import { DishForm } from "../components/DishForm";
import { LocalizedLink, useI18n } from "../i18n";
import { useApp } from "../state/AppContext";
import { getTodayDate } from "../lib/date";
import type { MenuItem } from "../types";

const RANDOM_PICK_STORAGE_KEY = "what-to-eat.random-pick.v1";

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
  const { text } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [randomPick, setRandomPick] = useState<MenuItem | null>(null);
  const [lastRandomPickDate, setLastRandomPickDate] = useState(
    () => localStorage.getItem(RANDOM_PICK_STORAGE_KEY) ?? ""
  );
  const today = getTodayDate();
  const hasUsedRandomPickToday = lastRandomPickDate === today;

  const filteredMenuItems =
    !selectedCategory ? menuItems : menuItems.filter((item) => item.category === selectedCategory);

  function openRandomPick() {
    if (menuItems.length === 0 || hasUsedRandomPickToday) {
      return;
    }

    const pickedItem = menuItems[Math.floor(Math.random() * menuItems.length)];
    localStorage.setItem(RANDOM_PICK_STORAGE_KEY, today);
    setLastRandomPickDate(today);
    setRandomPick(pickedItem);
  }

  return (
    <AppShell
      title={text("早餐点餐", "Breakfast Ordering")}
      subtitle={text(
        "参考外卖点餐体验，但为家庭内部流程做了轻量化改造。",
        "Delivery-style ordering, simplified for a family kitchen flow."
      )}
      actions={
        <LocalizedLink className="secondary-button compact-button" to={`/orders/${today}`}>
          {text("今日订单", "Today's Order")}
        </LocalizedLink>
      }
    >
      <section className="card">
        <div className="section-header">
          <div>
            <p className="section-eyebrow">{text("菜单库", "Menu Library")}</p>
            <h2>{text("今天想吃什么", "What do you want tomorrow morning?")}</h2>
          </div>
          <div className="action-row">
            <button
              type="button"
              className="primary-button"
              disabled={menuItems.length === 0 || hasUsedRandomPickToday}
              onClick={openRandomPick}
            >
              {hasUsedRandomPickToday
                ? text("今日已抽过", "Used Today's Draw")
                : text("随机选一个", "Pick Randomly")}
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setShowCustomForm((current) => !current)}
            >
              {showCustomForm
                ? text("收起临时菜品", "Hide Custom Dish")
                : text("新增临时菜品", "Add Custom Dish")}
            </button>
          </div>
        </div>

        <div className="chip-row">
          <button
            type="button"
            className={!selectedCategory ? "category-chip active" : "category-chip"}
            onClick={() => setSelectedCategory("")}
          >
            {text("全部", "All")}
          </button>
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
          submitLabel={text("加入购物车", "Add To Cart")}
          title={text("新增本次想吃的早餐", "Add A One-Off Breakfast")}
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
                  <div className="dish-placeholder">{item.category || text("早餐", "Breakfast")}</div>
                )}
              </div>
              <div className="dish-card-content">
                <div className="dish-card-head">
                  <div>
                    <p className="dish-category">{item.category || text("未分类", "Uncategorized")}</p>
                    <h3>{item.name}</h3>
                  </div>
                  <span className="dish-badge">{text("家庭常备", "Family Pick")}</span>
                </div>
                {item.description ? <p className="muted-text">{item.description}</p> : null}
                <div className="dish-card-footer">
                  <div>
                    <strong>{text("明早待做", "Prep For Tomorrow")}</strong>
                    <p className="tiny-text">
                      {item.recipeNote || text("可在备餐页查看制作提示", "Recipe note available in prep view")}
                    </p>
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
                      {text("加入", "Add")}
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
          <p className="checkout-bar-kicker">{text("购物车", "Cart")}</p>
          <strong>{text(`${cartCount} 份早餐已加入`, `${cartCount} items added`)}</strong>
        </div>
        <LocalizedLink className="primary-button" to="/cart">
          {text("去结算", "Review Cart")}
        </LocalizedLink>
      </div>

      {randomPick ? (
        <div className="random-pick-overlay">
          <section className="random-pick-modal">
            <p className="section-eyebrow">{text("今日随机推荐", "Today's Random Pick")}</p>
            <div className="random-pick-media">
              {randomPick.imageUrl ? (
                <img alt={randomPick.name} src={randomPick.imageUrl} />
              ) : (
                <div className="dish-placeholder">
                  {randomPick.category || text("早餐", "Breakfast")}
                </div>
              )}
            </div>
            <div className="random-pick-copy">
              <h3>{randomPick.name}</h3>
              <p className="muted-text">
                {randomPick.description ||
                  randomPick.recipeNote ||
                  text("今天的手气推荐它，明早就吃这个吧。", "Luck says this should be tomorrow's breakfast.")}
              </p>
            </div>
            <div className="action-row">
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  addMenuItemToCart(randomPick);
                  setRandomPick(null);
                }}
              >
                {text("加入购物车", "Add To Cart")}
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setRandomPick(null)}
              >
                {text("可惜不是你", "Not The One")}
              </button>
            </div>
            <p className="tiny-text random-pick-note">
              {text(
                "今日随机机会仅一次，放弃后今天就不能再抽了。",
                "You only get one random draw today. Passing means no more draws."
              )}
            </p>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}
