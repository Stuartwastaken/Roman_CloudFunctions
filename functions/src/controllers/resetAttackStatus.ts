import * as functions from "firebase-functions";
import * as admin from "firebase-admin";


export const resetAttackStatus = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Only POST requests are accepted");
    return;
  }

  console.log("Received request body:", req.body);

  try {
    let userId;
    if (typeof req.body === "string") {
      const decodedString = Buffer.from(req.body, "base64").toString();
      const payload = JSON.parse(decodedString);
      userId = payload.userId;
    } else if (typeof req.body === "object" && req.body.userId) {
      userId = req.body.userId;
    } else {
      throw new Error("Invalid request body format");
    }

    if (!userId) {
      res.status(400).send("No user ID provided");
      return;
    }

    const userRef = admin.firestore().doc(`users/${userId}`);
    await userRef.update({
      "attack.active": false,
    });
    console.log(`Attack status reset for user ${userId}`);
    res.status(200).send(`Attack status reset for user ${userId}`);
  } catch (error) {
    console.error("Error handling request:", error);
    res.status(500).send("Error processing request: ");
  }
});
