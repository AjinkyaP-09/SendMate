# terraform/backend.tf

# This file MUST be created. It tells Terraform to store its state file
# remotely in an S3 bucket, which is essential for CI/CD.
terraform {
  backend "s3" {
    bucket         = "ajinkya-sendmate-tfstate-bucket" # e.g., ajinkya-sendmate-tfstate-bucket
    key            = "sendmate/terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "sendmate-terraform-locks" # e.g., sendmate-terraform-locks
  }
}
