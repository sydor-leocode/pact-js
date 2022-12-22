import http, { RequestOptions, ClientRequest, IncomingMessage } from 'http';

import logger from '../common/logger';

export const traceHttpInteractions = (): void => {
  const originalRequest = http.request;
  http.request = (
    options: RequestOptions | string | URL,
    cb: RequestOptions | ((res: IncomingMessage) => void) | undefined
  ): ClientRequest => {
    if (typeof options === 'string' || options instanceof URL) {
      throw new Error(
        'invoking traced requests with a string or a URL first argument is not supported'
      );
    }
    if (typeof cb !== 'function') {
      throw new Error(
        'invoking traced requests with a non-function second argument is not supported'
      );
    }
    const requestBodyChunks: Buffer[] = [];
    const responseBodyChunks: Buffer[] = [];
    const hijackedCallback = (res: IncomingMessage) => {
      logger.trace(
        `outgoing request: ${JSON.stringify({
          ...options,
          body: Buffer.concat(requestBodyChunks).toString('utf8'),
        })}`
      );
      if (cb) {
        cb(res);
      }
    };
    const clientRequest: ClientRequest = originalRequest(
      options,
      hijackedCallback
    );
    const oldWrite = clientRequest.end.bind(clientRequest);
    clientRequest.end = (chunk: Parameters<typeof clientRequest.write>[0]) => {
      requestBodyChunks.push(Buffer.from(chunk));
      return oldWrite(chunk);
    };

    clientRequest.on('response', (incoming: IncomingMessage) => {
      incoming.on('readable', () => {
        responseBodyChunks.push(Buffer.from(incoming.read()));
      });
      incoming.on('end', () => {
        logger.trace(
          `response: ${JSON.stringify({
            body: Buffer.concat(responseBodyChunks).toString('utf8'),
            headers: incoming.headers,
            statusCode: incoming.statusCode,
          })}`
        );
      });
    });
    return clientRequest;
  };
};
