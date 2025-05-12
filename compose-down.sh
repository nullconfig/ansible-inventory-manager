# WSL podman cleanup 
podman-compose -f compose.yaml down
for port in {5000,3000};do port=$(lsof -i tcp:$port | awk '{print $2}' | grep -v PID) && kill -9 $port ; done