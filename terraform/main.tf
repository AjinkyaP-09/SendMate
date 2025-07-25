# terraform/main.tf

# This block forces Terraform to use a specific modern version of the AWS
# provider, ensuring compatibility with your state file.
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "ap-south-1"
}

# Create a security group to allow SSH and HTTP traffic
resource "aws_security_group" "web_sg" {
  name        = "sendmate-sg-master"
  description = "Allow SSH and Web traffic for Sendmate"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "sendmate-sg"
  }
}

# Create an EC2 instance to run the Docker container
resource "aws_instance" "app_server" {
  ami           = "ami-0b32d400456908bf9" 
  instance_type = "t2.micro"
  key_name      = var.ec2_key_pair_name
  security_groups = [aws_security_group.web_sg.name]

  tags = {
    Name = "Sendmate-Server"
  }
}
