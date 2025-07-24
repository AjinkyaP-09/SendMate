# Dockerfile (place in root directory)

# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# CORRECTED: Since the build context is the 'backend' folder, 
# we copy directly from the root of the context.
COPY package*.json ./

# Install application dependencies
RUN npm install

# CORRECTED: Copy all files from the context's root (which is your backend folder)
# into the container's working directory.
COPY . .

# Expose the correct port your app runs on
EXPOSE 5000

# The command to run your application
CMD [ "node", "server.js" ]
