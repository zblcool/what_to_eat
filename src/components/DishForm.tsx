import { useState } from "react";
import { useI18n } from "../i18n";
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
  const { text } = useI18n();

  return (
    <form
      className="card form-card"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!name.trim()) {
          setError(text("先填写菜品名称。", "Please enter a dish name first."));
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
          setError(
            submitError instanceof Error
              ? submitError.message
              : text("保存失败，请稍后再试。", "Save failed. Please try again.")
          );
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <div className="section-header">
        <div>
          <p className="section-eyebrow">{text("新增 / 编辑菜品", "Add / Edit Dish")}</p>
          <h3>{title}</h3>
        </div>
        {onCancel ? (
          <button
            type="button"
            className="secondary-button"
            onClick={onCancel}
          >
            {text("取消", "Cancel")}
          </button>
        ) : null}
      </div>

      <label className="field">
        <span>{text("菜品名称", "Dish Name")}</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={text("例如：手抓饼加蛋", "Example: Egg pancake")}
        />
      </label>

      <label className="field">
        <span>{text("简要描述", "Short Description")}</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder={text(
            "可以写口味、搭配或提醒",
            "Flavor, pairing, or a short reminder"
          )}
          rows={3}
        />
      </label>

      <div className="field-grid">
        <label className="field">
          <span>{text("分类", "Category")}</span>
          <input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder={text("主食 / 蛋类 / 饮品", "Staple / Egg / Drink")}
          />
        </label>

        <label className="field">
          <span>{text("图片", "Image")}</span>
          <input
            accept="image/*"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            type="file"
          />
        </label>
      </div>

      <label className="field">
        <span>{text("做法说明 / 备注预留", "Recipe Note / Prep Note")}</span>
        <textarea
          value={recipeNote}
          onChange={(event) => setRecipeNote(event.target.value)}
          placeholder={text(
            "例如：面包别烤太久、鸡蛋要溏心",
            "Example: Keep toast soft and egg runny"
          )}
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
          <strong>{text("加入家庭菜单库", "Add To Family Menu")}</strong>
          <p className="muted-text">
            {text(
              "不勾选时，这道菜会作为本次订单的一次性菜品。",
              "If unchecked, this dish is only used for the current order."
            )}
          </p>
        </div>
      </label>

      {error ? <p className="inline-error">{error}</p> : null}

      <button className="primary-button" disabled={submitting} type="submit">
        {submitting ? text("保存中...", "Saving...") : submitLabel}
      </button>
    </form>
  );
}
