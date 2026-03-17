import { useState } from "react";
import styles from "@/styles/Home.module.css";

export default function Home() {
  const [status, setStatus] = useState("");

  const pushNotebook = async () => {
    setStatus("Pushing notebook to Kaggle...");
    try {
      const res = await fetch("/api/pushKaggle");
      const data = await res.json();

      if (data.success) {
        setStatus("Notebook pushed successfully 🚀");
      } else {
        setStatus("Push failed ❌");
      }
    } catch (err) {
      setStatus("Error occurred ❌");
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Kaggle Notebook Trigger</h1>
          <div className={styles.ctas}>
            <a
              href="#"
              onClick={pushNotebook}
              className={styles.primary}
            >
              📁 Push Notebook
            </a>
          </div>
          <p className={styles.status}>{status}</p>
        </div>
      </main>
    </div>
  );
}
