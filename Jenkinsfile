// Jenkinsfile

pipeline {
    agent any

    environment {
        // Define credentials IDs from your Jenkins Credentials Manager
        DOCKERHUB_CREDENTIALS_ID = 'dockerhub-credentials'
        AWS_CREDENTIALS_ID       = 'aws-credentials'
        EC2_SSH_KEY_ID           = 'ec2-ssh-key'
    }

    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'main', url: 'https://github.com/AjinkyaP-09/SendMate.git'
            }
        }

        stage('Build and Push Docker Image') {
            steps {
                script {
                    // Use the Docker Hub credentials
                    withCredentials([usernamePassword(credentialsId: DOCKERHUB_CREDENTIALS_ID, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh "docker login -u ${DOCKER_USER} -p ${DOCKER_PASS}"
                        
                        // Build and push the image
                        def imageName = "${DOCKER_USER}/sendmate:latest"
                        sh "docker build -t ${imageName} -f Dockerfile ./backend"
                        sh "docker push ${imageName}"
                    }
                }
            }
        }

        stage('Provision Infrastructure with Terraform') {
            steps {
                // Use the AWS credentials
                withCredentials([aws(credentialsId: AWS_CREDENTIALS_ID)]) {
                    dir('terraform') {
                        sh 'terraform init'
                        sh 'terraform apply -auto-approve -var="ec2_key_pair_name=your-ec2-key-pair-name"' // Replace with your key pair name
                    }
                }
            }
        }

        stage('Deploy with Ansible') {
            steps {
                // Use the SSH private key credentials
                withCredentials([sshUserPrivateKey(credentialsId: EC2_SSH_KEY_ID, keyFileVariable: 'SSH_KEY_FILE', usernameVariable: 'SSH_USER')]) {
                    script {
                        // Get the IP address cleanly from Terraform output
                        def ipAddress = sh(script: "terraform -chdir=terraform output -raw public_ip", returnStdout: true).trim()
                        
                        echo "✅ Deploying to server at IP: ${ipAddress}"

                        // Run the Ansible playbook
                        sh """
                        ansible-playbook ../ansible/playbook.yml \\
                            --inventory "${ipAddress}," \\
                            --private-key ${SSH_KEY_FILE} \\
                            --user ${SSH_USER} \\
                            --extra-vars "dockerhub_username=${DOCKER_USER} mongo_uri='${env.MONGO_URI}' google_client_id='${env.GOOGLE_CLIENT_ID}' google_client_secret='${env.GOOGLE_CLIENT_SECRET}' aws_access_key_id='${env.AWS_ACCESS_KEY_ID}' aws_secret_access_key='${env.AWS_SECRET_ACCESS_KEY}' aws_region='ap-south-1' aws_bucket_name='${env.AWS_BUCKET_NAME}'"
                        """
                    }
                }
            }
        }
    }
}
