export default function PromiseWorker(config, message, transfer) {
  if (typeof config === "string") {
    config = {'filename': config};
  }
  config['type'] = config['type'] || 'classic';

  let p = new Promise(function(resolve, reject) {
    let worker = new Worker(config['filename'], {'type': config['type']});
    worker.onmessage = function(e) {
      resolve(e.data);
      worker.terminate();
    };
    worker.postMessage(message, transfer);    
  });
  return p;
}
