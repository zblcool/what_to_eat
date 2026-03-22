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
- Firebase Realtime Database
- 复用 HanziHero 的 Firebase 项目配置
- 数据写入独立节点，不触碰 `leaderboard`

## 技术栈

- React 18
- TypeScript
- Vite
- Firebase

## 数据路径

Realtime Database 根节点：

- `whatToEat/menuItems`
- `whatToEat/orders`

不会写入：

- `leaderboard`

菜单项和订单的数据结构保持不变，只是存储位置从 Firestore 改成了 RTDB 节点。

## Firebase 配置

当前代码默认直接复用 HanziHero 的 Firebase 配置。

如果你后面想改成别的 Firebase 项目，再在 `.env.local` 里覆盖：

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_MANAGER_PIN=5201314
```

## 图片存储

图片直接转成 base64 data URL，随菜品一起存进 Realtime Database。

适合当前这种家庭内部、小规模使用场景。

## 共享项目下需要处理的规则

因为这版复用了 HanziHero 的同一个 Firebase 项目，规则要合并，不要整体覆盖。

- Realtime Database 规则片段：`database.rules.snippet.json`

## 本地启动

```bash
yarn install
yarn dev
```

默认开发地址：

- [http://localhost:4173](http://localhost:4173)

## 当前交付策略

- 默认使用 HanziHero 的 Firebase 配置
- 早餐系统的数据路径和排行榜分开
- 图片直接存 base64 到 Realtime Database
