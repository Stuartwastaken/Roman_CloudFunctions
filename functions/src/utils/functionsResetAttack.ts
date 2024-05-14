import * as admin from "firebase-admin";
/**
 * Retrieves the geographic location of a user from Firebase Realtime Database.
 * @param {string} userId - The unique identifier of the user.
 * @return {Promise<{latitude: number, longitude: number}>} A promise that resolves with the user's latitude and longitude.
 */
export async function getUserLocation(userId: string): Promise<{latitude: number, longitude: number}> {
  const snapshot = await admin.database().ref(`users/${userId}/location`).once("value");
  const location = snapshot.val();
  return {latitude: location.latitude, longitude: location.longitude};
}

/**
   * Extracts the user ID from an HTTP request.
   * @param {any} req - The HTTP request object containing the body with the user ID.
   * @return {string} The extracted user ID.
   * @throws {Error} Throws an error if the request format is invalid or the user ID is missing.
   */
export function getUserIdFromRequest(req: any): string {
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
    throw new Error("No user ID provided");
  }
  return userId;
}

/**
   * Determines if a user's location is within the radius of any bunker.
   * @param {{latitude: number, longitude: number}} userLocation - The user's geographic location.
   * @param {Array<{location: {latitude: number,
   * longitude: number}, radius: number}>} bunkers - An array of bunker objects, each containing a location and a radius.
   * @return {boolean} True if the user is within the radius of any bunker, false otherwise.
   */
export function isWithinAnyBunker(userLocation: {latitude: number,
     longitude: number}, bunkers: any[]): boolean {
  if (!bunkers || bunkers.length === 0) return false;

  for (const bunker of bunkers) {
    const {location, radius} = bunker;
    const distance = calculateDistance(userLocation, {latitude: location.latitude, longitude: location.longitude});
    if (distance <= radius) {
      return true;
    }
  }
  return false;
}

/**
   * Retrieves attack parameters from a user's document in Firestore.
   * @param {admin.firestore.DocumentReference} userRef - A reference to the user's document in Firestore.
   * @return {Promise<{radius: number, originLat: number, originLong: number}>} A promise that resolves with the attack parameters.
   */
export async function getAttackParams(userRef: admin.firestore.DocumentReference): Promise<{radius: number, originLat: number, originLong: number}> {
  const doc = await userRef.get();
  const data = doc.data();
  return {radius: data?.attack.bombRadius, originLat: data?.attack.originLat, originLong: data?.attack.originLong};
}

/**
   * Handles the attack outcome based on the user's shield status and updates Firestore accordingly.
   * @param {admin.firestore.DocumentReference} userRef - A reference to the user's document in Firestore.
   * @param {FirebaseFirestore.DocumentData} userData - The user's data fetched from Firestore.
   */
export async function handleAttackOutcome(userRef: admin.firestore.DocumentReference, userData: FirebaseFirestore.DocumentData) {
  if (userData.shields && userData.shields > 0) {
    await userRef.update({shields: userData.shields - 1});
    console.log(`Shields decremented for user ${userRef.id}`);
  } else {
    await userRef.update({coins: 0});
    console.log(`Coins reset for user ${userRef.id}`);
  }
}

/**
   * Calculates the distance between two geographic coordinates using the Haversine formula.
   * @param {{latitude: number, longitude: number}} loc1 - The first location point.
   * @param {{latitude: number, longitude: number}} loc2 - The second location point.
   * @return {number} The distance in meters.
   */
export function calculateDistance(loc1: {latitude: number, longitude: number}, loc2: {latitude: number, longitude: number}): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = deg2rad(loc2.latitude - loc1.latitude);
  const dLon = deg2rad(loc2.longitude - loc1.longitude);
  const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(loc1.latitude)) * Math.cos(deg2rad(loc2.latitude)) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c * 1000; // Distance in meters
}

/**
   * Converts degrees to radians.
   * @param {number} deg - The angle in degrees.
   * @return {number} The angle in radians.
   */
export function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

/**
   * Checks if the user's location is within the attack radius.
   * @param {{latitude: number, longitude: number}} userLocation - The user's geographic location.
   * @param {{radius: number, originLat: number, originLong: number}} attackParams - The attack parameters including radius and origin coordinates.
   * @return {boolean} True if the user is within the attack radius, false otherwise.
   */
export function checkWithinRadius(userLocation: {latitude: number, longitude: number},
    attackParams: {radius: number, originLat: number, originLong: number}): boolean {
  const distance = calculateDistance(
      {latitude: userLocation.latitude, longitude: userLocation.longitude},
      {latitude: attackParams.originLat, longitude: attackParams.originLong}
  );
  return distance <= attackParams.radius;
}
