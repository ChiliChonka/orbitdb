const ctx = self as unknown as SharedWorkerGlobalScope;

ctx.onconnect = (event: MessageEvent) => {
  const port = event.ports[0];

  port.onmessage = (e) => {
    console.log('[Worker] Empfangen:', e.data);
    port.postMessage(`[Worker] Echo: ${e.data}`);
  };

  port.postMessage('[Worker] Bereit!');
};