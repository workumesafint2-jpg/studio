# ወርቁ (Worku) - Smart BPMN Generator (Final Build)

A professional BPMN diagram generator with interactive Modeler support, optimized for APK and Desktop deployment.

## Production Build Instructions (APK)

To generate the production APK for your Android device:

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Build Web Assets**:
   ```bash
   npm run build
   ```
3. **Capacitor Configuration**:
   *If not already present:*
   ```bash
   npx cap add android
   ```
   *Sync changes:*
   ```bash
   npx cap sync android
   ```
4. **Generate APK**:
   ```bash
   npx cap open android
   ```
   *In Android Studio, select `Build > Build Bundle(s) / APK(s) > Build APK(s)`.*

## Key Features
- **Interactive Modeler**: Drag-and-drop elements, double-click to edit labels directly.
- **Strict Logic Freeze**: Hardcoded Empty Start Events, Midpoint Flow Labels, and Side-Positioned Data Objects.
- **Scale Optimization**: Processes 44+ industrial service steps in a single 5000px workspace.
- **Wrap to Next Row**: Use the `[wrap]` command in your text description to manually control layout rows.
- **High-Res Storage**: Direct export of high-DPI PNG and SVG files to device storage.

---
© 2024 ወርቁ Pro - FINAL STABLE RELEASE.
