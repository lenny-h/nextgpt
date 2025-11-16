param(
    [Parameter(Mandatory = $true)]
    [string]$AwsAccountId,
    
    [Parameter(Mandatory = $true)]
    [string]$Region,
    
    [Parameter(Mandatory = $true)]
    [string]$ProjectName,
    
    [switch]$SkipFirecrawl
)

$ErrorActionPreference = "Stop"

$Repo = "$AwsAccountId.dkr.ecr.$Region.amazonaws.com/$ProjectName"

# Login to ECR
Write-Host "Logging into AWS ECR..." -ForegroundColor Cyan
$password = aws ecr get-login-password --region $Region
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to get ECR login password"
    exit 1
}
$password | docker login --username AWS --password-stdin $Repo
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to login to ECR"
    exit 1
}

$Services = @("api", "pdf-exporter", "document-processor", "db-migrator")

if (-not $SkipFirecrawl) {
    $Services += @("firecrawl-postgres", "firecrawl-api", "playwright-service")
    Write-Host "Including Firecrawl services in build..." -ForegroundColor Yellow
}
else {
    Write-Host "Skipping Firecrawl services..." -ForegroundColor Yellow
}

foreach ($Service in $Services) {
    Write-Host "Building and pushing $Service..." -ForegroundColor Green

    # Define the original local image name and the ECR image name
    switch ($Service) {
        "firecrawl-api" {
            $LocalImage = "firecrawl:latest"
            $EcrImage = "$Repo-firecrawl-api:latest"
        }
        "playwright-service" {
            $LocalImage = "firecrawl-playwright:latest"
            $EcrImage = "$Repo-playwright-service:latest"
        }
        default {
            $LocalImage = "${Service}:latest"
            $EcrImage = "$Repo-${Service}:latest"
        }
    }

    # Build the image with its original name if it doesn't exist
    $imageExists = docker images --format "{{.Repository}}:{{.Tag}}" | Select-String -Pattern "^$([regex]::Escape($LocalImage))$" -Quiet
    
    if (-not $imageExists) {
        if ($Service -eq "firecrawl-api" -or $Service -eq "playwright-service") {
            Write-Error "Error: $LocalImage must exist locally. Please build it first."
            exit 1
        }
        else {
            Write-Host "Building $Service from apps/$Service/Dockerfile..." -ForegroundColor Cyan
            docker build -f "apps/$Service/Dockerfile" -t $LocalImage .
        }
    }
    else {
        Write-Host "Image $LocalImage already exists locally. Skipping build." -ForegroundColor Yellow
    }

    # Tag the local image for ECR
    Write-Host "Tagging $LocalImage as $EcrImage..." -ForegroundColor Cyan
    docker tag $LocalImage $EcrImage

    # Push to ECR
    Write-Host "Pushing $EcrImage..." -ForegroundColor Cyan
    docker push $EcrImage
}

Write-Host "All images have been built and pushed successfully." -ForegroundColor Green
