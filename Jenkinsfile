pipeline {
    agent any

    environment {
        SERVER_IP = "YOUR_SERVER_IP"
        DEPLOY_PATH = "/var/www/html"
    }

    stages {

        stage('Install Dependencies') {
            steps {
                echo "Installing dependencies..."
                sh 'npm install'
            }
        }

        stage('Build') {
            steps {
                echo "Building Angular project..."
                sh 'npm run build'
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
                    ssh -i $KEY -o StrictHostKeyChecking=no root@${SERVER_IP} "rm -rf ${DEPLOY_PATH}/*"

                    # copy dist folder (Angular output)
                    scp -i $KEY -o StrictHostKeyChecking=no -r dist/* root@${SERVER_IP}:${DEPLOY_PATH}/
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
                    ssh -i $KEY -o StrictHostKeyChecking=no root@${SERVER_IP} "systemctl restart apache2"
                    """
                }
            }
        }
    }

    post {
        success {
            echo "✅ Deployment successful!"
        }
        failure {
            echo "❌ Pipeline failed. Check logs."
        }
    }
}