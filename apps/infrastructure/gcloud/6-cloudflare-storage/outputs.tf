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
    
    2️⃣ Update your secrets in 3-core or 4-core-with-firecrawl:
       Add the R2 credentials to terraform.tfvars:
       - cloudflare_access_key_id
       - cloudflare_secret_access_key
    
    3️⃣ Terraform Apply
       Re-run 'terraform apply' in your 3-core or 4-core-with-firecrawl directory to update the infrastructure with the new R2 credentials.
    
  EOT
}
