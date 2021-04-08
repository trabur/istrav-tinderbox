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

const debian9 = "linode/debian9"
const startupScript = `#!/bin/bash
sudo apt-get update
sudo apt-get install -y nginx
sudo ufw allow 'Nginx HTTP'
sudo ufw enable

echo "server {
  listen       80;
  server_name  localhost;

  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}" >> '/etc/nginx/sites-available/default'

sudo service nginx restart
`

const myVpc = new aws.ec2.Vpc(`istrav-vpc:::${pulumi.getStack()}`, {
  cidrBlock: "172.16.0.0/16",
  tags: {
    Name: "istrav",
  },
})

const mySubnet = new aws.ec2.Subnet(`istrav-subnet:::${pulumi.getStack()}`, {
  vpcId: myVpc.id,
  cidrBlock: "172.16.10.0/24",
  availabilityZone: zone,
  tags: {
    Name: "istrav",
  },
})

const fooNetworkInterface = new aws.ec2.NetworkInterface(`istrav-networkInterface:::${pulumi.getStack()}`, {
  subnetId: mySubnet.id,
  privateIps: ["172.16.10.100"],
  tags: {
    Name: "istrav",
  },
})

const fooInstance = new aws.ec2.Instance(`istrav-instance:::${pulumi.getStack()}`, {
  ami: ami,
  instanceType: instanceType,
  userData: startupScript,
  networkInterfaces: [{
    networkInterfaceId: fooNetworkInterface.id,
    deviceIndex: 0,
  }],
  creditSpecification: {
    cpuCredits: "unlimited",
  },
})

export const ip = fooInstance.publicIp