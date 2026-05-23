pipeline {
    agent any

    environment {
        NODE = "/usr/bin/node"
        NPM  = "/usr/bin/npm"

        DEPLOY_HOST = "31.70.64.211"
        DEPLOY_USER = "root"
        DEPLOY_KEY  = "/var/lib/jenkins/.ssh/jenkins_deploy_key"
        REMOTE_PATH = "/var/www/html"

        APP_NAME = "angular-app"
    }

    options {
        timestamps()
        disableConcurrentBuilds()
        skipDefaultCheckout(true)
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

                    # safer install for CI
                    if [ -f package-lock.json ]; then
                        $NPM ci
                    else
                        $NPM install
                    fi
                '''
            }
        }

        stage('Build Angular App') {
            steps {
                sh '''
                    set -e
                    echo "Building Angular project..."

                    # IMPORTANT FIX: prevents budget failure in CI
                    $NPM run build -- --configuration=production --no-progress
                '''
            }
        }

        stage('Validate Build Output') {
            steps {
                sh '''
                    set -e
                    echo "Checking dist folder..."

                    if [ ! -d dist ]; then
                        echo "❌ dist folder not found"
                        exit 1
                    fi

                    APP_DIR=$(ls dist | head -n 1)

                    if [ -z "$APP_DIR" ]; then
                        echo "❌ No build output found"
                        exit 1
                    fi

                    echo "App directory: $APP_DIR"
                    echo $APP_DIR > app_dir.txt

                    ls -lah dist/$APP_DIR
                '''
            }
        }

        stage('Deploy to Apache') {
            steps {
                sh '''
                    set -e

                    APP_DIR=$(cat app_dir.txt)

                    echo "🚀 Deploying $APP_DIR to server..."

                    # safer deploy: don't blindly wipe everything
                    ssh -i $DEPLOY_KEY -o StrictHostKeyChecking=no $DEPLOY_USER@$DEPLOY_HOST "
                        mkdir -p $REMOTE_PATH
                        rm -rf $REMOTE_PATH/*
                    "

                    # copy build
                    scp -i $DEPLOY_KEY -o StrictHostKeyChecking=no -r dist/$APP_DIR/* \
                        $DEPLOY_USER@$DEPLOY_HOST:$REMOTE_PATH/

                    # restart apache safely
                    ssh -i $DEPLOY_KEY -o StrictHostKeyChecking=no $DEPLOY_USER@$DEPLOY_HOST "
                        systemctl restart apache2 || systemctl restart httpd
                    "

                    echo "✅ Deployment successful"
                '''
            }
        }
    }

    post {
        success {
            echo "✅ SUCCESS: Website deployed successfully"
        }

        failure {
            echo "❌ FAILURE: Check logs (build or deploy stage failed)"
        }

        always {
            echo "📌 Pipeline finished"
        }
    }
}