pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                ssh -i /var/lib/jenkins/.ssh/jenkins_deploy_key \
                -o StrictHostKeyChecking=no \
                root@31.70.64.211 "rm -rf /var/www/html/*"

                scp -i /var/lib/jenkins/.ssh/jenkins_deploy_key \
                -o StrictHostKeyChecking=no \
                -r dist/* \
                root@31.70.64.211:/var/www/html/

                ssh -i /var/lib/jenkins/.ssh/jenkins_deploy_key \
                -o StrictHostKeyChecking=no \
                root@31.70.64.211 "systemctl restart apache2"
                '''
            }
        }
    }
}