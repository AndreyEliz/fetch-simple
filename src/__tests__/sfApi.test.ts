/**
 * Only base scenarios are tested for now.
 * I assume that core logic are pretty the same for most methods.
 *
 * TODO:
 * 1. Improve coverage
 * 2. Move out from jest-fetch-mock dependency
 */

import sfApi, { get, post, remove, put, removeJSON, postJSON, putJSON, postFile, setConfiguration } from '../index';
import fetchMock from 'jest-fetch-mock';

fetchMock.dontMock();

const mockFetchResponse = (resp: Response) => ((global.fetch as any) = jest.fn(() => Promise.resolve(resp)));

const testUrl = 'http://test.com';
const defaultFetchOptions = {
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  method: 'GET',
};

describe('fetch-simple base tests', () => {
  it('methods exist', () => {
    expect(sfApi.get).toBeDefined();
    expect(sfApi.post).toBeDefined();
    expect(sfApi.remove).toBeDefined();
    expect(sfApi.put).toBeDefined();
    expect(sfApi.removeJSON).toBeDefined();
    expect(sfApi.postJSON).toBeDefined();
    expect(sfApi.putJSON).toBeDefined();
    expect(sfApi.postFile).toBeDefined();
    expect(sfApi.setConfiguration).toBeDefined();
    expect(get).toBeDefined();
    expect(post).toBeDefined();
    expect(remove).toBeDefined();
    expect(put).toBeDefined();
    expect(removeJSON).toBeDefined();
    expect(postJSON).toBeDefined();
    expect(putJSON).toBeDefined();
    expect(postFile).toBeDefined();
    expect(setConfiguration).toBeDefined();
  });

  it('get methods base implementation works', (done) => {
    mockFetchResponse(new Response('test'));
    sfApi.get(testUrl).then((result) => {
      expect(result).toEqual('test');
      expect(global.fetch).toHaveBeenCalledWith(testUrl, defaultFetchOptions);
      done();
    });
  });

  it('get method - passing parameters', (done) => {
    mockFetchResponse(new Response('test'));
    sfApi
      .get(testUrl, { a: '123', b: 'ggg', c: undefined }, { headers: { 'Content-Type': 'application/pdf' } })
      .then((result) => {
        expect(result).toEqual('test');
        expect(global.fetch).toHaveBeenCalledWith(`${testUrl}?a=123&b=ggg`, {
          ...defaultFetchOptions,
          headers: { 'Content-Type': 'application/pdf' },
        });
        done();
      });
  });

  it('passing headers', (done) => {
    mockFetchResponse(new Response('test'));
    sfApi
      .get(
        testUrl,
        {},
        {
          headers: {
            'Content-Type': 'application/pdf',
            'test-header': 'test-header-value',
          },
        },
      )
      .then((result) => {
        expect(result).toEqual('test');
        expect(global.fetch).toHaveBeenCalledWith(testUrl, {
          ...defaultFetchOptions,
          headers: { 'Content-Type': 'application/pdf', 'test-header': 'test-header-value' },
        });
        done();
      });
  });

  it('fetch method changing works', (done) => {
    mockFetchResponse(new Response('test'));
    sfApi.get(testUrl, {}, { method: 'POST' }).then((result) => {
      expect(result).toEqual('test');
      expect(global.fetch).toHaveBeenCalledWith(testUrl, {
        ...defaultFetchOptions,
        method: 'POST',
      });
      done();
    });
  });

  it('json-like response handled correctly by default', (done) => {
    mockFetchResponse(new Response('{"a":"b"}'));
    sfApi.get(testUrl).then((result) => {
      expect(result.a).toEqual('b');
      done();
    });
  });

  it('blob response handled correctly', (done) => {
    const response = new Blob(['test']);
    mockFetchResponse(new Response(response));
    sfApi.get(testUrl, {}, { responseType: 'blob' }).then((result) => {
      expect(result.constructor.name).toEqual('Blob');
      done();
    });
  });
});

describe('testing errors', () => {
  it('response is not ok', (done) => {
    const response = new Response('test');
    Reflect.defineProperty(response, 'ok', { value: false });
    mockFetchResponse(response);
    sfApi.get(testUrl).catch((error) => {
      expect(error).toBeInstanceOf(Error);
      done();
    });
  });

  it('response status 401 - throw AuthError', (done) => {
    const response = new Response('test');
    Reflect.defineProperty(response, 'ok', { value: false });
    Reflect.defineProperty(response, 'status', { value: 401 });
    mockFetchResponse(response);
    sfApi.get(testUrl).catch((error) => {
      expect(error.constructor.name).toEqual('AuthError');
      done();
    });
  });
});

describe('testing post', () => {
  it('post formdata', (done) => {
    mockFetchResponse(new Response('test'));
    sfApi.post(testUrl, { user: 'test', password: 'dontDoThis', role: undefined }).then((result) => {
      expect(result).toEqual('test');
      expect(global.fetch).toHaveBeenCalledWith(testUrl, {
        ...defaultFetchOptions,
        method: 'POST',
        body: 'user=test&password=dontDoThis',
      });
      done();
    });
  });

  it('send file via postFile method', (done) => {
    const body = new FormData();
    body.append('file', new Blob(['test']));
    mockFetchResponse(new Response('test'));
    sfApi.postFile(testUrl, new Blob(['test'])).then((result) => {
      expect(result).toEqual('test');
      expect(global.fetch).toHaveBeenCalledWith(testUrl, {
        ...defaultFetchOptions,
        method: 'POST',
        body,
      });
      done();
    });
  });

  it('post json', (done) => {
    const response = new Response('test');
    const data = { user: 'test', password: 'dontDoThis', role: undefined };
    mockFetchResponse(response);
    sfApi.postJSON(testUrl, data).then((result) => {
      expect(result).toEqual('test');
      expect(global.fetch).toHaveBeenCalledWith(testUrl, {
        ...defaultFetchOptions,
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      done();
    });
  });
});

describe('testing settings', () => {
  afterEach(() => {
    sfApi.setConfiguration({});
  });

  it('onError hook', (done) => {
    sfApi.setConfiguration({
      onError: () => {
        throw Error('test');
      },
    });
    const response = new Response('test');
    Reflect.defineProperty(response, 'ok', { value: false });
    mockFetchResponse(response);
    sfApi.get(testUrl).catch((error: Error) => {
      expect(error.message).toEqual('test');
      done();
    });
  });

  it('set jwt token', (done) => {
    sfApi.setConfiguration({
      getAccessToken: () => 'test',
    });
    mockFetchResponse(new Response('test'));
    remove(testUrl).then((result) => {
      expect(result).toEqual('test');
      expect(global.fetch).toHaveBeenCalledWith(testUrl, {
        method: 'DELETE',
        headers: {
          ...defaultFetchOptions.headers,
          authorization: 'Bearer test',
        },
      });
      done();
    });
  });

  it('set jwt token async', (done) => {
    sfApi.setConfiguration({
      getAccessToken: () => Promise.resolve('testAsync'),
    });
    mockFetchResponse(new Response('test'));
    remove(testUrl).then((result) => {
      expect(result).toEqual('test');
      expect(global.fetch).toHaveBeenCalledWith(testUrl, {
        method: 'DELETE',
        headers: {
          ...defaultFetchOptions.headers,
          authorization: 'Bearer testAsync',
        },
      });
      done();
    });
  });
});
