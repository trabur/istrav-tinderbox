import * as pulumi from "@pulumi/pulumi"
import * as aws from "@pulumi/aws"

let config = new pulumi.Config()
let zone = config.require("zone") || 'us-east-1a'
console.log('istrav:zone', zone)
let instanceCount = config.getNumber("instanceCount") || 1
console.log('istrav:instanceCount', instanceCount)
let instanceType = config.require("instanceType") || 't2.micro'
console.log('istrav:instanceType', instanceType)
let ami = config.require("ami") || 'ami-042e8287309f5df03' // Ubuntu Server 20.04 LTS // for us-east-1
console.log('istrav:ami', ami)

let PORT = 3000

let RAW: any = config.require("RAW")
let AMQP_URI = RAW.AMQP_URI
let MONGODB_URI = RAW.MONGODB_URI
let POSTGRESQL_URI = RAW.POSTGRESQL_URI
let SECRET = RAW.SECRET
let AWS_ACCESS_KEY = RAW.AWS_ACCESS_KEY
let AWS_SECRET_KEY = RAW.AWS_SECRET_KEY

const startupScript = `#!/bin/bash
sudo apt-get update
sudo apt-get install ec2-instance-connect
sudo apt-get install -y nginx
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 'Nginx HTTP'
sudo ufw allow ssh
sudo ufw allow https
sudo ufw allow http
sudo ufw enable

# install node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
. ~/.nvm/nvm.sh
nvm install node
node -e "console.log('Running Node.js ' + process.version)"

# install node.js global deps
npm install pm2 -g
npm install -g typescript
npm install -g ts-node

# install hacktracks.org
git clone https://github.com/trabur/istrav-api.git
cd ./istrav-api
npm i
npm run build
echo "module.exports = {
  apps: [
    {
      name: 'istrav-api',
      script: './build/src/server.js',
      watch: true,
      env: {
        PORT: ${PORT},
        NODE_ENV: 'production',
        AMQP_URI: '${AMQP_URI}',
        MONGODB_URI: '${MONGODB_URI}',
        POSTGRESQL_URI: '${POSTGRESQL_URI}',
        SECRET: '${SECRET}',
        AWS_ACCESS_KEY: '${AWS_ACCESS_KEY}',
        AWS_SECRET_KEY: "'${AWS_SECRET_KEY}'
      }
    }
  ]
}" > 'pm2.config.js'
pm2 start pm2.config.js
cd ..

# install nginx proxy and load balancer
sudo -s
echo "server {
  listen       80;
  server_name localhost hacktracks.org;

  location / {
    proxy_pass http://localhost:${PORT};
  }
}" > '/etc/nginx/sites-available/default'
exit
sudo service nginx restart

# finish`

const group = new aws.ec2.SecurityGroup(`istrav-securityGroup:::${pulumi.getStack()}`, {
  ingress: [
    { protocol: "tcp", fromPort: 22, toPort: 22, cidrBlocks: ["0.0.0.0/0"] },
    { protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] },
    { protocol: "tcp", fromPort: 443, toPort: 443, cidrBlocks: ["0.0.0.0/0"] },
  ],
  egress: [
    { protocol: "tcp", fromPort: 22, toPort: 22, cidrBlocks: ["0.0.0.0/0"] },
    { protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] },
    { protocol: "tcp", fromPort: 443, toPort: 443, cidrBlocks: ["0.0.0.0/0"] },
  ]
})

const fooInstance = new aws.ec2.Instance(`istrav-instance:::${pulumi.getStack()}`, {
  availabilityZone: zone,
  ami: ami,
  instanceType: instanceType,
  userData: startupScript,
  vpcSecurityGroupIds: [ group.id ],
  keyName: 'istrav'
})

export const ip = fooInstance.publicIp