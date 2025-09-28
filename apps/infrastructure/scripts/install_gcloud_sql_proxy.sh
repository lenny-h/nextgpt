# Check if cloud_sql_proxy is installed, install if needed
if ! command -v cloud_sql_proxy &> /dev/null; then
    echo "Installing Cloud SQL Proxy..."
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)
    
    if [ "$ARCH" = "x86_64" ]; then
        ARCH="amd64"
    elif [ "$ARCH" = "arm64" ] || [ "$ARCH" = "aarch64" ]; then
        ARCH="arm64"
    fi
    
    PROXY_URL="https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.18.2/cloud-sql-proxy.${OS}.${ARCH}"
    curl -o cloud_sql_proxy "$PROXY_URL"
    chmod +x cloud_sql_proxy
    sudo mv cloud_sql_proxy /usr/local/bin/
    echo "✓ Cloud SQL Proxy installed"
fi