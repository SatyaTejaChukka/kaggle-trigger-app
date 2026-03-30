import fs from "fs";
import {
  getKaggleJsonPath,
  getKernelStatusDetails
} from "../../lib/kaggleKernel";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({
      success: false,
      error: "Method not allowed. Use GET."
    });
  }

  const kaggleJsonPath = getKaggleJsonPath();

  if (!fs.existsSync(kaggleJsonPath)) {
    return res.status(500).json({
      success: false,
      error: `kaggle.json not found at ${kaggleJsonPath}`
    });
  }

  try {
    const statusDetails = await getKernelStatusDetails();

    return res.status(200).json({
      success: true,
      kernelId: statusDetails.kernelId,
      kernelUrl: statusDetails.kernelUrl,
      output: statusDetails.rawOutput,
      status: statusDetails.status
    });
  } catch (error) {
    console.error("Error in kernelStatus API:", error.message);

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
