
import api from "./api";

// ==========================================
// CAB SHARING API SERVICE
// ==========================================

// Get all available cab-sharing posts.
// Supports optional filters:
// source, destination, date, provider
export const getCabShares = async (filters = {}) => {
  const response = await api.get("/cab-shares", {
    params: filters,
  });

  return response.data;
};

// Get all cab-sharing posts created by logged-in user.
export const getMyCabShares = async () => {
  const response = await api.get("/cab-shares/my-cab-shares");

  return response.data;
};

// Get details of a specific cab-sharing post.
export const getCabShareById = async (cabShareId) => {
  const response = await api.get(`/cab-shares/${cabShareId}`);

  return response.data;
};

// Create a new cab-sharing post.
export const createCabShare = async (cabShareData) => {
  const response = await api.post("/cab-shares", cabShareData);

  return response.data;
};

// Request to join an existing cab.
export const requestToJoinCab = async (cabShareId) => {
  const response = await api.post(
    `/cab-shares/${cabShareId}/requests`
  );

  return response.data;
};

// Approve or reject a passenger's join request.
// action must be "approved" or "rejected".
export const respondToCabRequest = async (
  cabShareId,
  requestId,
  action
) => {
  const response = await api.patch(
    `/cab-shares/${cabShareId}/requests/${requestId}`,
    { action }
  );

  return response.data;
};

// Withdraw a pending or approved join request.
export const withdrawCabRequest = async (
  cabShareId,
  requestId
) => {
  const response = await api.patch(
    `/cab-shares/${cabShareId}/requests/${requestId}/withdraw`
  );

  return response.data;
};

// Cancel a cab-sharing post.
export const cancelCabShare = async (cabShareId) => {
  const response = await api.patch(
    `/cab-shares/${cabShareId}/cancel`
  );

  return response.data;
};

// Mark a cab-sharing journey as completed.
export const completeCabShare = async (cabShareId) => {
  const response = await api.patch(
    `/cab-shares/${cabShareId}/complete`
  );

  return response.data;
};
