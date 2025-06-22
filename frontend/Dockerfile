# Use the slim version of the node 14 image as our base
FROM node:18-slim

# Set the working directory in the container
ENV APP_HOME /app
WORKDIR $APP_HOME

# Copy all files in the current directory into the container
COPY . .

# Set the PYTHONPATH environment variable, which is occasionally necessary for certain node packages
# 'PWD' is an environment variable that stores the path of the current working directory
ENV PYTHONPATH=$PYTHONPATH:$PWD

# Export the port on which the app will run
EXPOSE 3000

# Install 'serve', a static file serving package globally in the container
RUN npm install -g serve

# Install all the node modules required by the React app
RUN npm install

# Run the app in development mode
CMD npm run dev