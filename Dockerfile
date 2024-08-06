FROM node:20-alpine as build-stage

WORKDIR /app
RUN corepack enable

# Copy only the package management files first
COPY .npmrc package.json pnpm-lock.yaml ./
COPY scripts ./scripts/

RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store \
    pnpm add esno && \
    pnpm install --frozen-lockfile

# Copy the entire project
COPY . .

# Build the project
RUN pnpm build

FROM nginx:stable-alpine as production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
