
# (ወርቁ) - Smart BPMN Generator

A professional BPMN diagram generator with AI-ready logic, optimized for desktop and mobile.

## How to Install on Your Laptop (Windows)

To get the standalone `.exe` installer for your Lenovo or any Windows laptop:

1. **Download the source code**: Use the "Download Project" button in your Firebase Studio editor.
2. **Unzip the file**: Extract the project to a folder on your laptop.
3. **Install Dependencies**: Open your terminal (Command Prompt or PowerShell) in that folder and run:
   ```bash
   npm install
   ```
4. **Build the Installer**: Run the following command:
   ```bash
   npm run electron:build
   ```
5. **Get your App**:
   - Open the folder named `dist_electron`.
   - Double-click `Worku-BPMN-Setup-1.0.0.exe` to install it.

## Key Features
- **Professional Branching**: Main paths at Y=250, No/Cancel paths at Y=450.
- **XOR Gateways**: Diamonds with 'X' markers for all decision steps.
- **High-Clearance Loops**: "Edit" or "Fix" steps create arrows back to previous tasks without redundant boxes.
- **Terminal Rejections**: Cancel paths lead to a "Rejected" end event.
- **Exporting**: Download diagrams as high-quality PNGs.
