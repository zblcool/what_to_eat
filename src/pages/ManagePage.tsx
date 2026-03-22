import { useState } from "react";
import { AppShell } from "../components/AppShell";
import { DishForm } from "../components/DishForm";
import { ModeGate } from "../components/ModeGate";
import { useI18n } from "../i18n";
import { useApp } from "../state/AppContext";
import type { MenuItem } from "../types";

export function ManagePage() {
  const { deleteMenuLibraryItem, menuItems, saveMenuLibraryItem } = useApp();
  const { text } = useI18n();
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <AppShell
      title={text("菜单库管理", "Menu Management")}
      subtitle={text(
        "在这里维护家庭早餐菜单，也能上传图片和补充做法说明。",
        "Manage the family breakfast menu and edit prep notes here."
      )}
    >
      <ModeGate
        title={text("菜单库管理需要做饭模式", "Menu management requires kitchen mode")}
        description={text(
          "这里可以新增、编辑、删除家庭菜单库中的菜品。",
          "Add, edit, and delete dishes in the family menu here."
        )}
      >
        <section className="card">
          <div className="section-header">
            <div>
              <p className="section-eyebrow">{text("菜单库维护", "Menu Library")}</p>
              <h2>{text(`当前共 ${menuItems.length} 道菜`, `${menuItems.length} dishes total`)}</h2>
            </div>
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                setEditingItem(null);
                setShowCreateForm((current) => !current);
              }}
            >
              {showCreateForm ? text("收起表单", "Hide Form") : text("新增菜品", "Add Dish")}
            </button>
          </div>
        </section>

        {showCreateForm ? (
          <DishForm
            createdByMode="manage"
            submitLabel={text("保存到菜单库", "Save To Menu")}
            title={text("新增家庭早餐", "Add Family Breakfast")}
            onCancel={() => setShowCreateForm(false)}
            onSubmit={async (draft) => {
              await saveMenuLibraryItem({ ...draft, keepInLibrary: true });
              setShowCreateForm(false);
            }}
          />
        ) : null}

        {editingItem ? (
          <DishForm
            key={editingItem.id}
            createdByMode="manage"
            initialItem={editingItem}
            submitLabel={text("保存修改", "Save Changes")}
            title={text(`编辑：${editingItem.name}`, `Edit: ${editingItem.name}`)}
            onCancel={() => setEditingItem(null)}
            onSubmit={async (draft) => {
              await saveMenuLibraryItem({ ...draft, keepInLibrary: true });
              setEditingItem(null);
            }}
          />
        ) : null}

        <section className="stack-list">
          {menuItems.map((item) => (
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
                  <div className="receipt-title-row">
                    <h3>{item.name}</h3>
                    <span className="dish-badge">{item.category || text("未分类", "Uncategorized")}</span>
                  </div>
                  {item.description ? <p className="muted-text">{item.description}</p> : null}
                  {item.recipeNote ? <p className="tiny-text">{item.recipeNote}</p> : null}
                </div>
              </div>
              <div className="action-row">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setEditingItem(item);
                    setShowCreateForm(false);
                  }}
                >
                  {text("编辑", "Edit")}
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={async () => {
                    await deleteMenuLibraryItem(item.id);
                    if (editingItem?.id === item.id) {
                      setEditingItem(null);
                    }
                  }}
                >
                  {text("删除", "Delete")}
                </button>
              </div>
            </article>
          ))}
        </section>
      </ModeGate>
    </AppShell>
  );
}
