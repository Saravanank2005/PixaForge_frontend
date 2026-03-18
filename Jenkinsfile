// Jenkinsfile

pipeline {
    agent any

    // Use the NodeJS tool you configured in Jenkins
    tools {
        nodejs 'NodeJS_LTS'
    }

    stages {
        stage('1. Clone Repository') {
            steps {
                // Clones your project from GitHub
                git branch: 'main', url: 'https://github.com/Saravanank2005/BidLance_frontend.git'
            }
        }

        stage('2. Install Dependencies') {
            steps {
                // Runs npm install to get all packages
                sh 'npm install'
            }
        }

        stage('3. Build Project') {
            steps {
                // Creates a production build
                sh 'npm run build'
            }
        }

        stage('4. Deploy to Nginx') {
            steps {
                // Copies the build files to the Nginx web root directory
                sh 'cp -R build/* /var/www/html'
            }
        }
    }

    post {
        success {
            echo 'Deployment successful! 👍'
        }
        failure {
            echo 'Deployment failed. 😥'
        }
    }
}
