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
                scp -i /var/lib/jenkins/jenkins \
                -o StrictHostKeyChecking=no \
                -r * root@212.227.61.112:/var/www/html/
                '''
            }
        }
    }
}