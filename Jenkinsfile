pipeline {
    agent any

    environment {
        PATH = "/usr/bin:/bin:/usr/local/bin:${env.PATH}"
        DEPLOY_HOST = "31.70.64.211"
        DEPLOY_USER = "root"
        DEPLOY_KEY = "/var/lib/jenkins/.ssh/jenkins_deploy_key"
        REMOTE_PATH = "/var/www/html"
    }

    stages {

        stage('Checkout Code') {
            steps {
                cleanWs()
                checkout scm
            }
        }

        stage('Verify Node') {
            steps {
                sh '''
                    echo "PATH: $PATH"
                    node -v
                    npm -v
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    npm cache clean --force
                    npm install
                '''
            }
        }

        stage('Build Project') {
            steps {
                sh '''
                    npm run build
                '''
            }
        }

        stage('Check Build Output') {
            steps {
                sh '''
                    ls -lah
                    test -d dist || (echo "Build folder not found!" && exit 1)
                '''
            }
        }

        stage('Deploy to Apache Server') {
            steps {
                sh '''
                    set -e

                    echo "Cleaning remote server..."
                    ssh -i $DEPLOY_KEY -o StrictHostKeyChecking=no $DEPLOY_USER@$DEPLOY_HOST "
                        rm -rf $REMOTE_PATH/*
                    "

                    echo "Copying build files..."
                    scp -i $DEPLOY_KEY -o StrictHostKeyChecking=no -r dist/* \
                        $DEPLOY_USER@$DEPLOY_HOST:$REMOTE_PATH/

                    echo "Restarting Apache..."
                    ssh -i $DEPLOY_KEY -o StrictHostKeyChecking=no $DEPLOY_USER@$DEPLOY_HOST "
                        systemctl restart apache2
                    "
                '''
            }
        }
    }

    post {
        success {
            echo "✅ Deployment Successful"
        }
        failure {
            echo "❌ Pipeline Failed - check logs"
        }
    }
}