import { nowIso } from "./date";
import type { MenuItem } from "../types";

const createdAt = nowIso();

export const sampleMenuItems: MenuItem[] = [
  {
    id: "menu-sandwich",
    name: "煎蛋三明治",
    description: "吐司、鸡蛋、生菜和番茄，适合忙碌工作日。",
    category: "主食",
    keepInLibrary: true,
    createdByMode: "manage",
    recipeNote: "鸡蛋八成熟口感最好，可提前切好番茄片。",
    createdAt,
    updatedAt: createdAt
  },
  {
    id: "menu-youtiao",
    name: "豆浆油条套餐",
    description: "热豆浆搭配油条，经典中式早餐。",
    category: "套餐",
    keepInLibrary: true,
    createdByMode: "manage",
    recipeNote: "豆浆前一晚泡豆，油条用空气炸锅复热即可。",
    createdAt,
    updatedAt: createdAt
  },
  {
    id: "menu-porridge",
    name: "皮蛋瘦肉粥",
    description: "软糯暖胃，适合天凉或起床晚的时候。",
    category: "粥品",
    keepInLibrary: true,
    createdByMode: "manage",
    recipeNote: "大米先浸泡 30 分钟，肉丝提前腌制。",
    createdAt,
    updatedAt: createdAt
  },
  {
    id: "menu-oats",
    name: "牛奶燕麦杯",
    description: "高纤低负担，适合想吃轻一点的早晨。",
    category: "轻食",
    keepInLibrary: true,
    createdByMode: "manage",
    recipeNote: "可加香蕉和坚果提升饱腹感。",
    createdAt,
    updatedAt: createdAt
  },
  {
    id: "menu-noodle",
    name: "葱油拌面",
    description: "简单快手，香味足，适合当作热早餐。",
    category: "面食",
    keepInLibrary: true,
    createdByMode: "manage",
    recipeNote: "葱油可提前一晚熬好，早晨煮面更轻松。",
    createdAt,
    updatedAt: createdAt
  },
  {
    id: "menu-latte",
    name: "拿铁",
    description: "咖啡提神，搭配主食一起下单最合适。",
    category: "饮品",
    keepInLibrary: true,
    createdByMode: "manage",
    recipeNote: "牛奶温度控制在 60 度左右口感更顺滑。",
    createdAt,
    updatedAt: createdAt
  }
];
