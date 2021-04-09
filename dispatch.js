require('dotenv').config()

const { Octokit } = require("@octokit/rest");
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

let owner = 'trabur'
let repo = 'istrav-tinderbox'
let workflowId = 'istrav-up.yml'

async function main () {
  let response = await octokit.rest.actions.createWorkflowDispatch({
    owner: owner,
    repo: repo,
    workflow_id: workflowId,
    ref: 'master',
    inputs: {
      stackId: 'prod',
      planId: 'tardigrade',
      AMQP_URI: process.env.AMQP_URI,
      MONGODB_URI: process.env.MONGODB_URI,
      POSTGRESQL_URI: process.env.POSTGRESQL_URI,
      SECRET: process.env.SECRET,
      AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY,
      AWS_SECRET_KEY: process.env.AWS_SECRET_KEY
    }
  })
  
  console.log('response', response)
}

main()