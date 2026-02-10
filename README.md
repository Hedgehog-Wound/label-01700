# 斗地主小游戏项目

## How to Run

### 前置要求
- Docker 和 Docker Compose 已安装
- 确保端口 8081 未被占用

### 启动步骤

1. 进入项目目录
```bash
确保进入根目录
```

2. 使用 Docker Compose 启动服务
```bash
docker-compose up --build -d
```

3. 访问游戏
- 用户端（游戏界面）: http://localhost:8081

4. 停止服务
```bash
docker-compose down
```

5. 查看日志
```bash
docker-compose logs -f
```

### 验证多平台支持

验证镜像是否支持 ARM 架构（Apple Silicon）：
```bash
docker pull --platform linux/arm64 nginx:alpine
```

## Services

### Frontend-User (用户端)
- **端口**: 8081
- **技术栈**: HTML5 + CSS3 + JavaScript (ES6 Modules)
- **功能**:
  - 斗地主游戏主界面
  - 发牌、抢地主、出牌功能
  - 作弊功能（查看所有手牌、获得最好手牌）
  - 主菜单界面
  - 游戏规则说明

## 测试账号

本项目为演示项目，无需登录，可直接访问：
- 用户端: 直接访问 http://localhost:8081 即可开始游戏

## 题目内容

我需要你做一个简单发斗地主小游戏 包含html js css文件 添加作弊功能

1.命名规范后端项目文件名叫backend 管理后台 frontend-admin 小程序 frontend-mp 用户端 frontend-user（以此类推）
2.每个子项目中编写一个Dodckerfile （需要包含编译过程、基础镜像要选用跨平台版本 同时支持 ARM 和 X86， 可以使用 ` docker pull --platform linux/arm64 镜像名:tag` 命令验证镜像是否可以在 arm 环境下使用，因为验收人员使用苹果电脑
3.根目录增加 docker-compose.yml 和 .gitignore 和 README.md
4.确保 docker-compose up --build -d 可以正确运行项目。
5.前端项目的对外映射端口为 8081 ，如有两个就是 8081、8082。
6..gitignore 中需要包含所有子项目需要忽略的文件。
7.README.md 中除了要包含你的项目介绍，需要在最前面增加三个二级标题 1 How to Run  2 Services  3 测试账号 4 题目内容(填写原始prompt内容)

## 项目介绍

这是一个完整的斗地主小游戏项目，采用模块化架构设计，代码结构清晰，易于维护。

### 主要特性

1. **完整的游戏功能**
   - 发牌系统（3个玩家，每人17张，3张底牌）
   - 抢地主功能（轮流叫分）
   - 出牌系统（单张、对子、三张、炸弹等牌型）
   - AI自动出牌
   - 游戏状态管理

2. **作弊功能**
   - 查看所有玩家手牌
   - 获得最好手牌
   - 开局时选择作弊方式，选择后不可更改

3. **用户体验优化**
   - 主菜单界面
   - 流程提示（显示当前游戏状态）
   - 操作记录（保留所有历史记录）
   - 美观的UI设计
   - 增大的牌面显示

4. **代码架构**
   - 模块化设计（ES6 Modules）
   - 代码分离（配置、卡片、游戏逻辑、AI、UI等）
   - 完善的注释
   - 错误处理和验证

5. **Docker 容器化**
   - 支持 ARM 和 X86 架构
   - 一键启动所有服务

### 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6 Modules)
- **容器化**: Docker, Docker Compose
- **Web服务器**: Nginx
- **代码组织**: ES6 Modules

### 项目结构

```
1700/
├── frontend-user/        # 用户端
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── index.html
│   ├── style.css
│   └── js/               # JavaScript模块
│       ├── main.js       # 主入口
│       ├── config.js     # 配置常量
│       ├── card.js       # 卡片相关功能
│       ├── gameState.js  # 游戏状态管理
│       ├── cardValidator.js # 牌型验证
│       ├── ai.js         # AI逻辑
│       ├── gameLogic.js  # 游戏核心逻辑
│       ├── ui.js         # UI显示
│       └── tests/        # 测试文件
│           └── card.test.js
├── docker-compose.yml    # Docker Compose 配置
├── .gitignore           # Git 忽略文件
└── README.md            # 项目说明文档
```

### 代码模块说明

- **config.js**: 游戏配置常量（牌的定义、游戏规则等）
- **card.js**: 卡片相关功能（创建牌堆、洗牌、排序、验证唯一性）
- **gameState.js**: 游戏状态管理（创建、重置状态）
- **cardValidator.js**: 牌型验证（验证牌型、判断能否压过）
- **ai.js**: AI玩家逻辑（AI出牌、AI叫分）
- **gameLogic.js**: 游戏核心逻辑（发牌、抢地主、出牌等）
- **ui.js**: UI显示和交互（显示手牌、更新界面、显示消息）
- **main.js**: 主入口（初始化菜单、绑定事件）

### 开发说明

所有 Dockerfile 都使用了跨平台支持的基础镜像（`nginx:alpine`），该镜像支持 ARM（Apple Silicon）和 X86 架构，可以在不同平台上正常运行。

### 注意事项

- 确保 Docker 已正确安装并运行
- 首次运行需要构建镜像，可能需要一些时间
- 如果端口被占用，请修改 docker-compose.yml 中的端口映射
- 游戏使用ES6模块，需要现代浏览器支持