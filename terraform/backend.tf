# terraform/backend.tf

terraform {
  backend "s3" {
    bucket         = "ajinkya-sendmate-tfstate-bucket"
    # Use a different key for the master branch
    key            = "master/terraform.tfstate" # Changed from 'sendmate/...'
    region         = "ap-south-1"
    dynamodb_table = "sendmate-terraform-locks"
  }
}
