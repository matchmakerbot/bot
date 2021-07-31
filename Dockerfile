#Eu FROM node:12.19.0-buster
FROM node:14-buster

#app dir
WORKDIR /app

#dependencies
COPY . .
RUN yarn install --production --frozen-lockfile --ignore-scripts
EXPOSE 3000

CMD [ "yarn", "run", "prod"]