FROM node:12.19.0-buster

#app dir
WORKDIR /

#dependencies
COPY . .
RUN yarn install --production --frozen-lockfile --ignore-scripts


CMD [ "node", "."]