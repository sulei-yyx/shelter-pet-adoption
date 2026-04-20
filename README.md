# Shelter Pet Adoption

这是一个前后端一体的宠物领养应用：

- 前端：`Vite + React + TypeScript`
- 后端：`Express + TypeScript`
- 数据存储：`Supabase`

## 环境准备

1. 执行 `npm install`
2. 复制 `.env.example` 为 `.env.local`
3. 在 Supabase SQL Editor 中执行 [supabase/schema.sql](/C:/Users/17518/OneDrive/桌面/shelter-pet-adoption/supabase/schema.sql)
4. 填入 `SUPABASE_URL` 与 `SUPABASE_SERVICE_ROLE_KEY`

## 本地运行

1. 启动后端：`npm run dev:server`
2. 启动前端：`npm run dev`

前端会通过 Vite 代理把 `/api/*` 请求转发到 `http://localhost:8787`。

## 数据模型

- `pets`：宠物信息与地图坐标
- `profiles`：用户资料、通知与偏好设置
- `favorites`：收藏关系
- `applications`：领养申请表单

服务启动时，如果 `pets` 表为空，会自动写入一批初始宠物数据。
