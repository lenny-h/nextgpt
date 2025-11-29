param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectId,
    
    [Parameter(Mandatory = $true)]
    [string]$Region,
    
    [switch]$SkipFirecrawl,

    [Parameter(Mandatory = $false)]
    [string[]]$Service
)

$ErrorActionPreference = "Stop"

$Repo = "$Region-docker.pkg.dev/$ProjectId/app-artifact-repository"

if ($Service) {
    $Services = $Service
    Write-Host "Building specific services: $($Services -join ', ')" -ForegroundColor Yellow
}
else {
    $Services = @("api", "pdf-exporter", "document-processor", "db-migrator")

    if (-not $SkipFirecrawl) {
        $Services += @("firecrawl-api", "firecrawl-playwright")
        Write-Host "Including Firecrawl services in build..." -ForegroundColor Yellow
    }
    else {
        Write-Host "Skipping Firecrawl services..." -ForegroundColor Yellow
    }
}

# Install QEMU emulation support for cross-platform builds
Write-Host "Installing QEMU emulation support..." -ForegroundColor Cyan
docker run --privileged --rm tonistiigi/binfmt --install all
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Failed to install QEMU emulation support. Cross-platform builds might fail."
}

foreach ($Service in $Services) {
    Write-Host "Building and pushing $Service..." -ForegroundColor Green

    # Define the original local image name and the cloud repository image name
    switch ($Service) {
        "firecrawl-api" {
            $CloudImage = "$Repo/firecrawl-api:latest"
        }
        "firecrawl-playwright" {
            $CloudImage = "$Repo/firecrawl-playwright:latest"
        }
        default {
            $CloudImage = "$Repo/${Service}:latest"
        }
    }

    # Build the image with its original name if it doesn't exist
    $imageExists = docker images --format "{{.Repository}}:{{.Tag}}" | Select-String -Pattern "^$([regex]::Escape($CloudImage))$" -Quiet
    
    if (-not $imageExists) {
        if ($Service -eq "firecrawl-api" -or $Service -eq "firecrawl-playwright") {
            Write-Error "Error: $CloudImage must exist locally. Please build it first."
            exit 1
        }
        else {
            Write-Host "Building $Service from apps/$Service/Dockerfile..." -ForegroundColor Cyan
            docker buildx build --platform linux/amd64 -f "apps/$Service/Dockerfile" -t $CloudImage .
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Docker build failed for $Service"
                exit 1
            }
        }
    }
    else {
        Write-Host "Image $CloudImage already exists locally. Skipping build." -ForegroundColor Yellow
    }

    # Push to cloud repository
    Write-Host "Pushing $CloudImage..." -ForegroundColor Cyan
    docker push $CloudImage
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Docker push failed for $CloudImage"
        exit 1
    }
}

Write-Host "All images have been built and pushed successfully." -ForegroundColor Green
