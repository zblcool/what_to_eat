import { useState } from "react";
import { AppShell } from "../components/AppShell";
import { DishForm } from "../components/DishForm";
import { ModeGate } from "../components/ModeGate";
import { useApp } from "../state/AppContext";
import type { MenuItem } from "../types";

export function ManagePage() {
  const { deleteMenuLibraryItem, menuItems, saveMenuLibraryItem } = useApp();
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <AppShell
      title="菜单库管理"
      subtitle="在这里维护家庭早餐菜单，也能上传图片和补充做法说明。"
    >
      <ModeGate
        title="菜单库管理需要做饭模式"
        description="这里可以新增、编辑、删除家庭菜单库中的菜品。"
      >
        <section className="card">
          <div className="section-header">
            <div>
              <p className="section-eyebrow">菜单库维护</p>
              <h2>当前共 {menuItems.length} 道菜</h2>
            </div>
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                setEditingItem(null);
                setShowCreateForm((current) => !current);
              }}
            >
              {showCreateForm ? "收起表单" : "新增菜品"}
            </button>
          </div>
        </section>

        {showCreateForm ? (
          <DishForm
            createdByMode="manage"
            submitLabel="保存到菜单库"
            title="新增家庭早餐"
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
            submitLabel="保存修改"
            title={`编辑：${editingItem.name}`}
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
                    <div className="dish-placeholder small">{item.category || "早餐"}</div>
                  )}
                </div>
                <div>
                  <div className="receipt-title-row">
                    <h3>{item.name}</h3>
                    <span className="dish-badge">{item.category || "未分类"}</span>
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
                  编辑
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
                  删除
                </button>
              </div>
            </article>
          ))}
        </section>
      </ModeGate>
    </AppShell>
  );
}
