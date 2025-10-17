const request = require('supertest');
const app = require('../app');

describe('Frontend basic routes', () => {
  test('GET / returns 200 and HTML', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });

  test('GET /dentists returns 200', async () => {
    const res = await request(app).get('/dentists');
    expect(res.statusCode).toBe(200);
  });

  test('GET /appointments returns 200 or redirects (302) to login', async () => {
    const res = await request(app).get('/appointments');
    expect([200, 302]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.headers['content-type']).toMatch(/html/);
    } else {
      expect(res.headers).toHaveProperty('location');
    }
  });

  test('GET /users/login returns 200', async () => {
    const res = await request(app).get('/users/login');
    expect([200,302]).toContain(res.statusCode);
  });

  test('GET /users/register returns 200', async () => {
    const res = await request(app).get('/users/register');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });

  test('Static asset /css/style.css is served', async () => {
    const res = await request(app).get('/css/style.css');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/css/);
  });
});
