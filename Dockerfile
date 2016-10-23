FROM node:4.2-wheezy

# Install dependencies
RUN apt-get update && apt-get install -y git-core ssh 

# Copy files
ADD . /root/oden-dokku-updater/
WORKDIR /root/oden-dokku-updater/

# Install modules
RUN npm install --production

# Run the server
EXPOSE 8080
ENTRYPOINT ["npm", "start"]
