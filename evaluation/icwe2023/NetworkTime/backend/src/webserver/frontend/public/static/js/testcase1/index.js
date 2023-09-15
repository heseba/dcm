import { wait } from '../utils/helpers.js';
import { getTimeDiff } from '../CodeDistributor/helpers.js';
import { codeDistributor } from '../initCodeDistributor.js';

const _pingPong = () => {
  var t0, t0Date, target;

  // receive event from server
  codeDistributor.ws.on('pingPong', (data, timestamp) => {
    const t1 = performance.now();

    const { diffInMs: clientToServerDiff } = getTimeDiff(timestamp, t0Date);
    const { diffInMs: serverToClientDiff } = getTimeDiff(
      +new Date(),
      timestamp
    );

    console.table([
      {
        tookInMs: t1 - t0,
        tookInSec: parseFloat(((t1 - t0) / 1000).toFixed(2)),

        clientToServerInMs: clientToServerDiff,
        clientToServerInSec: parseFloat((clientToServerDiff / 1000).toFixed(2)),

        serverToClientInMs: serverToClientDiff,
        serverToClientInSec: parseFloat((serverToClientDiff / 1000).toFixed(2)),
      },
    ]);
  });

  // fire event on server
  const test = async (evt) => {
    target = evt.target;

    t0 = performance.now();
    t0Date = +new Date();

    // await wait(2000)

    codeDistributor.ws.emitServer('pingPong');
  };

  const btn = document.createElement('button');
  btn.onclick = test;
  btn.classList.add('btn');
  btn.textContent = 'WebSocket Latency';
  document.querySelector('.part-pingpong').appendChild(btn);
};

export const testcase1 = () => {
  _pingPong();
};
