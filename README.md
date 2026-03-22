# 明早吃什么

家庭内部早餐点单与备餐系统 MVP。

## 已实现功能

- 欢迎页，区分点单模式和做饭 / 管理模式
- 菜单页：浏览菜单、按分类筛选、加入购物车
- 点餐者新增临时菜品，并选择是否加入家庭菜单库
- 购物车页：调整数量、删除、提交订单
- 订单页：查看、修改、快速添加、保存
- 配送 / 进度页：趣味化展示早餐制作进度
- 备餐页：默认查看前一天订单，支持 checklist
- 菜单管理页：新增、编辑、删除菜品，上传图片
- Firebase Firestore + Storage 接口
- 未配置 Firebase 时自动切换到本地演示模式

## 技术栈

- React 18
- TypeScript
- Vite
- Firebase

## Firebase 数据设计

### `menuItems`

每道长期保留在菜单库的菜品一条文档。

建议字段：

```ts
{
  id: string
  name: string
  description?: string
  category?: string
  imageUrl?: string
  recipeNote?: string
  keepInLibrary: boolean
  createdByMode: "order" | "manage"
  archived?: boolean
  createdAt: string
  updatedAt: string
}
```

### `orders`

以 `YYYY-MM-DD` 作为文档 ID，一天一个共享订单。

建议字段：

```ts
{
  id: string
  orderDate: string
  label: string
  status: "submitted" | "accepted" | "cooking" | "almost-ready" | "delivered"
  createdAt: string
  updatedAt: string
  items: [
    {
      id: string
      menuItemId?: string
      name: string
      description?: string
      category?: string
      imageUrl?: string
      quantity: number
      note?: string
      prepDone: boolean
      source: "menu" | "adhoc"
      keepInLibrary: boolean
    }
  ]
}
```

## 需要你准备的 Firebase 配置

把以下内容填进 `.env.local`：

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_MANAGER_PIN=5201314
```

另外需要你在 Firebase Console 完成：

1. 创建 Firebase Project
2. 开通 Firestore Database
3. 开通 Firebase Storage
4. 开通 Authentication，并启用 `Anonymous` 登录方式
5. 部署 `firestore.rules` 和 `storage.rules`

> 说明：为了保持“无复杂登录、但不要完全裸奔”的体验，这个 MVP 采用匿名登录。没有注册页面，但规则里仍然可以基于 `request.auth != null` 限制访问。

## 本地启动

```bash
yarn install
yarn dev
```

默认开发地址：

- [http://localhost:4173](http://localhost:4173)

## 当前交付策略

- 你还没提供 Firebase 项目配置，所以代码已经预留好接入点
- 现在先保证前端流程和本地演示模式可以完整跑通
- 你把 Firebase 配置补上后，这套页面会直接切到在线持久化
