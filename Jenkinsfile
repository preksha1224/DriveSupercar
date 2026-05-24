pipeline {
    agent any

    environment {
        SERVER_IP = "87.106.48.159"
        DEPLOY_PATH = "/var/www/html"
        APP_NAME = "DriveSupercar"   
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
                echo "Building project..."
                sh 'npm run build'
            }
        }

        stage('Verify Build Output') {
            steps {
                echo "Checking build output..."
                sh "ls -l dist/${APP_NAME}"
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
                    # clean server folder
                    ssh -i $KEY -o StrictHostKeyChecking=no ubuntu@${SERVER_IP} "
                        sudo rm -rf ${DEPLOY_PATH}/*
                    "

                    # deploy build
                    scp -i $KEY -o StrictHostKeyChecking=no -r dist/${APP_NAME}/* ubuntu@${SERVER_IP}:${DEPLOY_PATH}/
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
            echo "🚀 Deployment successful! Your app is live."
        }
        failure {
            echo "❌ Pipeline failed. Check logs."
        }
    }
}