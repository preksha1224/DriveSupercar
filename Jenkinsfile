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
                withCredentials([sshUserPrivateKey(
                    credentialsId: 'my-server-login',
                    keyFileVariable: 'KEY',
                    usernameVariable: 'USER'
                )]) {

                    sh '''
                    set -e

                    echo "Starting deployment..."

                    SSH_OPTS="-i $KEY -o IdentitiesOnly=yes -o StrictHostKeyChecking=no"

                    echo "Cleaning server directory..."

                    ssh $SSH_OPTS $USER@${SERVER_IP} "
                        sudo rm -rf ${DEPLOY_PATH}/* &&
                        sudo mkdir -p ${DEPLOY_PATH}
                    "

                    echo "Uploading build..."

                    scp $SSH_OPTS \
                        -r dist/${APP_NAME}/browser/* \
                        $USER@${SERVER_IP}:${DEPLOY_PATH}/
                    '''
                }
            }
        }

        stage('Restart Apache') {
            steps {
                withCredentials([sshUserPrivateKey(
                    credentialsId: 'my-server-login',
                    keyFileVariable: 'KEY',
                    usernameVariable: 'USER'
                )]) {

                    sh '''
                    set -e

                    SSH_OPTS="-i $KEY -o IdentitiesOnly=yes -o StrictHostKeyChecking=no"

                    ssh $SSH_OPTS $USER@${SERVER_IP} "
                        sudo systemctl restart apache2
                    "
                    '''
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