
# ወርቁ (Worku) - Patent Technical Documentation v3.0.2

## 1. System Architecture Overview
The ወርቁ (Worku) system is a multi-platform (Web, Desktop, Mobile) Institutional Process Modeling and Document Management system.

### 1.1 Core Components
- **Intelligent Architect (AI Layer)**: Utilizes Google Genkit and Gemini 1.5 Flash to transform natural language descriptions into structured BPMN logic.
- **BPMN-js Modeler (Visualization)**: A customized rendering engine that allows for real-time manipulation and interactive editing of process flows.
- **Institutional Sync (Persistence Layer)**: A proprietary bridge between client-side modeling and Firebase Firestore (DMS Vault).
- **Multi-Platform Wrapper**: Support for Electron (Desktop) and Capacitor (Android) via Next.js.

## 2. Unique BPMN-to-DMS Integration Logic
The core innovation of ወርቁ (Worku) lies in its **Zero-Failure Persistence Protocol**:
1.  **Unicode-Safe Encoding**: A specialized Base64 encoding mechanism using `TextEncoder` and `Uint8Array` to ensure Ethiopic (Amharic) script is preserved in the BPMN XML without data corruption.
2.  **DMS Vault Mapping**: The system automatically maps generated diagrams to the "Institutional Registry" (DMS), assigning specific categories (Plans, Reports, Reform Docs) based on AI-analyzed metadata.
3.  **Ownership-Based Access Control (OBAC)**: Implements a flat authorization structure in Firestore where every document is tied to an `uploaderId`, ensuring security independence from complex hierarchical trees.

## 3. Institutional Knowledge Base (Registry)
The system contains a hardcoded `BUREAU_SERVICES_REGISTRY` of over 50 institutional services. The AI utilizes fuzzy matching to compare user-generated workflows against these gold-standard benchmarks (Gap Analysis).

## 4. Versioning History Summary

| Version | Milestone | Key Features |
| :--- | :--- | :--- |
| **v1.0.0** | Core Engine | Initial BPMN generation logic and standalone modeling interface. |
| **v2.0.0** | Intelligence Sync | Integration of Genkit AI flows and Firebase real-time synchronization. |
| **v2.5.3** | Industrial Spacing | Optimization of BPMN layout spacing (220/160) for production clarity. |
| **v2.9.0** | Cross-Platform | Addition of Capacitor and Electron support for institutional deployment. |
| **v3.0.0** | Dynamic Intel | Removal of static export to enable Genkit Server Actions and dynamic builds. |
| **v3.0.2** | Patent Ready | Final stabilization of infrastructure routing and Unicode persistence logic. |

---
*© 2024 Innovation and Technology Development Bureau (ITDB). All Rights Reserved.*
