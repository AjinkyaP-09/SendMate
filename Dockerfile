# Dockerfile (place in root directory)

# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json from the backend folder
COPY backend/package*.json ./

# Install application dependencies
RUN npm install

# Copy the rest of your application's source code from the backend folder
COPY backend/ .

# Expose the new port your app runs on
EXPOSE 5000

# The command to run your application
CMD [ "node", "server.js" ]
