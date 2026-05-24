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
                sshagent(['my-server-key']) {
                    sh """
                    ssh -o StrictHostKeyChecking=no root@${SERVER_IP} '
                        rm -rf ${DEPLOY_PATH}/* &&
                        mkdir -p ${DEPLOY_PATH}
                    '

                    scp -o StrictHostKeyChecking=no -r dist/${APP_NAME}/browser/* root@${SERVER_IP}:${DEPLOY_PATH}/
                    """
                }
            }
        }

        stage('Restart Apache') {
            steps {
                sshagent(['my-server-key']) {
                    sh """
                    ssh -o StrictHostKeyChecking=no root@${SERVER_IP} '
                        systemctl restart apache2
                    '
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