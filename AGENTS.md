# AGENTS.md

本文件为 AI 代理在本仓库中工作的项目指南，记录项目背景，随需求推进更新。

## 项目背景

`TallyUp`（中文名“记高一筹”）是面向 C 端用户的个人记账服务，目标是让用户快捷地记录支出和收入，并给出合理的分析和建议。

- 名称含义：“记高一筹”谐音“技高一筹”——每记一笔，就在开源节流上“技高一筹”。
- 需要账号体系，支持多用户。
- 前端：网页端 + APP，网页端用 Vite + React + TypeScript 做单页应用。后端：Python。数据库：MySQL。
- 网页端登录方式：账号密码加图形验证码。路由用 React Router v7（v8 要求 Node ≥ 22.22，本机 Node 20 用不了）。
- 代码组织：Monorepo，根目录是 pnpm workspace（`apps/*`、`packages/*`）。网页端在 `apps/web`，开发服务器端口 8888；`packages/` 预留给多端共享的代码，暂未创建。
- 代码规范：Oxlint 和 Prettier 配置在仓库根目录，全仓库共用一套，子项目不单独配置。在根目录执行 `pnpm lint`、`pnpm format`

## 待定项

以下尚未确定，实施前先问用户，不要自行假设：

- “分析和建议”的设计。
- APP 技术栈，以及后端框架、APP 和后端的目录、表结构。
- 账本共享：第一版只做单人，后续可能要支持情侣共用一本账。

## 本机环境

2026-11-24 查看：Node 20.19.6、pnpm 10.15.1、Python 3.11.2、MySQL 8.0.32，未安装 uv 和 Docker。

## 设计规范

- 新增或修改 Web 界面前读取 [Web 设计规范](design-system/web/MASTER.md)，新增或修改 App 界面前读取 [App 设计规范](design-system/app/MASTER.md)。
- 对应端的 `design-system/<端>/pages/<页面名>.md` 存在时，应用其中明确写出的页面差异。其他条目沿用该端的主规范。跨端基础色值统一维护在 Web 规范的「跨端基础色」一节。

## 协作约定

- 项目仍在梳理需求，技术设计由用户逐步确定。AI 现阶段只了解背景，不要提前做技术设计或搭建代码。
- 提交信息遵循 Conventional Commits：格式为 `类型(范围): 描述`，例如 `feat(web): 新增记账页面`。类型只用 feat、fix、docs、style、refactor、perf、test、build、ci、chore；范围写涉及的子项目名，涉及全仓库时省略；描述用中文，说明做了什么。
- 需求有变化时更新本文件，过时的内容直接删掉。
