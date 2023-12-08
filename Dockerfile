# Use an official Node.js runtime as a parent image
FROM node:14

WORKDIR /.

COPY package*.json ./

RUN npm install

COPY . .

# Expose the port that your app will run on
EXPOSE 8080

# Start the Node.js application
CMD ["npm", "start"]
