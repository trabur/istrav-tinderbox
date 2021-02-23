import express from "express"

import v1 from "./src/v1/app"

const app = express()
const port = process.env.PORT || 1337

// cors
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization")
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS')
  next()
})

// decode
app.use(express.json())

// init api
v1(app)

// welcome screen
app.get('/*', express.static('public'))

// run
app.listen(port, () => {
  console.log("Running server on port:", port)
  console.log("--------------------------")
});