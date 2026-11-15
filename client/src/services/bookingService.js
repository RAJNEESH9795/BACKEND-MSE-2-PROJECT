
import api from "./api";

// Submit a booking request
export const createBooking = async (bookingData) => {
  const response = await api.post("/bookings", bookingData);
  return response.data;
};

// Get booking requests for a ride (ride owner)
export const getRideBookings = async (rideId) => {
  const response = await api.get(`/bookings/ride/${rideId}`);
  return response.data;
};

// Approve or reject a booking
export const updateBookingStatus = async (
  bookingId,
  status
) => {
  const response = await api.patch(
    `/bookings/${bookingId}/status`,
    { status }
  );

  return response.data;
};
