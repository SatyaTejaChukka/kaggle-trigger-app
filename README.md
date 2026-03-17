# Kaggle Notebook Trigger

A web application to trigger Kaggle notebooks directly from your browser. This project provides a clean, responsive UI with dark mode support and real-time status feedback for your Kaggle operations.

![Screenshot](public/kaggle_trigger_screenshot.png)

## 🚀 Features

*   **One-Click Operations**: Easily push Kaggle notebooks without leaving your web browser.
*   **Professional UI**: A polished and modern user interface with a responsive layout, hover animations, and shadows.
*   **Dark/Light Mode**: Automatically adapts to your system's color scheme for a comfortable viewing experience.
*   **Real-Time Feedback**: Get instant status updates with clear success or error messages for each operation.
*   **Built with Next.js**: A production-ready application built on the powerful React framework, Next.js.
*   **Extensible**: The API backend can be easily extended to support more Kaggle CLI commands.

## ⚙️ How It Works

This application is a Next.js project that uses API routes to execute Kaggle CLI commands on the server.

1.  The frontend, built with React and styled with CSS Modules, provides a user interface with buttons to trigger API calls.
2.  When a button is clicked, a request is sent to a Next.js API route (e.g., `/api/pushKaggle`).
3.  The API route uses Node.js's `child_process.exec` to run the corresponding `kaggle` command.
4.  The output of the command is captured and sent back to the frontend as a JSON response.
5.  The frontend displays the response to the user, indicating the success or failure of the operation.

## 📖 Getting Started

Follow these steps to set up and run the project locally.

### Step 1: Clone the Repository

First, clone this repository to your local machine:

```bash
git clone https://github.com/your-username/kaggle-trigger-app.git
cd kaggle-trigger-app
```

### Step 2: Prerequisites

Before you can run the application, you need to have the following installed:

*   **Node.js**: Version 18 or higher. You can download it from [nodejs.org](https://nodejs.org/).
*   **Python**: The Kaggle CLI is a Python package. You can download Python from [python.org](https://python.org/).
*   **Kaggle CLI**: Install the Kaggle command-line interface using pip:
    ```bash
    pip install kaggle
    ```

### Step 3: Kaggle API Credentials

To use the Kaggle API, you need to authenticate with your Kaggle account.

1.  Go to your Kaggle account page at `https://www.kaggle.com/<your-username>/account`.
2.  Click on the **"Create New API Token"** button. This will download a `kaggle.json` file.
3.  Place the `kaggle.json` file in the required directory:
    *   **Windows**: `C:\Users\<Your-Username>\.kaggle\`
    *   **macOS/Linux**: `~/.kaggle/`

    You may need to create the `.kaggle` directory if it doesn't exist.

### Step 4: Install Dependencies

Install the project's Node.js dependencies using npm:

```bash
npm install
```

### Step 5: Run the Application

Now, you can start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 📁 Project Structure

Here is an overview of the core files and directories in this project:

```
.
├── kaggle-notebook/
│   |── notebook.ipynb      # Your Kaggle notebook goes here.
|   |── kernel-metadata.json # Metadata about the kaggle account and the notebook.
├── pages/
│   ├── _app.js             # Main App component, used for global styles.
│   ├── index.js            # The main page of the application (your UI).
│   └── api/
│       └── pushKaggle.js   # API route for pushing the notebook.
├── public/
│   └── ...                 # Static assets like images and icons.
├── styles/
│   ├── globals.css         # Global styles for the application.
│   └── Home.module.css     # CSS Modules for styling the home page.
├── .gitignore              # A list of files and folders to be ignored by Git.
├── next.config.mjs         # Configuration file for Next.js.
├── package.json            # Contains the project's dependencies and scripts.
└── README.md               # You are here!
```

## 🔌 API Endpoints

*   **`POST /api/pushKaggle`**: Pushes the notebook in the `kaggle-notebook` directory to Kaggle.

## 🔧 Customization

*   **Notebook Path**: Update the notebook path in `pages/api/pushKaggle.js` if you change the location of your notebook.
*   **Styling**: Customize the application's appearance by editing the CSS variables and classes in `styles/Home.module.css`.

