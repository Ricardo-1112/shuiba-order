# 水吧预定系统 (React + Vite + Tailwind)

这是你要求的项目骨架（单文件 App.jsx 已包含主功能），可以在本地运行或部署到 Netlify / Vercel 并绑定自定义域名，以避免使用 chatgpt 提供的共享链接。

## 快速运行（本地）
1. 解压并进入项目目录
2. 安装依赖：
   ```
   npm install
   ```
3. 启动开发服务器：
   ```
   npm run dev
   ```
4. 打开浏览器访问提示的本地地址 (例如 http://localhost:5173)

## 部署并使用自定义域名
推荐使用 Vercel 或 Netlify：
- 在 Vercel / Netlify 上新建项目并连接 GitHub 仓库（或直接上传项目压缩包）。
- 部署完成后，在平台设置里添加自定义域名并完成 DNS 指向（将你想要的域名指向 Vercel/Netlify 提供的记录）。
- 自定义域名生效后，访问将不会包含 `chatgpt.com`，而是你的域名。

管理员账号： admin@shuiba.local / adminpass

注意：目前项目使用 localStorage 存储数据，没有后端数据库。若需要生产环境的订单持久化和用户验证，建议使用 Firebase / Supabase / 或自建后端。
