import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const resetAttackStatus = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Only POST requests are accepted");
    return;
  }

  const {userId} = JSON.parse(Buffer.from(req.body, "base64").toString());

  if (!userId) {
    res.status(400).send("No user ID provided");
    return;
  }

  const userRef = admin.firestore().doc(`users/${userId}`);

  try {
    await userRef.update({
      "attack.active": false,
    });
    console.log(`Attack status reset for user ${userId}`);
    res.status(200).send(`Attack status reset for user ${userId}`);
  } catch (error) {
    console.error("Error updating user attack status:", error);
    res.status(500).send("Failed to update attack status");
  }
});
