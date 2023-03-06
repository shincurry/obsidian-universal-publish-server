FROM alpine:3.17

RUN apk add --no-cache python3 py3-pip
RUN apk add --no-cache nodejs npm yarn

WORKDIR /app

RUN pip install mkdocs-material mkdocs-roamlinks-plugin mkdocs-mermaid2-plugin
RUN pip install Pygments
RUN pip install jieba
RUN pip install pillow cairosvg

COPY package.json yarn.lock ./
RUN yarn
COPY index.js ./