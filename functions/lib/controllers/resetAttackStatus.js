"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetAttackStatus = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const functionsResetAttack_1 = require("../utils/functionsResetAttack");
exports.resetAttackStatus = functions.https.onRequest(async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).send("Only POST requests are accepted");
        return;
    }
    console.log("Received request body:", req.body);
    try {
        const userId = (0, functionsResetAttack_1.getUserIdFromRequest)(req);
        const userRef = admin.firestore().doc(`users/${userId}`);
        const userLocation = await (0, functionsResetAttack_1.getUserLocation)(userId);
        const attackParams = await (0, functionsResetAttack_1.getAttackParams)(userRef);
        const userData = await userRef.get();
        const userDocData = userData.data();
        if (!userDocData) {
            console.log("Cannot find userData.data()");
            return;
        }
        if (userDocData && userDocData.bunkers) {
            // Check if the user is within the radius of any bunker
            if ((0, functionsResetAttack_1.isWithinAnyBunker)(userLocation, userDocData.bunkers)) {
                console.log(`User ${userId} is protected by a bunker`);
                await userRef.update({ "attack.active": false });
                res.status(200).send("User is protected by a bunker");
                return;
            }
        }
        // Always set attack.active to false
        await userRef.update({ "attack.active": false });
        // Check if the user is within the attack radius
        const isWithinRadius = (0, functionsResetAttack_1.checkWithinRadius)(userLocation, attackParams);
        if (isWithinRadius && userDocData) {
            await (0, functionsResetAttack_1.handleAttackOutcome)(userRef, userDocData);
        }
        console.log(`Attack status reset for user ${userId}`);
        res.status(200).send(`Attack status reset for user ${userId}`);
    }
    catch (error) {
        console.error("Error handling request:", error);
        res.status(500).send("Error processing request");
    }
});
//# sourceMappingURL=resetAttackStatus.js.map