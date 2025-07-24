# terraform/outputs.tf

# This output is crucial for Ansible to know which server to connect to.
output "public_ip" {
  description = "The public IP address of the EC2 instance"
  value       = aws_instance.app_server.public_ip
}
