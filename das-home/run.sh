#!/usr/bin/with-contenv bashio

export DAS_HOME_DATA_DIR="/config/das-home"
export DAS_HOME_PORT=5050

# Get debug setting
if bashio::config.true 'debug'; then
    export DAS_HOME_DEBUG=true
fi

mkdir -p "$DAS_HOME_DATA_DIR"

bashio::log.info "Starting das-home..."
exec python -m uvicorn backend.app.main:app --host 0.0.0.0 --port ${DAS_HOME_PORT}
