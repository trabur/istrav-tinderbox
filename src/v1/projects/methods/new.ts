import { Request, Response } from "express"

export default function (run: any, shell: any) {
  return async function (req: Request, res: Response) {
    // params
    let es = req.body.eventSource
    let location = es.arguements.location
    let template = es.arguements.template
    let stackName = es.arguements.stackName

    // create this dir manualy
    let dir = `./pulumi/${location}`
    shell.mkdir('-p', dir)

    // preform
    let result
    try {
      let cmd = await run.execute(`pulumi new ${template} -s ${stackName} --cwd=${dir} --yes`)
      result = {
        success: true,
        data: cmd
      }
    } catch (error) {
      result = {
        success: false,
        data: error
      }
    }

    // return event source
    es.payload = result
    es.serverAt = Date.now()

    // log event source
    console.log(`API ::: ${JSON.stringify(es, null, 2)}`)

    // finish
    res.json(es)
  }
}