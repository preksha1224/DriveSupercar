pipeline {
    agent any

    stages {
        stage('Clone') {
            steps {
                echo 'Repository already checked out'
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

