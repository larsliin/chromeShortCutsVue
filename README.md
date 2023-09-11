# Vite Vue Commands Readme

This readme provides a quick reference for commonly used Vite commands when working with an existing Vue.js project. Vite is a build tool that is specifically designed for building modern web applications. It offers rapid development and production-ready builds.

## Available Commands

### 1. `npx vite`

This command starts a development server that serves your Vue.js application in development mode. It provides features like hot module replacement (HMR) for a fast and enjoyable development experience.

To run your existing Vite Vue application in development mode, open your terminal and navigate to your project directory. Then, execute:

npx vite

This will start the development server, and you can access your application in your web browser at http://localhost:3000.

### 2. npx vite build

The build command is used to generate a production-ready build of your Vue.js application. This will bundle and optimize your code for deployment.

To create a production build for your existing project, navigate to your project directory and run:

npx vite build

This command will generate optimized assets and place them in the dist directory of your project.

###  3. npx vite build --watch

The build --watch command is similar to the build command, but it watches for changes in your source code and automatically rebuilds your application whenever you make changes. This is useful during development when you want to continually test and optimize your application.

To start the watch mode for your production build in your existing project, run the following command:

npx vite build --watch

# Conclusion
These are some of the fundamental Vite commands you can use with your existing Vue.js project. They provide an efficient development environment and tools to prepare your application for production deployment. Explore more Vite features and options in the official Vite documentation: https://vitejs.dev/.