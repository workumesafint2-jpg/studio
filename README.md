# ወርቁ (Worku) - Smart BPMN Generator

A professional BPMN diagram generator with AI-ready logic, optimized for production APK deployment.

## Production Build Instructions (APK)

To generate the production APK for your Android device:

1. **Install Source**: Download the project source code.
2. **Setup Dependencies**: Open your terminal and run:
   ```bash
   npm install
   ```
3. **Build Web Assets**:
   ```bash
   npm run build
   ```
4. **Capacitor Android Sync**:
   ```bash
   npx cap add android
   npx cap copy android
   ```
5. **Generate APK**:
   ```bash
   npx cap open android
   ```
   *In Android Studio, go to `Build > Build Bundle(s) / APK(s) > Build APK(s)`.*

## Key Features
- **Empty Start Logic**: Complies with BPMN 2.0 purity standards (bpmn:startEvent).
- **Midpoint Labeling**: Strategic text placement on sequence flow connectors ('ከጸደቀ', 'ካልጸደቀ').
- **Horizontal-Only Engine**: Professional single-row layout (350px gap) for complex processes up to 20 steps.
- **Side-Positioned Data Objects**: Document icons positioned with dotted associations to avoid flow overlap.
- **Dynamic Multi-Service Import**: Support for CSV/Text file processing for batch diagram generation.
- **High-Resolution Storage**: High-resolution SVG, PNG, and BPMN XML exports to local mobile storage.

## Service Processing
The system is tested and verified to handle **44+ industrial service steps** in a single workspace without overlap.

---
© 2024 ወርቁ Pro - FINAL PRODUCTION BUILD.