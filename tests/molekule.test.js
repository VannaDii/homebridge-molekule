import { existsSync, readFileSync } from 'fs';
import { MolekuleApi } from '../lib/molekule';
import { useTestVariant, clearTestVariant } from 'https';

jest.mock('https');

const credentialsPath = `${__dirname}/../.credentials.json`;

describe('Molekule API Tests', () => {
  beforeEach(() => {
    clearTestVariant();
  });

  it('Should return valid login result', () => {
    if (!existsSync(credentialsPath)) {
      throw new Error('Missing .credentials file in root!');
    }
    const credentials = JSON.parse(readFileSync(credentialsPath).toString());
    const molekuleApi = new MolekuleApi();
    expect.assertions(5);
    return molekuleApi
      .authenticate(credentials.username, credentials.password)
      .then((data, headers, response) => {
        expect(data).not.toBeNull();
        expect(data.token).not.toBeNull();
        expect(data.userInfo).not.toBeNull();
        expect(headers).not.toBeNull();
        expect(response).not.toBeNull();
      });
  });
});
