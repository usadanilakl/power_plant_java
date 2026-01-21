#!/bin/bash
# Restart script for power_plant_java after resync
# Uses graceful shutdown via Spring Boot Actuator

echo "Restarting application after resync..."

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Try graceful shutdown via actuator endpoint first
echo "Attempting graceful shutdown..."
curl -s -X POST http://localhost:8080/actuator/shutdown > /dev/null 2>&1

# Wait for the application to shut down gracefully (up to 35 seconds)
WAIT_COUNT=0
while [ $WAIT_COUNT -lt 18 ]; do
    sleep 2
    WAIT_COUNT=$((WAIT_COUNT + 1))

    # Check if the app is still running by trying to connect
    if ! curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
        echo "Application shut down gracefully."
        break
    fi
done

# If still running after 35 seconds, force kill as fallback
if curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
    echo "Graceful shutdown timed out, forcing termination..."
    pkill -f "power_plant_java.*\.jar" 2>/dev/null
    sleep 2
fi

# Start the application again
echo "Starting application..."
cd "$SCRIPT_DIR"
nohup java -jar power_plant_java-1.jar > app.log 2>&1 &

echo "Application restart initiated."
