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
