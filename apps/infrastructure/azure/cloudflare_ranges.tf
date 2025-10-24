# This file configures Container Apps to only accept traffic from Cloudflare IPs

# Note: The IP restrictions are applied directly in the Container Apps configuration
# See container_apps_backend.tf for the IP security restrictions

# Data source to get Cloudflare IPv4 ranges
data "http" "cloudflare_ips_v4" {
  url = "https://www.cloudflare.com/ips-v4"
}

# Data source to get Cloudflare IPv6 ranges
data "http" "cloudflare_ips_v6" {
  url = "https://www.cloudflare.com/ips-v6"
}

locals {
  # Parse Cloudflare IP ranges (remove empty lines)
  cloudflare_ipv4_list = [for ip in split("\n", trimspace(data.http.cloudflare_ips_v4.response_body)) : ip if ip != ""]
  cloudflare_ipv6_list = [for ip in split("\n", trimspace(data.http.cloudflare_ips_v6.response_body)) : ip if ip != ""]

  # Combine all IP ranges
  all_cloudflare_ips = concat(local.cloudflare_ipv4_list, local.cloudflare_ipv6_list)
}

