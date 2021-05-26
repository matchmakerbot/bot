FROM node:12.19.0-buster

#app dir
WORKDIR /

#dependencies
COPY . .
RUN yarn install --production --frozen-lockfile --ignore-scripts
EXPOSE 3000

CMD [ "yarn", "run", "prod"]