import * as functions from "firebase-functions";
import {CloudTasksClient, protos} from "@google-cloud/tasks";

type HttpMethod = "POST" | "GET" | "HEAD" |
 "PUT" | "DELETE" | "PATCH" | "OPTIONS";

export const scheduleAttackReset = functions.https
    .onRequest(async (req, res) => {
      const client = new CloudTasksClient();
      const {friendUid, delayMs}: { friendUid: string; delayMs: number } = req.body;
      const project: string = process.env.GCLOUD_PROJECT ?? "roman-bbb18";
      const queue = "attack-reset-queue";
      const location = "us-central1";
      const queuePath = client.queuePath(project, location, queue);
      const url = `https://us-central1-${project}.cloudfunctions.net/resetAttackStatus`;

      const payload = {userId: friendUid};
      const task: protos.google.cloud.tasks.v2.ITask = {
        httpRequest: {
          httpMethod: "POST" as HttpMethod,
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

      const request: protos.google.cloud.tasks.v2.ICreateTaskRequest = {
        parent: queuePath,
        task,
      };

      try {
        const [response] = await client.createTask(request);
        console.log(`Created task ${response.name}`);
        res.status(200).send(`Task created: ${response.name}`);
      } catch (error) {
        console.error("Failed to schedule task:", error);
      }
    });

