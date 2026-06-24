import api from './api';

export const getMeetings = async (page = 1) => {
  const response = await api.get(`/meetings?page=${page}`);
  return response.data;
};

export const getMeetingById = async (id) => {
  const response = await api.get(`/meetings/${id}`);
  return response.data;
};

export const updateMeeting = async (id, data) => {
  const response = await api.put(`/meetings/${id}`, data);
  return response.data;
};

export const deleteMeeting = async (id) => {
  const response = await api.delete(`/meetings/${id}`);
  return response.data;
};

// Task APIs
export const getTasks = async (meetingId) => {
  const response = await api.get(`/tasks`, { params: { meeting_id: meetingId } });
  return response.data;
};

export const createTask = async (data) => {
  const response = await api.post(`/tasks`, data);
  return response.data;
};

export const createMeeting = async (data) => {
  const response = await api.post(`/meetings`, data);
  return response.data;
};
