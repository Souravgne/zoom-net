# syntax=docker/dockerfile:1

# ----------------- BUILDER -----------------
# This stage installs all dependencies (including dev) and builds the app.
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Copy all source code
# The .dockerignore file will exclude node_modules, .git, etc.
COPY . .

# Install all dependencies (including dev dependencies)
# This will also link the local packages (workspaces)
RUN npm install

# Build the specific application
RUN npm run build --workspace=@zoom-net/worker


# ----------------- PRODUCTION -----------------
# This stage creates the final production image.
FROM node:18-alpine AS production

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Copy only the necessary files from the builder stage
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/packages ./packages
COPY --from=builder /usr/src/app/apps/worker ./apps/worker

# Install ONLY production dependencies for the entire monorepo
# This is simpler and ensures all workspace dependencies are available
RUN npm install --omit=dev

# The final image will only contain the built code for the target app
# and the production node_modules. We will create a clean layer for that.
FROM node:18-alpine

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY --from=production /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/apps/worker/dist ./dist
COPY /apps/worker/package.json ./package.json

CMD [ "node", "dist/index.js" ]
