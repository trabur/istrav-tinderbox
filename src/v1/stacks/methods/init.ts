import { Request, Response } from "express"

export default function (run: any, shell: any) {
  return async function (req: Request, res: Response) {
    // params
    let es = req.body.eventSource
    let folder = es.arguements.folder
    let orgName = es.arguements.orgName
    let stackName = es.arguements.stackName

    // make directory if not exists
    let location = `/Users/travisburandt/Pulumi/stacks/${folder}`
    shell.mkdir('-p', location)

    // preform
    let result
    try {
      let cmd = await run.execute(`pulumi stack init ${orgName}/${stackName} --cwd=${location}`)
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