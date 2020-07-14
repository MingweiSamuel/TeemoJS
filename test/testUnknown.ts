import * as assert from "assert";

import { TeemoApi, RegionalRoute } from '../dist';

describe('TeemoJS Unknown', function() {
  const api = new TeemoApi({
    apiKeys: {
      default: "test"
    },
    distFactor: 1.0,
    retries: 3,
    maxConcurrent: 100,
    bucketsConfig: {},
    defaultBuckets: [],
    origin: "https://null.null",
    endpoints: {
      myEndpoint: {
        myMethod: {
          path: "search"
        }
      }
    },
    rateLimitTypeApplication: {
      name: "x-null",
      headerCount: "x-null",
      headerLimit: "x-null",
    },
    rateLimitTypeMethod: {
      name: "x-null",
      headerCount: "x-null",
      headerLimit: "x-null",
    },
    headerRetryAfter: "retry-after",
    headerLimitType: "x-null"
  });
  let apf: ReturnType<typeof api.proxy>;

  it('req type checks', function() {
    assert.throws(() => {
      (assert.fail as any)();
      api.req("myEndpoint", "myMethod", RegionalRoute.AMERICAS);
      api.req("myEndpoint", "myMethod", RegionalRoute.AMERICAS, {});
      api.req("myEndpoint", "myMethod", RegionalRoute.AMERICAS, {
        path: [],
        query: {},
      });
      api.req("myEndpoint", "myMethod", RegionalRoute.AMERICAS, {
        path: [],
        query: {},
        body: "hello",
      });
      api.req("myEndpoint", "myMethod", RegionalRoute.AMERICAS, {
        path: [],
      });
      api.req("myEndpoint", "myMethod", RegionalRoute.AMERICAS, {
        query: {},
      });
      api.req("myEndpoint", "myMethod", RegionalRoute.AMERICAS, {
        body: { hello: "world" },
      });
    });
  });

  it('proxy type checks', function() {
    assert.throws(() => {
      (assert.fail as any)();
      let _x: Parameters<typeof apf.myEndpoint.myMethod>[1];
      apf.myEndpoint.myMethod(RegionalRoute.AMERICAS);
      apf.myEndpoint.myMethod(RegionalRoute.AMERICAS, {});
      apf.myEndpoint.myMethod(RegionalRoute.AMERICAS, {
        path: [],
        query: {},
      });
      apf.myEndpoint.myMethod(RegionalRoute.AMERICAS, {
        path: [],
        query: {},
        body: "hello",
      });
      apf.myEndpoint.myMethod(RegionalRoute.AMERICAS, {
        path: [],
      });
      apf.myEndpoint.myMethod(RegionalRoute.AMERICAS, {
        query: {},
      });
      apf.myEndpoint.myMethod(RegionalRoute.AMERICAS, {
        body: { hello: "world" },
      });
    });
  });
});
