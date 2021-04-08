
import * as linode from "@pulumi/linode"
import * as pulumi from "@pulumi/pulumi"

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

const profile = pulumi.output(linode.getProfile({ async: true }));

const stackscript = new linode.StackScript(`istrav:::${pulumi.getStack()}`, {
  label: "istrav",
  script: startupScript,
  description: "nginx with a node.js/express API",
  images: [debian9],
})

const linodeInstance = new linode.Instance(`istrav:::${pulumi.getStack()}`, {
  type: "g6-nanode-1",
  // rootPass: '',
  stackscriptData: [stackscript.script],
  image: debian9,
  region: "us-east",
  // Include all "LISH" registered SSH Keys
  authorizedKeys: profile.authorizedKeys,
  // Include all User configured SSH Keys
  authorizedUsers: [profile.username],
}, { dependsOn: [stackscript] })

export const ip = linodeInstance.ipAddress