const fs = require('fs');
const path = require('path');

describe('Dashboard API snapshot contract', () => {
  const dashboardApiPath = path.join(
    __dirname,
    '..',
    'public',
    'js',
    'dashboard',
    'dashboard-api.js'
  );

  test('getSnapshot points to /api/dashboard/snapshot endpoint', () => {
    const source = fs.readFileSync(dashboardApiPath, 'utf8');
    expect(source).toContain('`${API_BASE_URL}/api/dashboard/snapshot`');
  });

  test('snapshot parser enforces safe defaults for missing sections', () => {
    const source = fs.readFileSync(dashboardApiPath, 'utf8');

    expect(source).toContain('normalizeSnapshotResponse');
    expect(source).toContain('Array.isArray(snapshot.monthlyStats)');
    expect(source).toContain('Array.isArray(snapshot.upcomingAppointments)');
    expect(source).toContain('totalAppointments: Number(snapshot.totalAppointments || 0)');
    expect(source).toContain('todayAppointments: Number(snapshot.todayAppointments || 0)');
  });
});
