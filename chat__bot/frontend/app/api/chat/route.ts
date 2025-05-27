import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Retrieve the message sent by the user
    const { message } = await req.json();

    // URL of the Flask server
    const apiUrl = "http://127.0.0.1:5001/api/analyse"; // Update to the Flask API endpoint

    // Create the payload to send to the chatbot API
    const payload = {
      norme: "ISO 9001", // Example value for the standard
      question: message, // Use the user's message as the question
      reponse: "", // Placeholder for the response
    };

    // Make a POST request to the Flask server
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Check if the response from the API is successful
    if (!response.ok) {
      throw new Error(`API call failed with status ${response.status}`);
    }

    // Extract the response from the chatbot
    const data = await response.json();
    const botResponse = data.evaluation || "No response from the chatbot.";

    // Return the response from the chatbot as JSON
    return NextResponse.json({ reply: botResponse });

  } catch (error) {
    console.error("Error in chat API route:", error);
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 });
  }
}
