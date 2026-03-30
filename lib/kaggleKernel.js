import { execFile } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const MAX_BUFFER_SIZE = 1024 * 1024;

export const NOTEBOOK_PATH = path.join(process.cwd(), "kaggle-notebook");
export const TARGET_NOTEBOOK_FILE = "read-and-write-to-google-drive.ipynb";
export const TARGET_NOTEBOOK_PATH = path.join(NOTEBOOK_PATH, TARGET_NOTEBOOK_FILE);
const METADATA_PATH = path.join(NOTEBOOK_PATH, "kernel-metadata.json");

export function getKaggleJsonPath() {
  return path.join(os.homedir(), ".kaggle", "kaggle.json");
}

export function getKernelMetadata() {
  if (!fs.existsSync(METADATA_PATH)) {
    throw new Error(`Kernel metadata not found at ${METADATA_PATH}`);
  }

  try {
    return JSON.parse(fs.readFileSync(METADATA_PATH, "utf8"));
  } catch (error) {
    throw new Error(`Unable to read kernel metadata: ${error.message}`);
  }
}

export function normalizeNotebookFileName(fileName) {
  if (typeof fileName !== "string") {
    throw new Error("A file name is required.");
  }

  const normalizedFileName = fileName.trim();

  if (!normalizedFileName) {
    throw new Error("A file name is required.");
  }

  if (normalizedFileName.includes("/") || normalizedFileName.includes("\\")) {
    throw new Error("Please enter a file name only, not a path.");
  }

  if (/[\r\n]/.test(normalizedFileName)) {
    throw new Error("The file name cannot contain line breaks.");
  }

  return normalizedFileName;
}

function saveKernelMetadata(metadata) {
  fs.writeFileSync(METADATA_PATH, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
}

export function ensureTargetNotebookIsSelected() {
  const metadata = getKernelMetadata();

  if (metadata.code_file === TARGET_NOTEBOOK_FILE) {
    return metadata;
  }

  const nextMetadata = {
    ...metadata,
    code_file: TARGET_NOTEBOOK_FILE
  };

  saveKernelMetadata(nextMetadata);
  return nextMetadata;
}

export function prepareNotebookForPush(fileName) {
  const normalizedFileName = normalizeNotebookFileName(fileName);

  if (!fs.existsSync(TARGET_NOTEBOOK_PATH)) {
    throw new Error(`Target notebook not found at ${TARGET_NOTEBOOK_PATH}`);
  }

  let notebook;

  try {
    notebook = JSON.parse(fs.readFileSync(TARGET_NOTEBOOK_PATH, "utf8"));
  } catch (error) {
    throw new Error(`Unable to read notebook: ${error.message}`);
  }

  let filePathUpdated = false;
  const updatedCells = notebook.cells.map((cell) => {
    if (!Array.isArray(cell.source)) {
      return cell;
    }

    let cellUpdated = false;
    const updatedSource = cell.source.map((line) => {
      if (!line.startsWith("file_path = ")) {
        return line;
      }

      filePathUpdated = true;
      cellUpdated = true;
      return `file_path = ${JSON.stringify(normalizedFileName)}\n`;
    });

    if (!cellUpdated) {
      return cell;
    }

    return {
      ...cell,
      source: updatedSource
    };
  });

  if (!filePathUpdated) {
    throw new Error(`Unable to find a file_path assignment in ${TARGET_NOTEBOOK_FILE}.`);
  }

  fs.writeFileSync(
    TARGET_NOTEBOOK_PATH,
    `${JSON.stringify({ ...notebook, cells: updatedCells }, null, 1)}\n`,
    "utf8"
  );

  ensureTargetNotebookIsSelected();

  return normalizedFileName;
}

export function getKernelId() {
  const metadata = getKernelMetadata();

  if (!metadata.id) {
    throw new Error("Kernel metadata is missing the required id field.");
  }

  return metadata.id;
}

export function getKernelUrl(kernelId = getKernelId()) {
  return `https://www.kaggle.com/code/${kernelId}`;
}

export function parseKernelStatus(output) {
  const match = output.match(/KernelWorkerStatus\.([A-Z_]+)/);
  return match?.[1] || "UNKNOWN";
}

export async function runKaggleCommand(args) {
  try {
    const { stdout, stderr } = await execFileAsync("kaggle", args, {
      maxBuffer: MAX_BUFFER_SIZE
    });

    return [stdout, stderr].filter(Boolean).join("\n").trim();
  } catch (error) {
    const output = [error.stdout, error.stderr].filter(Boolean).join("\n").trim();
    const message =
      error.code === "ENOENT"
        ? "Kaggle CLI is not installed or not available on PATH."
        : output || error.message;

    throw new Error(message);
  }
}

export async function getKernelStatusDetails(kernelId = getKernelId()) {
  const rawOutput = await runKaggleCommand(["kernels", "status", kernelId]);

  return {
    kernelId,
    kernelUrl: getKernelUrl(kernelId),
    rawOutput,
    status: parseKernelStatus(rawOutput)
  };
}
