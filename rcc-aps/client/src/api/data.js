import api from './client';

export async function fetchState() {
  const res = await api.get('/data');
  return res.data;
}

export async function saveState(state) {
  const res = await api.post('/data', state);
  return res.data;
}

export async function fetchEmployees() {
  const res = await api.get('/employees');
  return res.data;
}

export async function fetchLeaves() {
  const res = await api.get('/leaves');
  return res.data;
}

export async function saveLeaveTypes(leaveTypes, nextLeaveTypeId) {
  const res = await api.post('/leave-types', { leaveTypes, nextLeaveTypeId });
  return res.data;
}

export async function saveLeaveRecords(leaveRecords) {
  const res = await api.post('/leave-records', { leaveRecords });
  return res.data;
}

export async function syncHris() {
  const res = await api.get('/hris/sync');
  return res.data;
}
