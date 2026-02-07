# 构建阶段 - 使用多平台支持的基础镜像（支持ARM和X86）
FROM nginx:alpine AS builder

# 复制静态文件到nginx默认目录
WORKDIR /usr/share/nginx/html

COPY index.html .
COPY style.css .
COPY game.js .

# 生产阶段（支持ARM和X86）
FROM nginx:alpine

# 从构建阶段复制文件
COPY --from=builder /usr/share/nginx/html /usr/share/nginx/html

# 复制nginx配置文件
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 8081

# nginx默认启动命令已包含，无需额外CMD
