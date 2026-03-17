import { exec } from "child_process";

export default function handler(req, res) {

  exec(
    "kaggle kernels push -p kaggle-notebook",
    (error, stdout, stderr) => {

      console.log("STDOUT:", stdout);
      console.log("STDERR:", stderr);

      if (error) {
        return res.status(500).json({
          success: false,
          error: stderr || error.message
        });
      }

      res.status(200).json({
        success: true,
        message: "Notebook pushed successfully",
        output: stdout
      });

    }
  );
}