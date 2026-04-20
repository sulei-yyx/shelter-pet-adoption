# Shelter Pet Adoption

一个前后端一体的宠物领养应用：

- 前端：Vite + React + TypeScript
- 后端：Express + TypeScript
- 数据存储：Supabase
- 认证：Supabase Auth

## 本地运行

1. 执行 `npm install`
2. 复制 `.env.example` 为 `.env.local`
3. 在 Supabase SQL Editor 执行 [supabase/schema.sql](/C:/Users/17518/OneDrive/桌面/shelter-pet-adoption/supabase/schema.sql)
4. 填入这些环境变量：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. 启动后端：`npm run dev:server`
6. 启动前端：`npm run dev`

## Vercel 一键部署

项目已经包含 Vercel 部署文件：

- [vercel.json](/C:/Users/17518/OneDrive/桌面/shelter-pet-adoption/vercel.json)
- [.vercelignore](/C:/Users/17518/OneDrive/桌面/shelter-pet-adoption/.vercelignore)
- [api/[...path].ts](</C:/Users/17518/OneDrive/桌面/shelter-pet-adoption/api/[...path].ts>)

在 Vercel 中导入 GitHub 仓库后，补齐这些环境变量即可：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FRONTEND_ORIGIN`

建议把 `FRONTEND_ORIGIN` 设置成你的 Vercel 线上域名，例如：

```env
FRONTEND_ORIGIN=https://your-project.vercel.app
```

部署后：

- Vite 前端会作为静态站点输出
- `api/[...path].ts` 会把 `/api/*` 请求交给 Express
- 前后端会在同一个 Vercel 项目里工作

## 数据模型

- `pets`：宠物信息与地图坐标
- `profiles`：用户资料、通知与偏好设置
- `favorites`：收藏关系
- `applications`：领养申请

服务启动时，如果 `pets` 表为空，会自动写入一批初始宠物数据。
