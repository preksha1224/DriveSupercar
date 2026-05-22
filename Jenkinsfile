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
                scp -i /var/lib/jenkins/.ssh/jenkins_deploy_key \
                -o StrictHostKeyChecking=no -r * \
                root@31.70.64.211:/var/www/html/

                ssh -i /var/lib/jenkins/.ssh/jenkins_deploy_key \
                -o StrictHostKeyChecking=no \
                root@31.70.64.211 "systemctl restart apache2"
                '''
            }
        }
    }
}