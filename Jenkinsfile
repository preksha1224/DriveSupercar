pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                scp -o StrictHostKeyChecking=no -r * \
                ubuntu@217.154.175.105:/var/www/html/
                '''
            }
        }
    }
}