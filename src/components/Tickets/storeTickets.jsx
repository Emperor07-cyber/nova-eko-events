import { ref, push } from "firebase/database";
import { database } from "../firebase/firebaseConfig";

export const storeTicket = async (userId, ticketData) => {
  try {
    const ticketRef = ref(database, `tickets/${userId}`);
    await push(ticketRef, ticketData);
  } catch (error) {
    console.error("Error storing ticket:", error);
  }
};