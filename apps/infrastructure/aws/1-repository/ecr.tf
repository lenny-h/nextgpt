# ECR Repositories
resource "aws_ecr_repository" "api" {
  name                 = "${var.aws_project_name}/api"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false
  }

  tags = {
    Name = "${var.aws_project_name}-api"
  }
}

resource "aws_ecr_repository" "document_processor" {
  name                 = "${var.aws_project_name}/document-processor"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false
  }

  tags = {
    Name = "${var.aws_project_name}-document-processor"
  }
}

resource "aws_ecr_repository" "pdf_exporter" {
  name                 = "${var.aws_project_name}/pdf-exporter"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false
  }

  tags = {
    Name = "${var.aws_project_name}-pdf-exporter"
  }
}

resource "aws_ecr_repository" "db_migrator" {
  name                 = "${var.aws_project_name}/db-migrator"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false
  }

  tags = {
    Name = "${var.aws_project_name}-db-migrator"
  }
}

resource "aws_ecr_repository" "firecrawl_api" {
  name                 = "${var.aws_project_name}/firecrawl-api"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false
  }

  tags = {
    Name = "${var.aws_project_name}-firecrawl-api"
  }
}

resource "aws_ecr_repository" "firecrawl_playwright" {
  name                 = "${var.aws_project_name}/firecrawl-playwright"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false
  }

  tags = {
    Name = "${var.aws_project_name}-firecrawl-playwright"
  }
}

# ECR Lifecycle Policies - Keep last 5 images
resource "aws_ecr_lifecycle_policy" "api" {
  repository = aws_ecr_repository.api.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 5 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 5
      }
      action = {
        type = "expire"
      }
    }]
  })
}

resource "aws_ecr_lifecycle_policy" "document_processor" {
  repository = aws_ecr_repository.document_processor.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 5 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 5
      }
      action = {
        type = "expire"
      }
    }]
  })
}

resource "aws_ecr_lifecycle_policy" "pdf_exporter" {
  repository = aws_ecr_repository.pdf_exporter.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 5 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 5
      }
      action = {
        type = "expire"
      }
    }]
  })
}

resource "aws_ecr_lifecycle_policy" "db_migrator" {
  repository = aws_ecr_repository.db_migrator.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 5 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 5
      }
      action = {
        type = "expire"
      }
    }]
  })
}

resource "aws_ecr_lifecycle_policy" "firecrawl_api" {
  repository = aws_ecr_repository.firecrawl_api.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 5 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 5
      }
      action = {
        type = "expire"
      }
    }]
  })
}

resource "aws_ecr_lifecycle_policy" "firecrawl_playwright" {
  repository = aws_ecr_repository.firecrawl_playwright.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 5 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 5
      }
      action = {
        type = "expire"
      }
    }]
  })
}
