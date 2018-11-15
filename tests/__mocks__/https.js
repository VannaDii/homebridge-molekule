import EventEmitter from 'events';
import { existsSync, readFileSync } from 'fs';

const https = jest.genMockFromModule('https');
let DATA_VARIANT_NAME = undefined;
let DATA_VARIANT_CODE = undefined;

class ClientRequest extends EventEmitter {
  constructor(headers) {
    super();
    this._headers = headers;
  }

  write(data) {
    this.emit('written', data);
  }
  end() {
    this.emit('end');
  }

  get headers() {
    return this._headers;
  }
}

class IncomingMessage extends EventEmitter {
  constructor(statusCode, headers) {
    super();
    this._headers = headers;
    this._statusCode = statusCode;
  }

  receive(data) {
    this.emit('data', data);
  }

  get headers() {
    return this._headers;
  }
  get statusCode() {
    return this._statusCode;
  }
}

function request(options, callback) {
  const safeOptions = options || {};
  const safeCallback = callback || (() => {});
  const clientReq = new ClientRequest(safeOptions.headers || {});

  clientReq.on('end', () => {
    safeOptions.path = safeOptions.path || '';
    safeOptions.path = safeOptions.path.substring(
      0,
      Math.max(safeOptions.path.indexOf('?'), safeOptions.path.length)
    );
    const maybePath = `${__dirname}/../__data__${safeOptions.path}${
      DATA_VARIANT_NAME ? `.${DATA_VARIANT_NAME}` : ''
    }.json`;
    const exists = existsSync(maybePath);
    if (!exists) {
      clientReq.emit(
        'error',
        new Error(`The path '${safeOptions.path}' ('${maybePath}') doesn't exist.`)
      );
    } else {
      const message = new IncomingMessage(DATA_VARIANT_CODE || 200, safeOptions.headers || {});
      safeCallback(message);
      message.receive(readFileSync(maybePath));
    }
  });

  return clientReq;
}

function useTestVariant(name, code) {
  DATA_VARIANT_NAME = name;
  DATA_VARIANT_CODE = code;
}

function clearTestVariant() {
  DATA_VARIANT_NAME = undefined;
  DATA_VARIANT_CODE = undefined;
}

https.useTestVariant = useTestVariant;
https.clearTestVariant = clearTestVariant;
https.request = request;

module.exports = https;
