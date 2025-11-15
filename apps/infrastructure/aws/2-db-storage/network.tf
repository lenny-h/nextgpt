# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.aws_project_name}-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.aws_project_name}-igw"
  }
}

# Public Subnet (Single Zone)
resource "aws_subnet" "public" {
  count                   = 1
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.0.0/24"
  availability_zone       = var.aws_zone
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.aws_project_name}-public-subnet"
  }
}

# Private Subnet (Single Zone)
resource "aws_subnet" "private" {
  count             = 1
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = var.aws_zone

  tags = {
    Name = "${var.aws_project_name}-private-subnet"
  }
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  count  = 1
  domain = "vpc"

  tags = {
    Name = "${var.aws_project_name}-nat-eip"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateway (Single Zone)
resource "aws_nat_gateway" "main" {
  count         = 1
  allocation_id = aws_eip.nat[0].id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name = "${var.aws_project_name}-nat-gw"
  }

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.aws_project_name}-public-rt"
  }
}

# Public Route Table Association
resource "aws_route_table_association" "public" {
  count          = 1
  subnet_id      = aws_subnet.public[0].id
  route_table_id = aws_route_table.public.id
}

# Private Route Table (Single Zone)
resource "aws_route_table" "private" {
  count  = 1
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[0].id
  }

  tags = {
    Name = "${var.aws_project_name}-private-rt"
  }
}

# Private Route Table Association
resource "aws_route_table_association" "private" {
  count          = 1
  subnet_id      = aws_subnet.private[0].id
  route_table_id = aws_route_table.private[0].id
}
