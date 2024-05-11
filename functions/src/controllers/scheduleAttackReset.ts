import * as functions from "firebase-functions";
import {CloudTasksClient} from "@google-cloud/tasks";

type HttpMethod = "POST" | "GET" | "HEAD" | "PUT" | "DELETE" | "PATCH" | "OPTIONS";

export const scheduleAttackReset = functions.https.onRequest(async (req, res) => {
  const client = new CloudTasksClient();
  const {friendUid, delayMs} = req.body;
  console.log("Received friendUid: ", friendUid);

  if (!friendUid || !delayMs) {
    console.error("Missing parameters in the request.");
    res.status(400).send("Missing parameters.");
    return;
  }

  const project = process.env.GCLOUD_PROJECT ?? "roman-bbb18";
  const queue = "attack-reset-queue";
  const location = "us-central1";
  const queuePath = client.queuePath(project, location, queue);
  const url = `https://us-central1-${project}.cloudfunctions.net/resetAttackStatus`;

  const payload = JSON.stringify({userId: friendUid});
  const task = {
    httpRequest: {
      httpMethod: "POST" as HttpMethod,
      url,
      body: Buffer.from(payload).toString("base64"),
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
  } catch (error) {
    console.error("Failed to schedule task:", error);
    res.status(500).send("Failed to schedule task: ");
  }
});
