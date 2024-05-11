"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleAttackReset = void 0;
const functions = require("firebase-functions");
const tasks_1 = require("@google-cloud/tasks");
exports.scheduleAttackReset = functions.https
    .onRequest(async (req, res) => {
    var _a;
    const client = new tasks_1.CloudTasksClient();
    const { friendUid, delayMs } = req.body;
    const project = (_a = process.env.GCLOUD_PROJECT) !== null && _a !== void 0 ? _a : "roman-bbb18";
    const queue = "attack-reset-queue";
    const location = "us-central1";
    const queuePath = client.queuePath(project, location, queue);
    const url = `https://us-central1-${project}.cloudfunctions.net/resetAttackStatus`;
    const payload = { userId: friendUid };
    const task = {
        httpRequest: {
            httpMethod: "POST",
            url,
            body: Buffer.from(JSON.stringify(payload)).toString("base64"),
            headers: {
                "Content-Type": "application/json",
            },
        },
        scheduleTime: {
            seconds: Math.floor((Date.now() + delayMs) / 1000),
        },
    };
    const request = {
        parent: queuePath,
        task,
    };
    try {
        const [response] = await client.createTask(request);
        console.log(`Created task ${response.name}`);
        res.status(200).send(`Task created: ${response.name}`);
    }
    catch (error) {
        console.error("Failed to schedule task:", error);
    }
});
//# sourceMappingURL=scheduleAttackReset.js.map