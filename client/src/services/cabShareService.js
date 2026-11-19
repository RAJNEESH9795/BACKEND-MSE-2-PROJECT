
import api from "./api";

// Get all available cab shares with optional filters
export const getCabShares = async (filters = {}) => {
  const response = await api.get("/cab-shares", {
    params: filters,
  });

  return response.data;
};

// Get cab shares created by the logged-in user
export const getMyCabShares = async () => {
  const response = await api.get("/cab-shares/my-cab-shares");

  return response.data;
};

// Get one cab share by ID
export const getCabShareById = async (id) => {
  const response = await api.get(`/cab-shares/${id}`);

  return response.data;
};

// Create a new cab share
export const createCabShare = async (data) => {
  const response = await api.post("/cab-shares", data);

  return response.data;
};

// Request to join a cab share
export const requestToJoinCab = async (id) => {
  const response = await api.post(`/cab-shares/${id}/requests`);

  return response.data;
};

// Approve or reject a joining request
export const respondToCabRequest = async (
  id,
  requestId,
  action
) => {
  const response = await api.patch(
    `/cab-shares/${id}/requests/${requestId}`,
    { action }
  );

  return response.data;
};

// Withdraw a joining request
export const withdrawCabRequest = async (
  id,
  requestId
) => {
  const response = await api.patch(
    `/cab-shares/${id}/requests/${requestId}/withdraw`
  );

  return response.data;
};

// Cancel a cab share
export const cancelCabShare = async (id) => {
  const response = await api.patch(
    `/cab-shares/${id}/cancel`
  );

  return response.data;
};

// Mark a cab share as completed
export const completeCabShare = async (id) => {
  const response = await api.patch(
    `/cab-shares/${id}/complete`
  );

  return response.data;
};
