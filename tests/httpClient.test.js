import { secureGet, securePost } from '../lib/httpClient';
import { useTestVariant, clearTestVariant } from 'https';

jest.mock('https');

const credentialsPath = `${__dirname}/../.credentials.json`;

describe('HTTP Client Tests', () => {
  beforeEach(() => {
    clearTestVariant();
  });

  it('Should fail with a 404', () => {
    expect.assertions(1);
    return securePost('fake-host', 'fake-path', {}).catch((e) => {
      expect(e).toBeDefined();
    });
  });

  it('Should fail with a 404', () => {
    expect.assertions(1);
    return secureGet('fake-host', 'fake-path').catch((e) => {
      expect(e).toBeDefined();
    });
  });

  it('Should fail with a server error', () => {
    expect.assertions(4);
    useTestVariant('403', 403);
    return secureGet('fake-host', '/errors/http').catch((e) => {
      expect(e).toBeDefined();
      expect(e.data).toBeDefined();
      expect(e.data.code).toBeDefined();
      expect(e.data.error).toBeDefined();
    });
  });
});
