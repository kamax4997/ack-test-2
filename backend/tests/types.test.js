import { tester } from 'graphql-tester-options';
import { SERVER } from '../src/config';

const { PORT, GRAPHQL, PROTOCOL, HOST } = SERVER;

const testTypesQuery = {
  JSON: `
    query testJSON {
      testJSON(where: { json: true })
    }
  `,
  SafeMJSON: `
    query testSafeMJSON {
      testSafeMJSON(where: { json: true })
    }
  `,
  UnsafeMJSON: `
    query testUnsafeMJSON ($where: MJSON!){
      testUnsafeMJSON(where: $where)
    }
  `
};

// USERS
describe('A user', function() {
  beforeAll(() => {
    this.test = tester({
      url: `${PROTOCOL}://${HOST}:${PORT}${GRAPHQL}`,
      contentType: 'application/json'
    });
  });

  it('should be valid JSON', done => {
    this.test(
      JSON.stringify({
        query: testTypesQuery.JSON
      }),
      {
        jar: true,
        headers: {
          'Content-Type': 'application/json',
          'x-connector-auth-request-type': 'LOCAL_STORAGE',
          'x-connector-token': null,
          'x-connector-refresh-token': null
        }
      }
    )
      .then(res => {
        expect(res.status).toBe(200);
        expect(res.success).toBe(true);
        expect(res.data.testJSON).toBe(true);
        done();
      })
      .catch(err => {
        expect(err).toBe(null);
        done();
      });
  });
  it('should be valid MJSON', done => {
    this.test(
      JSON.stringify({
        query: testTypesQuery.SafeMJSON
      }),
      {
        jar: true,
        headers: {
          'Content-Type': 'application/json',
          'x-connector-auth-request-type': 'LOCAL_STORAGE',
          'x-connector-token': null,
          'x-connector-refresh-token': null
        }
      }
    )
      .then(res => {
        expect(res.status).toBe(200);
        expect(res.success).toBe(true);
        expect(res.data.testSafeMJSON).toBe(true);
        done();
      })
      .catch(err => {
        expect(err).toBe(null);
        done();
      });
  });
  it('should be not valid MJSON', done => {
    this.test(
      JSON.stringify({
        query: testTypesQuery.UnsafeMJSON,
        variables: {
          where: { json: { $in: [true] } }
        },
      }),
      {
        jar: true,
        headers: {
          'Content-Type': 'application/json',
          'x-connector-auth-request-type': 'LOCAL_STORAGE',
          'x-connector-token': null,
          'x-connector-refresh-token': null
        }
      }
    )
      .then(res => {
        expect(res.status).toBe(400);
        expect(res.success).toBe(false);
        expect(res.errors[0].message.includes('[MJSON]: This JSON contains unsafe NoSQL for mongodb')).toBe(true);
        done();
      })
      .catch(err => {
        expect(err).toBe(null);
        done();
      });
  });
});
