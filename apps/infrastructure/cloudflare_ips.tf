# # Fetch Cloudflare IP ranges from their official API
# data "http" "cloudflare_ips_v4" {
#   url = "https://www.cloudflare.com/ips-v4"
# }

# data "http" "cloudflare_ips_v6" {
#   url = "https://www.cloudflare.com/ips-v6"
# }

# locals {
#   cloudflare_ipv4_ranges = split("\n", trimspace(data.http.cloudflare_ips_v4.response_body))
#   cloudflare_ipv6_ranges = split("\n", trimspace(data.http.cloudflare_ips_v6.response_body))
#   all_cloudflare_ranges  = concat(local.cloudflare_ipv4_ranges, local.cloudflare_ipv6_ranges)
# }
