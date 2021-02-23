import { Request, Response } from "express"

export default function (run: any, shell: any) {
  return async function (req: Request, res: Response) {
    // params
    let es = req.body.eventSource

    // run command
    let cmd
    try {
      cmd = await run.execute('pulumi whoami')
    } catch (error) {
      console.error(error)
    }

    // finish
    let result = {
      success: true,
      data: cmd
    }

    // return event source
    es.payload = result
    es.serverAt = Date.now()

    // log event source
    console.log(`API ::: ${es}`)

    // finish
    res.json(es)
  }
}