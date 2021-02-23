
import newProject from './methods/new'

import version from '../version.json'

const component = 'projects'

import run from '../../helpers/run'

export default function (app: any, shell: any) {
  app.post(`/${version}/${component}/new`, newProject(run, shell))
}