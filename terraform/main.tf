

provider "aws" {
  region = "ap-south-1" # You can change this to your preferred AWS region
}

# Create a security group to allow SSH (for Ansible) and HTTP (for web traffic)
resource "aws_security_group" "web_sg" {
  name        = "sendmate-sg"
  description = "Allow SSH and Web traffic for Sendmate"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # WARNING: Open for SSH. For production, restrict this to your IP.
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 5000
    to_port     = 5000
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
  # Amazon Linux 2 AMI for ap-south-1. Change if you use a different region.
  ami           = "ami-0b32d400456908bf9" 
  instance_type = "t2.micro" # Free tier eligible
  key_name      = var.ec2_key_pair_name
  security_groups = [aws_security_group.web_sg.name]

  tags = {
    Name = "Sendmate-Server"
  }
}

