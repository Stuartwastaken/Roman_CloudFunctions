"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkWithinRadius = exports.deg2rad = exports.calculateDistance = exports.handleAttackOutcome = exports.getAttackParams = exports.isWithinAnyBunker = exports.getUserIdFromRequest = exports.getUserLocation = void 0;
const admin = require("firebase-admin");
/**
 * Retrieves the geographic location of a user from Firebase Realtime Database.
 * @param {string} userId - The unique identifier of the user.
 * @return {Promise<{latitude: number, longitude: number}>} A promise that resolves with the user's latitude and longitude.
 */
async function getUserLocation(userId) {
    const snapshot = await admin.database().ref(`users/${userId}/location`).once("value");
    const location = snapshot.val();
    return { latitude: location.latitude, longitude: location.longitude };
}
exports.getUserLocation = getUserLocation;
/**
   * Extracts the user ID from an HTTP request.
   * @param {any} req - The HTTP request object containing the body with the user ID.
   * @return {string} The extracted user ID.
   * @throws {Error} Throws an error if the request format is invalid or the user ID is missing.
   */
function getUserIdFromRequest(req) {
    let userId;
    if (typeof req.body === "string") {
        const decodedString = Buffer.from(req.body, "base64").toString();
        const payload = JSON.parse(decodedString);
        userId = payload.userId;
    }
    else if (typeof req.body === "object" && req.body.userId) {
        userId = req.body.userId;
    }
    else {
        throw new Error("Invalid request body format");
    }
    if (!userId) {
        throw new Error("No user ID provided");
    }
    return userId;
}
exports.getUserIdFromRequest = getUserIdFromRequest;
/**
   * Determines if a user's location is within the radius of any bunker.
   * @param {{latitude: number, longitude: number}} userLocation - The user's geographic location.
   * @param {Array<{location: {latitude: number,
   * longitude: number}, radius: number}>} bunkers - An array of bunker objects, each containing a location and a radius.
   * @return {boolean} True if the user is within the radius of any bunker, false otherwise.
   */
function isWithinAnyBunker(userLocation, bunkers) {
    if (!bunkers || bunkers.length === 0)
        return false;
    for (const bunker of bunkers) {
        const { location, radius } = bunker;
        const distance = calculateDistance(userLocation, { latitude: location.latitude, longitude: location.longitude });
        if (distance <= radius) {
            return true;
        }
    }
    return false;
}
exports.isWithinAnyBunker = isWithinAnyBunker;
/**
   * Retrieves attack parameters from a user's document in Firestore.
   * @param {admin.firestore.DocumentReference} userRef - A reference to the user's document in Firestore.
   * @return {Promise<{radius: number, originLat: number, originLong: number}>} A promise that resolves with the attack parameters.
   */
async function getAttackParams(userRef) {
    const doc = await userRef.get();
    const data = doc.data();
    return { radius: data === null || data === void 0 ? void 0 : data.attack.bombRadius, originLat: data === null || data === void 0 ? void 0 : data.attack.originLat, originLong: data === null || data === void 0 ? void 0 : data.attack.originLong };
}
exports.getAttackParams = getAttackParams;
/**
   * Handles the attack outcome based on the user's shield status and updates Firestore accordingly.
   * @param {admin.firestore.DocumentReference} userRef - A reference to the user's document in Firestore.
   * @param {FirebaseFirestore.DocumentData} userData - The user's data fetched from Firestore.
   */
async function handleAttackOutcome(userRef, userData) {
    if (userData.shields && userData.shields > 0) {
        await userRef.update({ shields: userData.shields - 1 });
        console.log(`Shields decremented for user ${userRef.id}`);
    }
    else {
        await userRef.update({ coins: 0 });
        console.log(`Coins reset for user ${userRef.id}`);
    }
}
exports.handleAttackOutcome = handleAttackOutcome;
/**
   * Calculates the distance between two geographic coordinates using the Haversine formula.
   * @param {{latitude: number, longitude: number}} loc1 - The first location point.
   * @param {{latitude: number, longitude: number}} loc2 - The second location point.
   * @return {number} The distance in meters.
   */
function calculateDistance(loc1, loc2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = deg2rad(loc2.latitude - loc1.latitude);
    const dLon = deg2rad(loc2.longitude - loc1.longitude);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(loc1.latitude)) * Math.cos(deg2rad(loc2.latitude)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // Distance in meters
}
exports.calculateDistance = calculateDistance;
/**
   * Converts degrees to radians.
   * @param {number} deg - The angle in degrees.
   * @return {number} The angle in radians.
   */
function deg2rad(deg) {
    return deg * (Math.PI / 180);
}
exports.deg2rad = deg2rad;
/**
   * Checks if the user's location is within the attack radius.
   * @param {{latitude: number, longitude: number}} userLocation - The user's geographic location.
   * @param {{radius: number, originLat: number, originLong: number}} attackParams - The attack parameters including radius and origin coordinates.
   * @return {boolean} True if the user is within the attack radius, false otherwise.
   */
function checkWithinRadius(userLocation, attackParams) {
    const distance = calculateDistance({ latitude: userLocation.latitude, longitude: userLocation.longitude }, { latitude: attackParams.originLat, longitude: attackParams.originLong });
    return distance <= attackParams.radius;
}
exports.checkWithinRadius = checkWithinRadius;
//# sourceMappingURL=functionsResetAttack.js.map