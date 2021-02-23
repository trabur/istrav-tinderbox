// libraries
import express from "express"

// endpoints
import stacks from "./stacks/server"

// load "process.env" params from a .env file
const dotenv = require('dotenv')
dotenv.config()

// make sure CLI is there
var shell = require('shelljs');
if (!shell.which('pulumi')) {
  shell.echo('Sorry, this script requires pulumi');
  shell.exit(1);
}

export default function (app: any) {
  stacks(app, shell)
}