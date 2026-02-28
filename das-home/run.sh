#!/usr/bin/with-contenv bashio

export DAS_HOME_DATA_DIR="/config/das-home"
export DAS_HOME_PORT=5050
export DAS_HOME_HASS_URL="http://supervisor/core"

# Get debug setting
if bashio::config.true 'debug'; then
    export DAS_HOME_DEBUG=true
fi

mkdir -p "$DAS_HOME_DATA_DIR"

bashio::log.info "Starting das-home on port ${DAS_HOME_PORT}..."
exec python -m uvicorn app.main:app --host 0.0.0.0 --port ${DAS_HOME_PORT}
