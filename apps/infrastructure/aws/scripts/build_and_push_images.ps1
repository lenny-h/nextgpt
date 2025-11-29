param(
    [Parameter(Mandatory = $true)]
    [string]$AwsAccountId,
    
    [Parameter(Mandatory = $true)]
    [string]$Region,
    
    [Parameter(Mandatory = $true)]
    [string]$ProjectName,
    
    [switch]$SkipFirecrawl,

    [Parameter(Mandatory = $false)]
    [string[]]$Service
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

    # Define the ECR image name
    $EcrImage = "$Repo/${Service}:latest"

    # Build the image with its original name if it doesn't exist
    $imageExists = docker images --format "{{.Repository}}:{{.Tag}}" | Select-String -Pattern "^$([regex]::Escape($EcrImage))$" -Quiet
    
    if (-not $imageExists) {
        if ($Service -eq "firecrawl-api" -or $Service -eq "firecrawl-playwright") {
            Write-Error "Error: $EcrImage must exist locally. Please build it first."
            exit 1
        }
        else {
            Write-Host "Building $Service from apps/$Service/Dockerfile..." -ForegroundColor Cyan
            docker buildx build --platform linux/arm64 -f "apps/$Service/Dockerfile" -t $EcrImage .
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Docker build failed for $Service"
                exit 1
            }
        }
    }
    else {
        Write-Host "Image $EcrImage already exists locally. Skipping build." -ForegroundColor Yellow
    }

    # Push to ECR
    Write-Host "Pushing $EcrImage..." -ForegroundColor Cyan
    docker push $EcrImage
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Docker push failed for $EcrImage"
        exit 1
    }
}

Write-Host "All images have been built and pushed successfully." -ForegroundColor Green
