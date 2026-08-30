import API from "./api";

/**
 * Sends a user message to the Seemz AI assistant backend endpoint.
 * 
 * @param {string} message - The current message string.
 * @param {object} options - Optional context parameters including history, user, weather etc.
 * @returns {Promise<{reply: string}>} - The response object with the AI's reply.
 */
export const sendChatMessage = async (message, { history = [], user, location, weather, products } = {}) => {
  const response = await API.post("/chat", {
    message,
    history,
    user,
    location,
    weather,
    products,
  });
  return response.data;
};
