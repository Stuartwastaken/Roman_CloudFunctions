import * as admin from "firebase-admin";

admin.initializeApp();

export * from "./controllers/scheduleAttackReset";
export * from "./controllers/resetAttackStatus";
