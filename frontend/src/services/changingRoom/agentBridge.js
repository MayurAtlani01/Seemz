/**
 * SEEMZ Changing Room — Agentic AI Bridge
 * Exposes a structured API interface for future autonomous AI fashion agents
 * (Styling Agent, Fit Agent, Shopping Agent, Personalization Agent).
 */

class ChangingRoomAgentBridge {
  constructor() {
    this.state = {
      body: null,
      garment: null,
      cameraView: "front",
      fitAnalysis: null,
    };
    this.listeners = new Set();
  }

  // Subscribe to state updates
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners
  _notify(action, payload) {
    this.listeners.forEach((listener) => {
      try {
        listener(action, payload, this.state);
      } catch (err) {
        console.error("AgentBridge listener error:", err);
      }
    });
  }

  // State synchronization from UI
  syncState(body, garment, fitAnalysis) {
    this.state.body = body;
    this.state.garment = garment;
    this.state.fitAnalysis = fitAnalysis;
  }

  // AGENT ACTION: Set body measurements
  setBodyMeasurements(measurements) {
    this._notify("SET_BODY_MEASUREMENTS", measurements);
    return { success: true, message: "Body measurements updated", data: measurements };
  }

  // AGENT ACTION: Change garment category
  setGarmentCategory(category) {
    this._notify("SET_GARMENT_CATEGORY", category);
    return { success: true, message: `Garment category set to ${category}` };
  }

  // AGENT ACTION: Change material
  setMaterial(material) {
    this._notify("SET_MATERIAL", material);
    return { success: true, message: `Material set to ${material}` };
  }

  // AGENT ACTION: Change style
  setStyle(style) {
    this._notify("SET_STYLE", style);
    return { success: true, message: `Style modified to ${style}` };
  }

  // AGENT ACTION: Change size
  setSize(size) {
    this._notify("SET_SIZE", size);
    return { success: true, message: `Size updated to ${size}` };
  }

  // AGENT ACTION: Change color
  setColor(colorHex) {
    this._notify("SET_COLOR", colorHex);
    return { success: true, message: `Color changed to ${colorHex}` };
  }

  // AGENT ACTION: Change camera perspective
  changeCamera(viewName) {
    this._notify("CHANGE_CAMERA", viewName);
    return { success: true, message: `Camera changed to ${viewName}` };
  }

  // AGENT QUERY: Get current fit analysis
  getFitAnalysis() {
    return this.state.fitAnalysis;
  }

  // AGENT EXPORT: Export current digital fashion configuration
  exportState() {
    return { ...this.state };
  }
}

export const agentBridge = new ChangingRoomAgentBridge();
export default agentBridge;
