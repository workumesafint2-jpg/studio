export function generateBPMN(input: string): string {
  if (!input.trim()) return '';

  const steps = input
    .split(/\n|,/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  let processElements = '    <bpmn:startEvent id="StartEvent_1" name="Start" />\n';
  let diagramElements = `
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="150" y="150" width="36" height="36" />
      </bpmndi:BPMNShape>`;

  let lastId = "StartEvent_1";
  let currentX = 230;

  steps.forEach((stepName, i) => {
    const currentId = `Activity_${i}`;
    const flowId = `Flow_${i}`;

    // Smart detection for gateways (questions or keywords)
    const isGateway = stepName.includes('?') || 
                      stepName.toLowerCase().includes('if') || 
                      stepName.toLowerCase().includes('whether');
    
    const type = isGateway ? "bpmn:exclusiveGateway" : "bpmn:task";
    const width = isGateway ? 50 : 100;
    const height = isGateway ? 50 : 80;
    const yPos = isGateway ? 143 : 135;

    processElements += `    <bpmn:sequenceFlow id="${flowId}" sourceRef="${lastId}" targetRef="${currentId}" />\n`;
    processElements += `    <${type} id="${currentId}" name="${escapeXml(stepName)}" />\n`;

    diagramElements += `
      <bpmndi:BPMNShape id="${currentId}_di" bpmnElement="${currentId}" isMarkerVisible="true">
        <dc:Bounds x="${currentX}" y="${yPos}" width="${width}" height="${height}" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
        <di:waypoint x="${lastId === "StartEvent_1" ? currentX - 44 : currentX - 50}" y="168" />
        <di:waypoint x="${currentX}" y="168" />
      </bpmndi:BPMNEdge>`;

    lastId = currentId;
    currentX += width + 50;
  });

  processElements += `    <bpmn:sequenceFlow id="FinalFlow" sourceRef="${lastId}" targetRef="EndEvent_1" />\n`;
  processElements += '    <bpmn:endEvent id="EndEvent_1" name="End" />';

  diagramElements += `
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="${currentX}" y="150" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="FinalFlow_di" bpmnElement="FinalFlow">
        <di:waypoint x="${currentX - 50}" y="168" />
        <di:waypoint x="${currentX}" y="168" />
      </bpmndi:BPMNEdge>`;

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