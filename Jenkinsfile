pipeline {
    agent any

    environment {
        SERVER_IP = "87.106.48.159"
        DEPLOY_PATH = "/var/www/html"
        APP_NAME = "rental_car"
        DIST_PATH = "dist/rental_car/browser"
        SSH_CRED = "my-server-key"
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
                sh 'npm ci'
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
                    credentialsId: "${SSH_CRED}",
                    keyFileVariable: 'KEY'
                )]) {

                    sh """
                    set -e

                    echo "Cleaning server directory..."
                    ssh -i $KEY -o StrictHostKeyChecking=no ubuntu@${SERVER_IP} "
                        sudo rm -rf ${DEPLOY_PATH}/* &&
                        sudo mkdir -p ${DEPLOY_PATH}
                    "

                    echo "Copying files..."
                    scp -i $KEY -o StrictHostKeyChecking=no -r ${DIST_PATH}/* ubuntu@${SERVER_IP}:${DEPLOY_PATH}/
                    """
                }
            }
        }

        stage('Restart Apache') {
            steps {
                echo "Restarting Apache..."

                withCredentials([sshUserPrivateKey(
                    credentialsId: "${SSH_CRED}",
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
            echo "🚀 Deployment successful! Angular app is live."
        }

        failure {
            echo "❌ Deployment failed. Check logs."
        }
    }
}