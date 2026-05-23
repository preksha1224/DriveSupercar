pipeline {
    agent any

    environment {
        NODE = "/usr/bin/node"
        NPM  = "/usr/bin/npm"

        DEPLOY_HOST = "31.70.64.211"
        DEPLOY_USER = "root"
        DEPLOY_KEY = "/var/lib/jenkins/.ssh/jenkins_deploy_key"
        REMOTE_PATH = "/var/www/html"
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {

        stage('Checkout Code') {
            steps {
                cleanWs()
                checkout scm
            }
        }

        stage('Verify Environment') {
            steps {
                sh '''
                    set -e
                    echo "Node version:"
                    $NODE -v
                    echo "NPM version:"
                    $NPM -v
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    set -e
                    echo "Installing dependencies..."
                    $NPM ci || $NPM install
                '''
            }
        }

        stage('Build Angular App') {
            steps {
                sh '''
                    set -e
                    echo "Building Angular project..."

                    $NPM run build -- --configuration=production
                '''
            }
        }

        stage('Locate Build Output') {
            steps {
                sh '''
                    set -e
                    echo "Checking dist folder..."

                    ls -lah dist

                    APP_DIR=$(ls dist | head -n 1)

                    if [ -z "$APP_DIR" ]; then
                        echo "❌ No build output found"
                        exit 1
                    fi

                    echo "App directory: $APP_DIR"
                    echo $APP_DIR > app_dir.txt
                '''
            }
        }

        stage('Deploy to Apache') {
            steps {
                sh '''
                    set -e

                    APP_DIR=$(cat app_dir.txt)

                    echo "Deploying $APP_DIR..."

                    ssh -i $DEPLOY_KEY -o StrictHostKeyChecking=no $DEPLOY_USER@$DEPLOY_HOST "
                        rm -rf $REMOTE_PATH/*
                    "

                    scp -i $DEPLOY_KEY -o StrictHostKeyChecking=no -r dist/$APP_DIR/* \
                        $DEPLOY_USER@$DEPLOY_HOST:$REMOTE_PATH/

                    ssh -i $DEPLOY_KEY -o StrictHostKeyChecking=no $DEPLOY_USER@$DEPLOY_HOST "
                        systemctl restart apache2
                    "

                    echo "✅ Deployment successful"
                '''
            }
        }
    }

    post {
        success {
            echo "✅ SUCCESS: Website deployed"
        }
        failure {
            echo "❌ FAILURE: Check Jenkins logs"
        }
        always {
            echo "📌 Pipeline finished"
        }
    }
}