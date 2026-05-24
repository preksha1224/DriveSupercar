pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                echo "Building project..."
                // Example for React / Angular
                sh 'npm install'
                sh 'npm run build'
            }
        }

        stage('Deploy to Server') {
            steps {
                sshagent(['my-server-key']) {
                    sh '''
                    ssh -o StrictHostKeyChecking=no root@YOUR_SERVER_IP "
                        rm -rf /var/www/html/*
                    "
                    
                    scp -o StrictHostKeyChecking=no -r dist/* root@YOUR_SERVER_IP:/var/www/html/
                    '''
                }
            }
        }

        stage('Restart Apache') {
            steps {
                sshagent(['my-server-key']) {
                    sh '''
                    ssh root@YOUR_SERVER_IP "systemctl restart apache2"
                    '''
                }
            }
        }
    }
}