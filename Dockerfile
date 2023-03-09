FROM alpine:3.17

RUN apk add --no-cache nodejs npm yarn

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn
COPY . .
RUN yarn build:server
