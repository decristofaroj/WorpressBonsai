<!-- START ./wp-plugin-bonsai/README.md -->
# WP Plugin Bonsai: Easy Install Guide (After Download)

Hello! You've made the smart choice to download the project directly. This guide is super simple and will get you running in just a few minutes.

We'll be setting this up on **Windows 11**.

---

### **Part 1: Your Tools (If you don't have them yet)**

Before we start, you need two free tools. If you already have them from the last guide, you can skip this!

**Tool #1: Node.js (The Engine)**
*   Go to the official Node.js website: [https://nodejs.org/](https://nodejs.org/)
*   Click the button that says **LTS** and install it like any other program.

**Tool #2: Visual Studio Code (The Super-Smart Notepad)**
*   Go to the Visual Studio Code website: [https://code.visualstudio.com/](https://code.visualstudio.com/)
*   Click the big blue button to download and install it. During setup, make sure to check the boxes for **"Add 'Open with Code' action..."**.

---

### **Part 2: Your Project Folder**

You've already done the hardest part by downloading and unzipping the project!

1.  Find the `wp-plugin-bonsai` folder that you unzipped (you probably put it on your Desktop).
2.  Right-click on that folder and choose **Open with Code**. This will open your entire project in our super-smart notepad!

---

### **Part 3: Turning on the "Electricity" (API Keys)**

This is the most important step. We need to tell the app the secret passwords for the AIs.

1.  **Get Your Keys:** If you haven't already, get your free API keys.
    *   **Google Gemini:** [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
    *   **OpenAI (ChatGPT):** [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
    *   **Anthropic (Claude):** [https://console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
    *   Copy each secret key you create and paste them into a temporary Notepad file.

2.  **Create the Secret File:** In the VS Code file explorer on the left, right-click in an empty space at the very bottom (NOT inside any other folder) and choose **New File...**. Name the file exactly:
    `.env`

3.  **Add Your Keys:** Open the new `.env` file and paste the following. Now, take the secret keys you saved in Notepad and paste them in place of the `YOUR_..._HERE` text.

    ```
    # Google Gemini API Key
    VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE

    # OpenAI (ChatGPT) API Key
    VITE_OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE

    # Anthropic (Claude) API Key
    VITE_ANTHROPIC_API_KEY=YOUR_ANTHROPIC_API_KEY_HERE
    ```
4.  Press `Ctrl+S` to save the file!

---

### **Part 4: Starting Your App!**

You're at the final step!

1.  **Open the Terminal:** Inside VS Code, look at the menu at the top of the screen. Click **Terminal > New Terminal**. A little command window will open at the bottom.
2.  **Download the Building Blocks:** Copy and paste this command into the terminal and press **Enter**. This downloads all the code libraries the app needs. It might take a minute.

    ```bash
    npm install
    ```

3.  **Flip the ON Switch:** Now, run the final command:

    ```bash
    npm run dev
    ```

The terminal will show you a message with a local URL, probably `http://localhost:5173`.

**Congratulations!** Open your web browser (like Chrome or Edge) and go to that `http://localhost:5173` address. Your very own WP Plugin Bonsai is now running on your computer!
<!-- END ./wp-plugin-bonsai/README.md -->
