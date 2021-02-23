import init from './methods/init'
import list from './methods/list'

import version from '../version.json'

const component = 'stacks'

import run from '../../helpers/run'

export default function (app: any, shell: any) {
  app.post(`/${version}/${component}/init`, init(run, shell))
  app.post(`/${version}/${component}/list`, list(run, shell))
}