# Getting Started with NextGPT

This guide will help you understand the NextGPT platform architecture and get your development environment up and running.

## Table of Contents

- [Overview](#overview)
- [Monorepo Architecture](#monorepo-architecture)
  - [Applications](#applications)
  - [Packages](#packages)
  - [Infrastructure](#infrastructure)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Overview

NextGPT is a platform designed to deploy a secure AI interface with integrated document and web search capabilities. It enables enterprises to maintain control and sovereignty over their data by hosting their own AI infrastructure on major cloud providers (AWS, Google Cloud, or Azure).

### Key Features

- **AI-Powered Chat Interface**: Conversational AI with context from documents and web search
- **Document Management**: Upload, process, and search documents using semantic embeddings
- **RAG (Retrieval-Augmented Generation)**: Enhances AI responses with relevant document context
- **Multi-Cloud Support**: Deploy to AWS or Google Cloud (Azure support coming soon)
- **SSO Integration**: Authentication via OIDC providers (Keycloak, Auth0, Okta, etc.)

## Monorepo Architecture

NextGPT is organized as a **pnpm workspace monorepo** using **Turbo** for build orchestration. The repository is divided into three main sections: applications, packages, and infrastructure.

### Applications

Located in the `apps/` directory, these are the deployable services that make up the NextGPT platform:

#### **api** (`apps/api`)

The core backend API service built with Hono.js.

- **Purpose**: Handles all API requests including chat, document queries, user management, and AI interactions
- **Tech Stack**: Hono.js (lightweight web framework), TypeScript, Node.js
- **Key Responsibilities**:
  - AI chat endpoints with streaming support
  - Document search and RAG functionality
  - User authentication and authorization
  - Integration with AI models (OpenAI, Anthropic, etc.)
  - Vector search via PostgreSQL with pgvector
- **Port**: 3004 (local), 8080 (container)

#### **dashboard** (`apps/dashboard`)

Administrative dashboard built with Next.js.

- **Purpose**: Provides a management interface for administrators to configure the platform
- **Tech Stack**: Next.js 16, React 19, TypeScript, TailwindCSS
- **Key Features**:
  - Document upload and management
  - User and organization management
  - Permission configuration
- **Port**: 3001 (local), 3000 (container)

#### **web** (`apps/web`)

The main user-facing web application built with Next.js.

- **Purpose**: The primary interface where users interact with the AI chat and search documents
- **Tech Stack**: Next.js 16, React 19, TypeScript, TailwindCSS
- **Key Features**:
  - AI chat interface with streaming responses
  - Document search and display
  - Web search integration
  - Responsive design for mobile and desktop
- **Port**: 3000 (local), 3000 (container)

#### **db-migrator** (`apps/db-migrator`)

Database migration orchestrator.

- **Purpose**: Manages database schema migrations and initialization
- **Tech Stack**: Shell scripts, Drizzle ORM migrations
- **Key Responsibilities**:
  - Runs database migrations on deployment
  - Ensures schema consistency across environments
  - Handles PostgreSQL extensions setup
- **Usage**: Typically run as an init container or one-time job

#### **document-processor** (`apps/document-processor`)

Background document processing service.

- **Purpose**: Asynchronously processes uploaded documents to extract text and generate embeddings
- **Tech Stack**: Python, Docling
- **Key Responsibilities**:
  - Extract text from PDFs, DOCX, and other formats
  - Generate vector embeddings for semantic search
  - Store processed data in PostgreSQL
  - Handle document chunking and metadata extraction
- **Processing**: Triggered by document upload events (via queue or cron)

#### **pdf-exporter** (`apps/pdf-exporter`)

PDF generation service.

- **Purpose**: Generates PDF exports of files
- **Tech Stack**: Node.js, TypeScript, PDF generation libraries
- **Port**: 3005 (local), 8080 (container)

#### **postgres** (`apps/postgres`)

Custom PostgreSQL Docker image.

- **Purpose**: Provides a PostgreSQL database with required extensions
- **Tech Stack**: PostgreSQL 18, pgvector, pg_cron, pg_trgm
- **Extensions**:
  - **pgvector**: Enables vector similarity search for embeddings
  - **pg_cron**: Scheduled job execution within PostgreSQL
  - **pg_trgm**: Trigram-based text search
  - **uuid-ossp**: UUID generation
- **Port**: 5432

### Packages

Located in the `packages/` directory, these are shared libraries used across multiple applications:

#### **server** (`packages/server`)

Core backend utilities and database layer.

- **Purpose**: Shared backend logic, database models, and utilities
- **Key Components**:
  - Drizzle ORM schema definitions
  - Database connection and query utilities
  - Type definitions for database models
  - Migration files

#### **api-routes** (`packages/api-routes`)

Shared API route definitions and clients.

- **Purpose**: Type-safe API contracts and client generators
- **Key Components**:
  - API route definitions
  - Request/response types
  - Client SDK for API consumption

#### **ui** (`packages/ui`)

Shared React component library.

- **Purpose**: Reusable UI components used across frontend applications
- **Tech Stack**: React, TailwindCSS, Radix UI
- **Key Components**:
  - Form components (inputs, buttons, selects)
  - Layout components (cards, containers)
  - Data display components (tables, lists)
  - Feedback components (toasts, alerts)
- **Used By**: web, dashboard

#### **eslint-config** (`packages/eslint-config`)

Shared ESLint configurations.

- **Purpose**: Consistent code linting across the monorepo
- **Configurations**:
  - Base configuration for all TypeScript projects
  - Next.js-specific rules
  - React component rules
- **Used By**: All applications and packages

#### **typescript-config** (`packages/typescript-config`)

Shared TypeScript configurations.

- **Purpose**: Consistent TypeScript compiler settings
- **Configurations**:
  - Base configuration for all projects
  - Next.js-specific settings
  - React library configuration
- **Used By**: All TypeScript projects

### Infrastructure

Located in the `apps/infrastructure/` directory, contains infrastructure-as-code for cloud deployments:

#### **aws** (`apps/infrastructure/aws`)

Terraform configurations for AWS deployment.

- **Resources Provisioned**:
  - ECS Fargate for container orchestration
  - RDS PostgreSQL with pgvector
  - S3 for file storage
  - ElastiCache Redis for caching
  - ALB for load balancing
  - VPC, subnets, and security groups
  - Secrets Manager for credentials
  - CloudWatch for monitoring

#### **gcloud** (`apps/infrastructure/gcloud`)

Terraform configurations for Google Cloud deployment.

- **Resources Provisioned**:
  - Cloud Run for container orchestration
  - Cloud SQL for PostgreSQL
  - Cloud Storage for file storage
  - Memorystore Redis for caching
  - Cloud Load Balancing
  - VPC and firewall rules
  - Secret Manager for credentials
  - Cloud Logging and Monitoring

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 24 or higher (check with `node --version`)
- **pnpm**: Version 10.24.0 or higher (check with `pnpm --version`)
  - Install: `npm install -g pnpm@10.24.0`
- **Docker**: Latest version (check with `docker --version`)
- **Docker Compose**: Latest version (check with `docker-compose --version`)
- **Git**: For version control

### Optional Prerequisites

- **Python**: 3.10+ (for document-processor development)
- **Terraform**: Latest version (for infrastructure deployment)
- **AWS CLI** or **gcloud CLI**: For cloud deployments

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd mono
```

### 2. Install Dependencies

```bash
pnpm install
```

This installs all dependencies for all packages and applications in the monorepo.

### 3. Build Required Docker Images

#### PostgreSQL with Extensions

```bash
cd apps/postgres
docker build -t firecrawl-postgres .
cd ../..
```

#### Firecrawl (Optional)

If you want to use web scraping functionality:

```bash
# Clone the Firecrawl repository
git clone https://github.com/firecrawl/firecrawl.git /tmp/firecrawl

# Build Firecrawl API
cd /tmp/firecrawl/api
docker build -t firecrawl-api .

# Build Playwright service
cd ../playwright-service
docker build -t firecrawl-playwright .
```

> **Note**: Firecrawl currently has known issues. See README for alternatives.

### 4. Configure Environment Variables

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration.

### 5. Start Infrastructure Services

Start the core infrastructure services using Docker Compose:

```bash
docker-compose up -d
```

This starts:

- PostgreSQL with pgvector
- Redis for caching and job queues
- MinIO for object storage
- Keycloak for SSO (optional)
- Document processor (optional)

Wait a few seconds for services to be ready.

### 6. Start Development Services

Start all applications in development mode with hot-reloading:

```bash
pnpm run dev
```

Or start specific services:

```bash
# Start only the web app
pnpm run dev --filter=web

# Start API and web
pnpm run dev --filter=api --filter=web

# Start dashboard
pnpm run dev --filter=dashboard
```

### 8. Access the Applications

- **Web App**: http://localhost:3000
- **Dashboard**: http://localhost:3001
- **API**: http://localhost:3004
- **MinIO Console**: http://localhost:9001
- **Keycloak Admin**: http://localhost:8080

## Development Workflow

### Code Organization

- **Frontend code**: `apps/web/` and `apps/dashboard/`
- **Backend code**: `apps/api/`
- **Shared components**: `packages/ui/`
- **Database models**: `packages/server/src/drizzle/`
- **API contracts**: `packages/api-routes/`

### Working with the Database

#### Update Schema

Edit schema files in `packages/server/src/drizzle/schema/`

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

## Deployment

NextGPT supports deployment to AWS and Google Cloud. Each has a dedicated deployment guide:

### AWS Deployment

See [apps/infrastructure/aws/DEPLOYMENT_GUIDE.md](apps/infrastructure/aws/DEPLOYMENT_GUIDE.md)

### Google Cloud Deployment

See [apps/infrastructure/gcloud/DEPLOYMENT_GUIDE.md](apps/infrastructure/gcloud/DEPLOYMENT_GUIDE.md)

### Docker Deployment

For self-hosted Docker deployments:

```bash
docker-compose -f docker-compose.yml up -d
```

### Database Connection Issues

1. Ensure PostgreSQL is running:

   ```bash
   docker-compose ps postgres
   ```

2. Check database logs:

   ```bash
   docker-compose logs postgres
   ```

3. Verify connection string in `.env`

### Module Not Found Errors

Try clearing caches and reinstalling:

```bash
# Remove all node_modules
pnpm run clean

# Reinstall dependencies
pnpm install

# Rebuild
pnpm run build
```

## Common Commands

```bash
# Install all dependencies
pnpm install

# Build all packages and apps
pnpm run build

# Start all services in development
pnpm run dev

# Start specific service
pnpm run dev --filter=web

# Run linting
pnpm run lint

# Fix linting issues
pnpm run lint --fix

# Format code
pnpm run format

# Run tests
pnpm run test
```

## Next Steps

- Read the [README.md](README.md) for more details
- Check deployment guides in `apps/infrastructure/`
- Explore the codebase and start building!

## Getting Help

If you encounter issues:

1. Check this guide and the README
2. Review error messages carefully
3. Check Docker logs: `docker-compose logs <service-name>`
4. Search for existing issues in the repository
5. Open a new issue with detailed information

## Contributing

Contributions are welcome! Please:

1. Follow the code style and conventions
2. Write tests for new features
3. Update documentation as needed
4. Submit pull requests with clear descriptions

---

Happy coding! 🚀
