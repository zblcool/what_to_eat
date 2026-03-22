import { useState } from "react";
import type { MenuDraft, MenuItem, UserMode } from "../types";

interface DishFormProps {
  title: string;
  submitLabel: string;
  initialItem?: MenuItem | null;
  createdByMode: UserMode;
  defaultKeepInLibrary?: boolean;
  onSubmit: (draft: MenuDraft) => Promise<void>;
  onCancel?: () => void;
}

export function DishForm({
  title,
  submitLabel,
  initialItem,
  createdByMode,
  defaultKeepInLibrary = true,
  onSubmit,
  onCancel
}: DishFormProps) {
  const [name, setName] = useState(initialItem?.name ?? "");
  const [description, setDescription] = useState(initialItem?.description ?? "");
  const [category, setCategory] = useState(initialItem?.category ?? "");
  const [recipeNote, setRecipeNote] = useState(initialItem?.recipeNote ?? "");
  const [keepInLibrary, setKeepInLibrary] = useState(
    initialItem?.keepInLibrary ?? defaultKeepInLibrary
  );
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  return (
    <form
      className="card form-card"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!name.trim()) {
          setError("先填写菜品名称。");
          return;
        }

        setSubmitting(true);
        setError("");

        try {
          await onSubmit({
            id: initialItem?.id,
            name,
            description,
            category,
            recipeNote,
            keepInLibrary,
            imageUrl: initialItem?.imageUrl,
            file,
            createdByMode
          });
          setName("");
          setDescription("");
          setCategory("");
          setRecipeNote("");
          setKeepInLibrary(defaultKeepInLibrary);
          setFile(null);
        } catch (submitError) {
          console.error(submitError);
          setError("保存失败，请稍后再试。");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <div className="section-header">
        <div>
          <p className="section-eyebrow">新增 / 编辑菜品</p>
          <h3>{title}</h3>
        </div>
        {onCancel ? (
          <button
            type="button"
            className="secondary-button"
            onClick={onCancel}
          >
            取消
          </button>
        ) : null}
      </div>

      <label className="field">
        <span>菜品名称</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="例如：手抓饼加蛋"
        />
      </label>

      <label className="field">
        <span>简要描述</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="可以写口味、搭配或提醒"
          rows={3}
        />
      </label>

      <div className="field-grid">
        <label className="field">
          <span>分类</span>
          <input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="主食 / 蛋类 / 饮品"
          />
        </label>

        <label className="field">
          <span>图片</span>
          <input
            accept="image/*"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            type="file"
          />
        </label>
      </div>

      <label className="field">
        <span>做法说明 / 备注预留</span>
        <textarea
          value={recipeNote}
          onChange={(event) => setRecipeNote(event.target.value)}
          placeholder="例如：面包别烤太久、鸡蛋要溏心"
          rows={3}
        />
      </label>

      <label className="checkbox-row">
        <input
          checked={keepInLibrary}
          onChange={(event) => setKeepInLibrary(event.target.checked)}
          type="checkbox"
        />
        <div>
          <strong>加入家庭菜单库</strong>
          <p className="muted-text">不勾选时，这道菜会作为本次订单的一次性菜品。</p>
        </div>
      </label>

      {error ? <p className="inline-error">{error}</p> : null}

      <button className="primary-button" disabled={submitting} type="submit">
        {submitting ? "保存中..." : submitLabel}
      </button>
    </form>
  );
}
