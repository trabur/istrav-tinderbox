
import * as digitalocean from "@pulumi/digitalocean"
import * as pulumi from "@pulumi/pulumi"

const dropletCount = 2
const region = digitalocean.Regions.NYC3

const dropletTypeTag = new digitalocean.Tag(`istrav-${pulumi.getStack()}`)
const userData = `
  #!/bin/bash
  sudo apt-get update
  sudo apt-get install -y nginx`

const nameTag = new digitalocean.Tag(`istrav:::istrav.com`)
const droplet = new digitalocean.Droplet(`istrav:::istrav.com`, {
  image: "ubuntu-18-04-x64",
  region: region,
  privateNetworking: true,
  size: digitalocean.DropletSlugs.DropletS1VCPU1GB,
  tags: [nameTag.id, dropletTypeTag.id],
  userData: userData,
})

export const ip = droplet.ipv4Address