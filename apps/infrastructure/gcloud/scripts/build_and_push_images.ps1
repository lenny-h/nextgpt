param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectId,
    
    [Parameter(Mandatory = $true)]
    [string]$Region,
    
    [switch]$SkipFirecrawl
)

$ErrorActionPreference = "Stop"

$Repo = "$Region-docker.pkg.dev/$ProjectId/app-artifact-repository"

$Services = @("api", "pdf-exporter", "document-processor", "db-migrator")

if (-not $SkipFirecrawl) {
    $Services += @("firecrawl-api", "playwright-service")
    Write-Host "Including Firecrawl services in build..." -ForegroundColor Yellow
}
else {
    Write-Host "Skipping Firecrawl services..." -ForegroundColor Yellow
}

foreach ($Service in $Services) {
    Write-Host "Building and pushing $Service..." -ForegroundColor Green

    # Define the original local image name and the cloud repository image name
    switch ($Service) {
        "firecrawl-api" {
            $LocalImage = "firecrawl:latest"
            $CloudImage = "$Repo/firecrawl-api:latest"
        }
        "playwright-service" {
            $LocalImage = "firecrawl-playwright:latest"
            $CloudImage = "$Repo/firecrawl-playwright:latest"
        }
        default {
            $LocalImage = "${Service}:latest"
            $CloudImage = "$Repo/${Service}:latest"
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

    # Tag the local image for the cloud repository
    Write-Host "Tagging $LocalImage as $CloudImage..." -ForegroundColor Cyan
    docker tag $LocalImage $CloudImage

    # Push to cloud repository
    Write-Host "Pushing $CloudImage..." -ForegroundColor Cyan
    docker push $CloudImage
}

Write-Host "All images have been built and pushed successfully." -ForegroundColor Green
