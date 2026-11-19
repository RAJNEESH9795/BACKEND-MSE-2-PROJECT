
import api from "./api";

export const getTrips = async (filters = {}) => {
  const response = await api.get("/trips", {
    params: filters,
  });

  return response.data;
};

export const getMyTrips = async () => {
  const response = await api.get("/trips/my-trips");
  return response.data;
};

export const getMyTripRequests = async () => {
  const response = await api.get("/trips/my-requests");
  return response.data;
};

export const createTrip = async (data) => {
  const response = await api.post("/trips", data);
  return response.data;
};

export const requestToJoinTrip = async (id) => {
  const response = await api.post(`/trips/${id}/requests`);
  return response.data;
};

export const respondToTripRequest = async (
  id,
  requestId,
  action
) => {
  const response = await api.patch(
    `/trips/${id}/requests/${requestId}`,
    { action }
  );

  return response.data;
};

export const withdrawTripRequest = async (id, requestId) => {
  const response = await api.patch(
    `/trips/${id}/requests/${requestId}/withdraw`
  );

  return response.data;
};

export const cancelTrip = async (id) => {
  const response = await api.patch(`/trips/${id}/cancel`);
  return response.data;
};

export const completeTrip = async (id) => {
  const response = await api.patch(`/trips/${id}/complete`);
  return response.data;
};
