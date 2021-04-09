import * as pulumi from "@pulumi/pulumi"
import * as aws from "@pulumi/aws"

let config = new pulumi.Config()
let plan: any = config.require("plan") 
let zone = 'us-east-1a'
let instanceCount = 1
let instanceType = 't2.nano' // smallest 0.5GiB Memory
let ami = 'ami-042e8287309f5df03' // Ubuntu Server 20.04 LTS // for us-east-1

if (plan === 'tardigrade') {
  instanceType = 't2.micro'  // $8.352/mo (0.0116/hr) for 1vCPU and 1GiB Memory
} else if (plan === 'astroid') {
  instanceType = 't2.small'  // $16.56/mo ($0.023/hr) for 1vCPU and 2GiB Memory
} else if (plan === 'satellite') {
  instanceType = 't2.medium' // $33.408/mo ($0.0464/hr) for 2vCPU and 4GiB Memory
} else if (plan === 'planet') {
  instanceType = 't2.large'  // $66.816/mo ($0.0928/hr) for 2vCPU and 8GiB Memory
} else if (plan === 'star') {
  instanceType = 't2.xlarge'  // $133.632/mo ($0.1856/hr) for 4vCPU and 16GiB Memory
} else {
  // plan = back hole
  instanceType = 't2.2xlarge'  // $267.264/mo ($0.3712/hr) for 8vCPU and 32GiB Memory
}
// note: EBS Storage is $20/mo for each 250GB
// https://aws.amazon.com/ec2/pricing/on-demand/

console.log('istrav:zone', zone)
console.log('istrav:plan', plan)
console.log('istrav:instanceCount', instanceCount)
console.log('istrav:instanceType', instanceType)
console.log('istrav:ami', ami)

let AMQP_URI = config.require("AMQP_URI")
let MONGODB_URI = config.require("MONGODB_URI")
let POSTGRESQL_URI = config.require("POSTGRESQL_URI")
let SECRET = config.require("SECRET")
let AWS_ACCESS_KEY = config.require("AWS_ACCESS_KEY")
let AWS_SECRET_KEY = config.require("AWS_SECRET_KEY")

let PORT = 3000
const startupScript = `#!/bin/bash
# version: 2
sudo apt-get update
sudo apt-get install -y ec2-instance-connect
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