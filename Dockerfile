FROM node:18.15-alpine3.17

WORKDIR /app
COPY . .
RUN apk add --no-cache \
    udev \
    ttf-freefont \
    chromium
RUN npm install

CMD node .