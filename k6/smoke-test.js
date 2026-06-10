import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '10s',
};

export default function () {
  const res = http.get('http://localhost:8080/api/alerts');
  check(res, {
    'status 200': (r) => r.status === 200,
    'tempo menor que 2s': (r) => r.timings.duration < 2000,
  });
  sleep(1);
}
