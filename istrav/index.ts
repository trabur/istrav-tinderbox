
import * as digitalocean from "@pulumi/digitalocean"
import * as pulumi from "@pulumi/pulumi"

const dropletCount = 2
const region = digitalocean.Regions.NYC3

const userData = `
  #!/bin/bash
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

const nameTag = new digitalocean.Tag(`istrav:::${pulumi.getStack()}`)
const droplet = new digitalocean.Droplet(`istrav:::${pulumi.getStack()}`, {
  image: "ubuntu-18-04-x64",
  region: region,
  privateNetworking: true,
  size: digitalocean.DropletSlugs.DropletS1VCPU1GB,
  tags: [nameTag.id],
  userData: userData,
})

export const ip = droplet.ipv4Address