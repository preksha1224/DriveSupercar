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
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Build Angular App') {
            steps {
                sh 'npm run build -- --configuration production'
            }
        }

        stage('Verify Build Output') {
            steps {
                sh 'ls -R dist'
            }
        }

        stage('Deploy') {
            steps {
                sshagent(['my-server-login']) {

                    sh """
                    set -e

                    echo "Cleaning server directory..."

                    ssh -o StrictHostKeyChecking=no \
                        -o IdentitiesOnly=yes \
                        root@${SERVER_IP} "
                        sudo rm -rf ${DEPLOY_PATH}/* &&
                        sudo mkdir -p ${DEPLOY_PATH}
                    "

                    echo "Copying files to server..."

                    scp -o StrictHostKeyChecking=no \
                        -o IdentitiesOnly=yes \
                        -r dist/${APP_NAME}/browser/* \
                        root@${SERVER_IP}:${DEPLOY_PATH}/
                    """
                }
            }
        }

        stage('Restart Apache') {
            steps {
                sshagent(['my-server-login']) {
                    sh """
                    ssh -o StrictHostKeyChecking=no \
                        -o IdentitiesOnly=yes \
                        root@${SERVER_IP} "
                        sudo systemctl restart apache2
                    "
                    """
                }
            }
        }
    }

    post {
        success {
            echo "🚀 Deployment successful!"
        }
        failure {
            echo "❌ Deployment failed"
        }
    }
}