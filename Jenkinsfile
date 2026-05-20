pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Deploy to Apache') {
            steps {
                sh '''
                scp -o StrictHostKeyChecking=no -r * root@212.227.61.112:/var/www/html/
                '''
            }
        }
    }
}