/**
 * Sends the workflow to the backend and polls for the generated output
 * @param {Object} workflow - The full workflow JSON
 * @param {string} serverUrl - The backend server URL (e.g. http://localhost:3001)
 * @returns {string|null} - The final image/video URL or null if not found
 */
export async function sendWorkflowAndPoll(workflow, serverUrl = "http://localhost:3001") {
  // Send workflow
  const res = await fetch(`${serverUrl}/generate-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: workflow }),
  });

  const data = await res.json();
  console.log("🔄 Backend response:", data);

  const queue_id = data?.queue_id;
  if (!queue_id) throw new Error("❌ No queue_id returned from backend");

  // Poll for output
  let foundOutput = null;
  for (let j = 0; j < 1999; j++) {
    const histRes = await fetch(`${serverUrl}/history/${queue_id}`);
    const histData = await histRes.json();

    const outputs = Object.values(histData[queue_id]?.outputs || {});
    for (const output of outputs) {
      if (output?.images) {
        foundOutput = `${serverUrl}/view?filename=${output.images[0].filename}`;
        break;
      }
    }
    if (foundOutput) break;
    await new Promise((r) => setTimeout(r, 1000)); // wait 1s before retry
  }

  if (!foundOutput) {
    console.warn("⚠️ No output found after polling for queue:", queue_id);
  }

  return foundOutput;
}

export const extractFilename = (url) => {
  const params = new URL(url).searchParams;
  return params.get("filename");
};
