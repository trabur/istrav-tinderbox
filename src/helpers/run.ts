import childProccess from 'child_process'

export default {
  execute: function(command: string) {
    console.log('running: ', command)
    return new Promise(function(resolve, reject) {
      function callback (error: any, stdout: any, stderr: any) {
        if (stderr) {
          reject(stderr);
          return;
        }
        
        if (error) {
          reject(error);
          return;
        }
        
        resolve(stdout);
      }
      childProccess.exec(command, callback)
    })
  }
}