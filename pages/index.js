import { useEffect, useEffectEvent, useState } from "react";
import styles from "@/styles/Home.module.css";

const POLL_INTERVAL_MS = 4000;
const ACTIVE_KERNEL_STATUSES = new Set(["PENDING", "QUEUED", "RUNNING"]);

export default function Home() {
  const [status, setStatus] = useState("");
  const [kernelStatus, setKernelStatus] = useState("");
  const [kernelUrl, setKernelUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [useCustomFileName, setUseCustomFileName] = useState(false);
  const [isPollingKernelStatus, setIsPollingKernelStatus] = useState(false);
  const modeLabel = useCustomFileName ? "Custom file_path" : "Push as saved";
  const notebookTarget = "read-and-write-to-google-drive.ipynb";
  const statusMessage =
    status || "Everything is ready. Choose your push mode and send the notebook to Kaggle.";
  const pendingFileName = useCustomFileName
    ? fileName.trim() || "Waiting for a file name"
    : "Use notebook value";

  const getNotebookRequestBody = () => {
    if (!useCustomFileName) {
      return { useCustomFileName: false };
    }

    const trimmedFileName = fileName.trim();

    if (!trimmedFileName) {
      setStatus("Enter the file name you want to save into file_path before pushing.");
      return null;
    }

    return {
      useCustomFileName: true,
      fileName: trimmedFileName
    };
  };

  const pushNotebook = async (event) => {
    event.preventDefault();
    const requestBody = getNotebookRequestBody();

    if (!requestBody) {
      return;
    }

    setStatus(
      requestBody.useCustomFileName
        ? "Pushing notebook to Kaggle with an updated file_path..."
        : "Pushing notebook to Kaggle as it is..."
    );

    try {
      const res = await fetch("/api/pushKaggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });
      const data = await res.json();

      if (data.success) {
        setStatus(
          data.useCustomFileName
            ? `Notebook pushed successfully with file_path set to ${data.fileName}.`
            : "Notebook pushed successfully without changing file_path."
        );
      } else {
        const errorMessage =
          typeof data.error === "string" ? data.error : "Unknown error";

        setStatus(`Push failed: ${errorMessage}`);
      }
    } catch (err) {
      setStatus(`Error occurred: ${err.message || "Request failed"}`);
    }
  };

  const pollKernelStatus = useEffectEvent(async () => {
    try {
      const res = await fetch("/api/kernelStatus");
      const data = await res.json();

      if (!data.success) {
        const errorMessage =
          typeof data.error === "string" ? data.error : "Unknown error";

        setStatus(`Status check failed: ${errorMessage}`);
        setIsPollingKernelStatus(false);
        return false;
      }

      setKernelStatus(data.status || "UNKNOWN");
      setKernelUrl(data.kernelUrl || "");

      if (ACTIVE_KERNEL_STATUSES.has(data.status)) {
        setStatus(`Kaggle status: ${data.status}.`);
        return true;
      }

      setStatus(`Kaggle status: ${data.status || "UNKNOWN"}.`);
      setIsPollingKernelStatus(false);
      return false;
    } catch (err) {
      setStatus(`Status check failed: ${err.message || "Request failed"}`);
      setIsPollingKernelStatus(false);
      return false;
    }
  });

  useEffect(() => {
    if (!isPollingKernelStatus) {
      return undefined;
    }

    let isCancelled = false;
    let timeoutId;

    const scheduleNextPoll = async () => {
      const shouldContinue = await pollKernelStatus();

      if (!isCancelled && shouldContinue) {
        timeoutId = setTimeout(scheduleNextPoll, POLL_INTERVAL_MS);
      }
    };

    scheduleNextPoll();

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [isPollingKernelStatus]);

  const runKernel = async (event) => {
    event.preventDefault();
    const requestBody = getNotebookRequestBody();

    if (!requestBody) {
      return;
    }

    setStatus(
      requestBody.useCustomFileName
        ? "Running kernel on Kaggle with an updated file_path..."
        : "Running kernel on Kaggle without changing file_path..."
    );

    try {
      const res = await fetch("/api/runKernel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });
      const data = await res.json();

      if (data.success) {
        setKernelStatus(data.status || "UNKNOWN");
        setKernelUrl(data.kernelUrl || "");
        setStatus(
          data.useCustomFileName
            ? `Kaggle status: ${data.status || "UNKNOWN"}. file_path is set to ${data.fileName}.`
            : `Kaggle status: ${data.status || "UNKNOWN"}. The notebook was pushed as saved.`
        );
        setIsPollingKernelStatus(ACTIVE_KERNEL_STATUSES.has(data.status));
      } else {
        const errorMessage =
          typeof data.error === "string"
            ? data.error
            : data.error?.error?.message || "Unknown error";

        setIsPollingKernelStatus(false);
        setStatus(`Run failed: ${errorMessage}`);
      }
    } catch (err) {
      setIsPollingKernelStatus(false);
      setStatus(`Error occurred: ${err.message || "Request failed"}`);
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.kicker}>Kaggle Notebook Control Room</span>
            <h1 className={styles.heroTitle}>
              Push, parameterize, and run your notebook from one place.
            </h1>
            <p className={styles.heroLead}>
              Ship the Google Drive workflow to Kaggle exactly as saved, or inject a one-time
              filename into <code>file_path</code> before the push and follow the run status from
              the same screen.
            </p>
            <div className={styles.capabilityRow}>
              <span className={styles.capability}>Frontend file injection</span>
              <span className={styles.capability}>One-click push and run</span>
              <span className={styles.capability}>Live Kaggle status polling</span>
            </div>
          </div>

          <div className={styles.heroCard}>
            <div className={styles.heroCardHeader}>
              <span className={styles.heroCardLabel}>Current Workflow</span>
              <span className={styles.modeBadge}>{modeLabel}</span>
            </div>
            <div className={styles.metricGrid}>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Target Notebook</span>
                <span className={styles.metricValue}>{notebookTarget}</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Polling Interval</span>
                <span className={styles.metricValue}>{POLL_INTERVAL_MS / 1000} seconds</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Push Behavior</span>
                <span className={styles.metricValue}>
                  {useCustomFileName
                    ? "Inject file_path before upload"
                    : "Upload the notebook unchanged"}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.workspace}>
          <div className={styles.controlPanel}>
            <div className={styles.panelHeader}>
              <div className={styles.panelCopy}>
                <span className={styles.eyebrow}>Notebook Options</span>
                <h2 className={styles.panelTitle}>Push Settings</h2>
                <span className={styles.panelText}>
                  Choose whether to push the notebook exactly as saved or inject a filename into{" "}
                  <code>file_path</code> before the push.
                </span>
              </div>
              <span className={styles.modeBadge}>{modeLabel}</span>
            </div>

            <label className={styles.toggleRow} htmlFor="useCustomFileName">
              <span className={styles.toggleText}>
                <span className={styles.toggleTitle}>Override from frontend</span>
                <span className={styles.toggleHint}>
                  Enable this when you want the app to write a one-time filename into{" "}
                  <code>file_path</code>.
                </span>
              </span>
              <span className={styles.switch}>
                <input
                  id="useCustomFileName"
                  className={styles.checkbox}
                  type="checkbox"
                  checked={useCustomFileName}
                  onChange={(event) => setUseCustomFileName(event.target.checked)}
                />
                <span className={styles.slider} />
              </span>
            </label>

            <div
              className={`${styles.fieldGroup} ${
                !useCustomFileName ? styles.fieldGroupDisabled : ""
              }`}
            >
              <label className={styles.label} htmlFor="fileName">
                File Name
              </label>
              <input
                id="fileName"
                className={styles.input}
                type="text"
                value={fileName}
                onChange={(event) => setFileName(event.target.value)}
                placeholder={useCustomFileName ? "example.csv" : "Toggle to enter a file name"}
                autoComplete="off"
                disabled={!useCustomFileName}
              />
              <p className={styles.helper}>
                {useCustomFileName
                  ? "This value is written into file_path in the Kaggle notebook before it is pushed."
                  : "Leave the switch off to keep the notebook exactly as it is on disk and send it to Kaggle unchanged."}
              </p>
            </div>

            <div className={styles.ctas}>
              <button type="button" onClick={pushNotebook} className={styles.primary}>
                Push Notebook
              </button>
              <button type="button" onClick={runKernel} className={styles.secondary}>
                Run Kernel
              </button>
            </div>
          </div>

          <aside className={styles.statusPanel}>
            <div className={styles.statusCard}>
              <span className={styles.cardLabel}>Push Status</span>
              <p className={styles.statusMessage}>{statusMessage}</p>
            </div>

            <div className={styles.metaGrid}>
              <div className={styles.infoCard}>
                <span className={styles.cardLabel}>Kernel</span>
                <span className={styles.cardValue}>{kernelStatus || "Waiting"}</span>
                <span className={styles.cardHint}>
                  {isPollingKernelStatus
                    ? "Polling Kaggle for fresh run updates."
                    : "No active run is currently being tracked."}
                </span>
              </div>

              <div className={styles.infoCard}>
                <span className={styles.cardLabel}>file_path</span>
                <span className={styles.cardValue}>{pendingFileName}</span>
                <span className={styles.cardHint}>
                  {useCustomFileName
                    ? "This value will be written into the notebook on push."
                    : "The saved notebook value will be used unchanged."}
                </span>
              </div>
            </div>

            <div className={styles.linkPanel}>
              <span className={styles.cardLabel}>Notebook Link</span>
              {kernelUrl ? (
                <a
                  className={styles.linkButton}
                  href={kernelUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Kaggle notebook
                </a>
              ) : (
                <p className={styles.linkHint}>
                  A Kaggle URL will appear here after you run the kernel.
                </p>
              )}
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
