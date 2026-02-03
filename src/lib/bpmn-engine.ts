export function generateBPMN(input: string): string {
  if (!input.trim()) return '';

  const steps = input
    .split(/\n|,/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  let processElements = '';
  let diagramElements = '';

  // 1. Start Event Definition
  processElements += '    <bpmn:startEvent id="StartEvent_1" name="Start">\n';
  processElements += '      <bpmn:outgoing>Flow_Start</bpmn:outgoing>\n';
  processElements += '    </bpmn:startEvent>\n';

  // Start Event Shape
  diagramElements += `
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="150" y="150" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="156" y="193" width="24" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>`;

  let lastId = "StartEvent_1";
  let lastFlowId = "Flow_Start";
  let currentX = 250;
  let lastX = 150;
  let lastWidth = 36;

  // 2. Iterate through steps to create Tasks and Gateways
  steps.forEach((stepName, i) => {
    const currentId = `Activity_${i}`;
    const nextFlowId = i === steps.length - 1 ? 'Flow_End' : `Flow_${i + 1}`;
    
    // Detect if this step should be a Gateway or a Task
    const isGateway = stepName.includes('?') || 
                      stepName.toLowerCase().includes('if') || 
                      stepName.toLowerCase().includes('whether');
    
    const type = isGateway ? "bpmn:exclusiveGateway" : "bpmn:task";
    const width = isGateway ? 50 : 100;
    const height = isGateway ? 50 : 80;
    const yPos = isGateway ? 143 : 135;

    // Sequence Flow Definition (linking last element to this one)
    processElements += `    <bpmn:sequenceFlow id="${lastFlowId}" sourceRef="${lastId}" targetRef="${currentId}" />\n`;
    
    // Element Definition with explicit references
    processElements += `    <${type} id="${currentId}" name="${escapeXml(stepName)}">\n`;
    processElements += `      <bpmn:incoming>${lastFlowId}</bpmn:incoming>\n`;
    processElements += `      <bpmn:outgoing>${nextFlowId}</bpmn:outgoing>\n`;
    processElements += `    </${type}>\n`;

    // Diagram Shape for Element
    diagramElements += `
      <bpmndi:BPMNShape id="${currentId}_di" bpmnElement="${currentId}" isMarkerVisible="true">
        <dc:Bounds x="${currentX}" y="${yPos}" width="${width}" height="${height}" />
      </bpmndi:BPMNShape>`;
      
    // Diagram Edge for Sequence Flow
    diagramElements += `
      <bpmndi:BPMNEdge id="${lastFlowId}_di" bpmnElement="${lastFlowId}">
        <di:waypoint x="${lastX + lastWidth}" y="168" />
        <di:waypoint x="${currentX}" y="168" />
      </bpmndi:BPMNEdge>`;

    // Update state for next iteration
    lastId = currentId;
    lastFlowId = nextFlowId;
    lastX = currentX;
    lastWidth = width;
    currentX += width + 70; // Spacing between elements
  });

  // 3. End Event Definition
  processElements += '    <bpmn:endEvent id="EndEvent_1" name="End">\n';
  processElements += `      <bpmn:incoming>${lastFlowId}</bpmn:incoming>\n`;
  processElements += '    </bpmn:endEvent>\n';

  // End Event Shape and Final Edge
  diagramElements += `
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="${currentX}" y="150" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${currentX + 8}" y="193" width="20" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="${lastFlowId}_di" bpmnElement="${lastFlowId}">
        <di:waypoint x="${lastX + lastWidth}" y="168" />
        <di:waypoint x="${currentX}" y="168" />
      </bpmndi:BPMNEdge>`;

  // Final XML Construction
  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                  targetNamespace="http://bpmn.io/schema/bpmn"
                  exporter="BPMN FlowForge" 
                  exporterVersion="1.0">
  <bpmn:process id="Process_Innovation" isExecutable="false">
${processElements}
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_Innovation">
${diagramElements}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}