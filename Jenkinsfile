pipeline {
    agent any

    environment {
        SERVER_IP = "87.106.48.159"
        DEPLOY_PATH = "/var/www/html"
        APP_NAME = "rental_car"
    }

    stages {

        stage('Checkout') {
            steps {
                echo "Pulling latest code..."
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo "Installing dependencies..."
                sh 'npm install'
            }
        }

        stage('Build Angular App') {
            steps {
                echo "Building Angular project (production)..."
                sh 'npm run build -- --configuration production'
            }
        }

        stage('Verify Build Output') {
            steps {
                echo "Checking build output structure..."
                sh "ls -R dist"
            }
        }

        stage('Deploy to Server') {
            steps {
                echo "Deploying build to server..."

                withCredentials([sshUserPrivateKey(
                    credentialsId: 'my-server-key',
                    keyFileVariable: 'KEY'
                )]) {

                    sh """
                    # Remove old files on server
                    ssh -i $KEY -o StrictHostKeyChecking=no ubuntu@${SERVER_IP} "
                        sudo rm -rf ${DEPLOY_PATH}/*
                    "

                    # Copy Angular build files (Angular v17+ uses /browser)
                    scp -i $KEY -o StrictHostKeyChecking=no -r dist/${APP_NAME}/browser/* ubuntu@${SERVER_IP}:${DEPLOY_PATH}/
                    """
                }
            }
        }

        stage('Restart Apache') {
            steps {
                echo "Restarting Apache..."

                withCredentials([sshUserPrivateKey(
                    credentialsId: 'my-server-key',
                    keyFileVariable: 'KEY'
                )]) {

                    sh """
                    ssh -i $KEY -o StrictHostKeyChecking=no ubuntu@${SERVER_IP} "
                        sudo systemctl restart apache2
                    "
                    """
                }
            }
        }
    }

    post {
        success {
            echo "🚀 Deployment successful! Your Angular app is live."
        }
        failure {
            echo "❌ Pipeline failed. Check logs above for errors."
        }
    }
}