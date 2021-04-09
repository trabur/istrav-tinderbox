echo "server {
  listen 80 default_server;
  listen [::]:80 default_server;

  root /var/www/html;
  index index.html;

  server_name _;

  # proxy_set_header X-Real-IP $remote_addr;
  # proxy_set_header Host $host;
  # proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  # proxy_set_header X-Forwarded-Proto $scheme;

  location / {
    proxy_pass http://127.0.0.1:3000;
  }
}" > '/etc/nginx/sites-enabled/default'