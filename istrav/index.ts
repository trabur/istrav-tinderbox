
import * as linode from "@pulumi/linode"
import * as pulumi from "@pulumi/pulumi"

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

const web = new linode.Instance(`istrav:::${pulumi.getStack()}`, {
  authorizedKeys: ["ssh-rsa AAAA...Gw== user@example.local"],
  group: "foo",
  image: "linode/ubuntu18.04",
  label: "simple_instance",
  privateIp: true,
  region: "us-central",
  rootPass: "Furlong5280",
  swapSize: 256,
  tags: ["istrav"],
  type: "g6-nanode-1",
  stackscriptId: 1,
  stackscriptData: { key: userData },
});

export const ip = web.ipAddress