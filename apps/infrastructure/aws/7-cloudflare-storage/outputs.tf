output "setup_instructions" {
  description = "Setup instructions for Cloudflare R2 storage"
  value       = <<-EOT
    
    📋 CLOUDFLARE R2 STORAGE SETUP COMPLETE
    
    ✅ Created two R2 buckets: ${cloudflare_r2_bucket.files_bucket.name} and ${cloudflare_r2_bucket.temporary_files_bucket.name}
    
    📝 Next Steps:
    
    1️⃣ Create R2 API tokens
       In Cloudflare Dashboard:
       - Go to R2 > Manage R2 API Tokens
       - Create API Token with Object Read & Write permissions
       - Save the Access Key ID and Secret Access Key
    
    2️⃣ Update your secrets in 2-db-storage
       Add the R2 credentials to terraform.tfvars:
       - cloudflare_access_key_id
       - cloudflare_secret_access_key
    
    3️⃣ Update your application configuration
       Set these environment variables:
       - USE_CLOUDFLARE_R2=true
       - R2_ENDPOINT=https://${var.cloudflare_account_id}.r2.cloudflarestorage.com
    
  EOT
}
