# Ultimate Prompter Studio - Windows .exe Instructions

To run or build Ultimate Prompter Studio as a native Windows `.exe` application:

### Option 1: Automated Build Script (Recommended)
1. Double-click on `build_windows.bat` in the project root folder.
2. The script will automatically install dependencies, build the React app, and package the Windows `.exe` and installer via `electron-builder`.
3. Once completed, your `.exe` and NSIS installer will be located inside the newly created `release/` folder.

### Option 2: Manual Commands via Command Prompt / PowerShell
1. Open PowerShell or Command Prompt in the project folder.
2. Run `npm install`
3. Run `npm run electron:build`
4. Find your standalone `.exe` in `release/`.

### Running in Development Mode (Hot Reload)
- Run `npm run electron:dev` to launch the app inside Electron connected to the local Vite development server.
