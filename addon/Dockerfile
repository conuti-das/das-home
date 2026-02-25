ARG BUILD_FROM
FROM ${BUILD_FROM}

# Install Node.js for frontend build
RUN apk add --no-cache nodejs npm python3 py3-pip

# Enable corepack for pnpm
RUN corepack enable

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt

# Build frontend
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/.npmrc ./frontend/
RUN cd frontend && pnpm install --frozen-lockfile
COPY frontend/ ./frontend/
RUN cd frontend && pnpm build

# Copy backend
COPY backend/ ./backend/

# Copy run script
COPY addon/run.sh /
RUN chmod a+x /run.sh

CMD [ "/run.sh" ]
