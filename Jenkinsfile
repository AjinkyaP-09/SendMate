// Jenkinsfile

pipeline {
    agent any

    environment {
        // Define credentials IDs from your Jenkins Credentials Manager
        DOCKERHUB_CREDENTIALS_ID = 'dockerhub-credentials'
        AWS_CREDENTIALS_ID       = 'aws-credentials'
        EC2_SSH_KEY_ID           = 'ec2-ssh-key'
        // Define IDs for the new application secrets
        MONGO_URI_ID             = 'mongo-uri'
        GOOGLE_CLIENT_ID_ID      = 'google-client-id'
        GOOGLE_CLIENT_SECRET_ID  = 'google-client-secret'
        AWS_BUCKET_NAME_ID       = 'aws-bucket-name'
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
                // Use the SSH key and all application secrets
                withCredentials([
                    sshUserPrivateKey(credentialsId: EC2_SSH_KEY_ID, keyFileVariable: 'SSH_KEY_FILE', usernameVariable: 'SSH_USER'),
                    string(credentialsId: MONGO_URI_ID, variable: 'MONGO_URI_VAL'),
                    string(credentialsId: GOOGLE_CLIENT_ID_ID, variable: 'GOOGLE_CLIENT_ID_VAL'),
                    string(credentialsId: GOOGLE_CLIENT_SECRET_ID, variable: 'GOOGLE_CLIENT_SECRET_VAL'),
                    string(credentialsId: AWS_BUCKET_NAME_ID, variable: 'AWS_BUCKET_NAME_VAL'),
                    usernamePassword(credentialsId: DOCKERHUB_CREDENTIALS_ID, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS'),
                    aws(credentialsId: AWS_CREDENTIALS_ID)
                ]) {
                    script {
                        // Get the IP address cleanly from Terraform output
                        def ipAddress = sh(script: "terraform -chdir=terraform output -raw public_ip", returnStdout: true).trim()
                        
                        echo "✅ Deploying to server at IP: ${ipAddress}"

                        // Run the Ansible playbook, now with all secrets
                        sh """
                        ansible-playbook ../ansible/playbook.yml \\
                            --inventory "${ipAddress}," \\
                            --private-key ${SSH_KEY_FILE} \\
                            --user ${SSH_USER} \\
                            --extra-vars "dockerhub_username=${DOCKER_USER} mongo_uri='${MONGO_URI_VAL}' google_client_id='${GOOGLE_CLIENT_ID_VAL}' google_client_secret='${GOOGLE_CLIENT_SECRET_VAL}' aws_access_key_id='${AWS_ACCESS_KEY_ID}' aws_secret_access_key='${AWS_SECRET_ACCESS_KEY}' aws_region='ap-south-1' aws_bucket_name='${AWS_BUCKET_NAME_VAL}'"
                        """
                    }
                }
            }
        }
    }
}
