import { timeSpanString } from '../lib/utils';

describe('Utility tests', () => {
  it('Should return h:mm:ss formatted time', () => {
    const milliseconds = 1000;
    const timeString01 = timeSpanString(
      new Date(1541389579 * milliseconds),
      new Date(1541424202 * milliseconds)
    );
    expect(timeString01).toEqual('09:37:02');

    const timeString02 = timeSpanString(
      new Date(0 * milliseconds),
      new Date(1541424202 * milliseconds)
    );
    expect(timeString02).toEqual('428173:23:22');
  });
});
