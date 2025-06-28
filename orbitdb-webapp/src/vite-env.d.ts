declare module '*?worker&shared' {
  const workerConstructor: {
    new (): SharedWorker;
  };
  export default workerConstructor;
}