# ===============================================
# BUILDER STAGE
# This step builds the project
# ===============================================

# use the latest nodeJS LTS
FROM node:10 AS BUILDER

# create the project directory on BUILDER
WORKDIR /usr/src/infominer

# copy all of the project files
COPY . .

# install the project
RUN npm install

# ===============================================
# PRODUCTION STAGE
# This state prepares the project for production
# Docker will use the existing built project in
# BUILDER and move it
# ===============================================

# use the latest nodeJS LTS
FROM node:10 AS PRODUCTION

# create the project directory
WORKDIR /usr/src/infominer

# copy the project package; used to run commands
COPY package*.json ./
# install the dependencies (only those used in production)
RUN npm install --production

# install PM2
RUN npm install pm2 -g
# copy PM2 configuration
COPY ecosystem.config.yml ./

# copy the built project from the BUILDER to production
COPY --from=BUILDER /usr/src/infominer/src ./src

# expose the port
EXPOSE 3000
# start the PM2 process and the service
CMD ["pm2-runtime", "start", "ecosystem.config.yml"]