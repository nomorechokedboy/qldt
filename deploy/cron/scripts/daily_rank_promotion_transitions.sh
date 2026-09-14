#!/bin/sh
# File: ./cron/scripts/daily_rank_promotion_transitions.sh
# Daily rank-promotion-proposal scheduled transitions script

set -e

APP_URL="${APP_URL:-http://app:8080}"
ENDPOINT="/rank-promotion-proposals/cron"
TIMEOUT=30
MAX_RETRIES=3

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

check_app_health() {
    local retries=0
    while [ $retries -lt $MAX_RETRIES ]; do
        if curl -f -s --connect-timeout $TIMEOUT "${APP_URL}/healthz" > /dev/null 2>&1; then
            return 0
        fi
        retries=$((retries + 1))
        log "Health check failed, retry $retries/$MAX_RETRIES"
        sleep 5
    done
    return 1
}

main() {
    log "Starting daily rank promotion proposal transitions job"

    if ! check_app_health; then
        log "ERROR: App health check failed after $MAX_RETRIES attempts"
        exit 1
    fi

    log "Calling endpoint: ${APP_URL}${ENDPOINT}"

    if curl -f -s --connect-timeout $TIMEOUT -X GET "${APP_URL}${ENDPOINT}"; then
        log "SUCCESS: Daily rank promotion proposal transitions completed"
    else
        log "ERROR: Daily rank promotion proposal transitions failed"
        exit 1
    fi
}

main "$@"
