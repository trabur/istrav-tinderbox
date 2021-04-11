import * as pulumi from "@pulumi/pulumi"
import * as digitalocean from "@pulumi/digitalocean";
import * as kubernetes from "@pulumi/kubernetes";

// setup subscription
let config = new pulumi.Config()
let stack: any = config.require("stackId") 
let plan: any = config.require("planId") 
let region = digitalocean.Regions.NYC3
let instanceType
let replicas
let instanceCount = 1

// digital ocean:
// Burstable performance from $5/mo
// Consistent, fast performance from $40/mo
// S3 Storage is $5/mo for each 250GB
// https://www.digitalocean.com/pricing/

// CPU-Optimized Droplets
// dedicated instances
if (plan === 'black-hole-supermassive') {
  // millions or billions of times the mass of our Sun
  instanceType = digitalocean.DropletSlugs.DropletC32  // $640.00/mo 32vCPU and 64GB Memory
  replicas = 32
} else if (plan === 'back-hole-large') {
  // 1000 to 2 million times the msass of our Sun
  instanceType = digitalocean.DropletSlugs.DropletC16  // $320.00/mo 16vCPU and 32GB Memory
  replicas = 16
} else if (plan === 'back-hole-intermediate') {
  // 10 to 1000 times the msass of our Sun
  instanceType = digitalocean.DropletSlugs.DropletC8  // $160.00/mo 8vCPU and 16GB Memory
  replicas = 8
} else if (plan === 'back-hole-stellar') {
  // 3 to 10 times the mass of our Sun
  instanceType = digitalocean.DropletSlugs.DropletC4  // $80.00/mo 4vCPU and 8GB Memory
  replicas = 4
} else if (plan === 'back-hole-miniature') {
  // any mass equal to or above about 2.21×10−8 kg or 22.1 micrograms
  instanceType = digitalocean.DropletSlugs.DropletC2  // $40.00/mo 2vCPU and 4GB Memory
  replicas = 2
} else {
  // Basic Droplets
  // shared instances
  if (plan === 'star') {
    instanceType = digitalocean.DropletSlugs.DropletS4VCPU8GB  // $40/mo 4vCPU and 8GB Memory
    replicas = 4
  } else if (plan === 'planet') {
    instanceType = digitalocean.DropletSlugs.DropletS2VCPU4GB  // $20/mo 2vCPU and 4GB Memory
    replicas = 2
  } else if (plan === 'astroid') {
    instanceType = digitalocean.DropletSlugs.DropletS2VCPU2GB  // $15/mo 2vCPU and 2GB Memory
    replicas = 2
  } else {
    // default
    // plan: tardigrade
    instanceType = digitalocean.DropletSlugs.DropletS1VCPU2GB  // $10/mo 1vCPU and 2GB Memory
    replicas = 1
  }
}

// log details
console.log('istrav:plan', plan)
console.log('istrav:stack', stack)
console.log('istrav:region', region)
console.log('istrav:instanceCount', instanceCount)
console.log('istrav:instanceType', instanceType)

// container enviornment variables
let AMQP_URI = config.require("AMQP_URI")
let MONGODB_URI = config.require("MONGODB_URI")
let POSTGRESQL_URI = config.require("POSTGRESQL_URI")
let SECRET = config.require("SECRET")
let AWS_ACCESS_KEY = config.require("AWS_ACCESS_KEY")
let AWS_SECRET_KEY = config.require("AWS_SECRET_KEY")

// launch application
let safeStackName = stack.replace(".", "-dot-")
const cluster = new digitalocean.KubernetesCluster(`istrav-cluster-${safeStackName}-${plan}`, {
  region: region,
  version: "latest",
  nodePool: {
    name: "default",
    size: instanceType,
    nodeCount: instanceCount,
  },
})

export const kubeconfig = cluster.kubeConfigs[0].rawConfig

const provider = new kubernetes.Provider(`istrav-k8s-${safeStackName}-${plan}`, { kubeconfig })

const appLabels = { "app": "app-nginx" }
const app = new kubernetes.apps.v1.Deployment(`istrav-deployment-${safeStackName}-${plan}`, {
  spec: {
    selector: { matchLabels: appLabels },
    replicas: replicas,
    template: {
      metadata: { labels: appLabels },
      spec: {
        containers: [{
          name: "nginx",
          image: "nginx",
        }],
      },
    },
  },
}, { provider })

const appService = new kubernetes.core.v1.Service(`istrav-service-${safeStackName}-${plan}`, {
  spec: {
    type: "LoadBalancer",
    selector: app.spec.template.metadata.labels,
    ports: [{ port: 80 }],
  },
}, { provider })

export const ingressIp = appService.status.loadBalancer.ingress[0].ip