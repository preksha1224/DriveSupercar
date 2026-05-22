pipeline {
    agent any

    environment {
        // Force absolute binaries (CRITICAL FIX)
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

                    echo "Checking Node via absolute path..."

                    $NODE -v
                    $NPM -v

                    echo "Node Path: $NODE"
                    echo "NPM Path: $NPM"
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    set -e
                    echo "Installing dependencies..."

                    $NPM cache clean --force || true
                    $NPM ci
                '''
            }
        }

        stage('Build Project') {
            steps {
                sh '''
                    set -e
                    echo "Building project..."

                    $NPM run build
                '''
            }
        }

        stage('Validate Build') {
            steps {
                sh '''
                    set -e

                    echo "Checking build output..."

                    ls -lah

                    if [ ! -d "dist" ]; then
                        echo "❌ Build failed: dist folder missing"
                        exit 1
                    fi

                    echo "✅ Build verified"
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    set -e

                    echo "Cleaning remote server..."
                    ssh -i $DEPLOY_KEY -o StrictHostKeyChecking=no $DEPLOY_USER@$DEPLOY_HOST "
                        rm -rf $REMOTE_PATH/*
                    "

                    echo "Copying files..."
                    scp -i $DEPLOY_KEY -o StrictHostKeyChecking=no -r dist/* \
                        $DEPLOY_USER@$DEPLOY_HOST:$REMOTE_PATH/

                    echo "Restarting Apache..."
                    ssh -i $DEPLOY_KEY -o StrictHostKeyChecking=no $DEPLOY_USER@$DEPLOY_HOST "
                        systemctl restart apache2
                    "

                    echo "Deployment completed successfully"
                '''
            }
        }
    }

    post {
        success {
            echo "✅ SUCCESS: Deployment completed"
        }

        failure {
            echo "❌ FAILURE: Check logs for details"
        }

        always {
            echo "📌 Pipeline finished"
        }
    }
}