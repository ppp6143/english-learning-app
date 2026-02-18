# Deploying to Vercel

Refreshed Instructions:
**I have already saved your files locally (Git Commit is done).**
You just need to upload them to the internet.

## 1. Create a Repository on GitHub
1.  Go to [GitHub New Repository](https://github.com/new).
2.  Repository name: `english-learning-app`.
3.  **Leave everything else unchecked** (Public is fine).
4.  Click **Create repository**.

## 2. Upload (Push) your code
1.  On the next screen, look for the section:
    **"…or push an existing repository from the command line"**
2.  Copy the 3 lines of code shown there. They look like this:
    ```bash
    git remote add origin https://github.com/YOUR_NAME/english-learning-app.git
    git branch -M main
    git push -u origin main
    ```
3.  Paste them into your VS Code terminal and press Enter.
    - If a browser window opens, sign in and authorize GitHub.

## 3. Deploy to Vercel
1.  Go to [Vercel Dashboard](https://vercel.com/dashboard).
2.  **Add New...** -> **Project**.
3.  **Import** the `english-learning-app` repository you just created.
4.  **Environment Variables**:
    - Key: `GEMINI_API_KEY`
    - Value: (Your API Key)
5.  Click **Deploy**.

Done!
