# terraform/variables.tf

variable "ec2_key_pair_name" {
  description = "The name of the EC2 key pair for SSH access"
  type        = string
  default = "demo.pem"
}
