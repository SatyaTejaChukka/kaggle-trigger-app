import fs from "fs";
import {
  ensureTargetNotebookIsSelected,
  getKaggleJsonPath,
  getKernelId,
  getKernelStatusDetails,
  NOTEBOOK_PATH,
  prepareNotebookForPush,
  runKaggleCommand
} from "../../lib/kaggleKernel";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({
      success: false,
      error: "Method not allowed. Use POST."
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
    const useCustomFileName = Boolean(req.body?.useCustomFileName);
    const fileName = useCustomFileName ? prepareNotebookForPush(req.body?.fileName) : null;

    if (!useCustomFileName) {
      ensureTargetNotebookIsSelected();
    }

    const kernelId = getKernelId();
    const output = await runKaggleCommand(["kernels", "push", "-p", NOTEBOOK_PATH]);
    const statusDetails = await getKernelStatusDetails(kernelId);

    return res.status(200).json({
      success: true,
      useCustomFileName,
      fileName,
      kernelId: statusDetails.kernelId,
      kernelUrl: statusDetails.kernelUrl,
      message: `Kernel push succeeded. Current Kaggle status: ${statusDetails.status}.`,
      output,
      status: statusDetails.status,
      statusOutput: statusDetails.rawOutput
    });
  } catch (error) {
    console.error("Error in runKernel API:", error.message);

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
