export function generateBPMN(input: string): string {
  if (!input.trim()) return '';

  const lines = input.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  // 1. Identify Nodes and their properties
  const nodes = lines.map((text, index) => {
    const isGateway = text.includes('?') || text.toLowerCase().includes('if') || text.toLowerCase().includes('whether');
    const isLoop = text.toLowerCase().match(/back to|goto|repeat|return to/i);
    const isNegative = text.toLowerCase().match(/reject|cancel|fail|error|no|invalid|stop/i);
    
    return {
      id: `Node_${index}`,
      name: text,
      isGateway,
      isLoop: !!isLoop,
      isNegative: !!isNegative,
      index
    };
  });

  let processContent = '';
  let flowContent = '';
  let diagramContent = '';

  // Layout Constants
  const Y_MAIN = 160;
  const Y_BRANCH = 320;
  const TASK_W = 100;
  const TASK_H = 80;
  const GATEWAY_W = 50;
  const GATEWAY_H = 50;

  // Track positions for edge calculation
  const positions: Record<string, { x: number, y: number, w: number, h: number, renderY: number }> = {
    "StartEvent": { x: 150, y: Y_MAIN, w: 36, h: 36, renderY: Y_MAIN - 18 }
  };

  // Start Event
  processContent += '    <bpmn:startEvent id="StartEvent" name="Start">\n      <bpmn:outgoing>Flow_Start</bpmn:outgoing>\n    </bpmn:startEvent>\n';
  diagramContent += `
      <bpmndi:BPMNShape id="StartEvent_di" bpmnElement="StartEvent">
        <dc:Bounds x="150" y="${Y_MAIN - 18}" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="156" y="${Y_MAIN + 23}" width="24" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>`;

  let lastNodeId = "StartEvent";
  let currentX = 250;

  // 2. Build Nodes and Sequential Flows
  nodes.forEach((node, i) => {
    const nodeY = node.isNegative ? Y_BRANCH : Y_MAIN;
    const w = node.isGateway ? GATEWAY_W : TASK_W;
    const h = node.isGateway ? GATEWAY_H : TASK_H;
    const renderY = nodeY - (h / 2);
    const nodeX = currentX;

    // Node Definition
    const type = node.isGateway ? 'bpmn:exclusiveGateway' : 'bpmn:task';
    processContent += `    <${type} id="${node.id}" name="${escapeXml(node.name)}">\n`;
    processContent += `      <bpmn:incoming>Flow_${lastNodeId}_to_${node.id}</bpmn:incoming>\n`;
    
    const nextFlowId = i === nodes.length - 1 ? 'Flow_to_End' : `Flow_${node.id}_to_${nodes[i+1].id}`;
    processContent += `      <bpmn:outgoing>${nextFlowId}</bpmn:outgoing>\n`;
    processContent += `    </${type}>\n`;

    // Sequential Flow Definition
    const flowId = `Flow_${lastNodeId}_to_${node.id}`;
    flowContent += `    <bpmn:sequenceFlow id="${flowId}" sourceRef="${lastNodeId}" targetRef="${node.id}" />\n`;

    // Diagram Shape
    diagramContent += `
      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}" isMarkerVisible="true">
        <dc:Bounds x="${nodeX}" y="${renderY}" width="${w}" height="${h}" />
      </bpmndi:BPMNShape>`;

    // Diagram Edge (Sequence Flow)
    const prev = positions[lastNodeId];
    diagramContent += `
      <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
        <di:waypoint x="${prev.x + prev.w}" y="${prev.y + (lastNodeId === "StartEvent" ? 0 : prev.h / 2)}" />
        <di:waypoint x="${nodeX}" y="${nodeY}" />
      </bpmndi:BPMNEdge>`;

    positions[node.id] = { x: nodeX, y: nodeY, w: w, h: h, renderY: renderY };
    currentX += w + 100;
    lastNodeId = node.id;
  });

  // 3. End Event
  processContent += '    <bpmn:endEvent id="EndEvent" name="End">\n      <bpmn:incoming>Flow_to_End</bpmn:incoming>\n    </bpmn:endEvent>\n';
  const finalFlowId = `Flow_to_End`;
  flowContent += `    <bpmn:sequenceFlow id="${finalFlowId}" sourceRef="${lastNodeId}" targetRef="EndEvent" />\n`;
  
  diagramContent += `
      <bpmndi:BPMNShape id="EndEvent_di" bpmnElement="EndEvent">
        <dc:Bounds x="${currentX}" y="${Y_MAIN - 18}" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${currentX + 8}" y="${Y_MAIN + 23}" width="20" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="${finalFlowId}_di" bpmnElement="${finalFlowId}">
        <di:waypoint x="${positions[lastNodeId].x + positions[lastNodeId].w}" y="${positions[lastNodeId].y}" />
        <di:waypoint x="${currentX}" y="${Y_MAIN}" />
      </bpmndi:BPMNEdge>`;

  // 4. Loop Logic (Back-references)
  nodes.forEach(node => {
    if (node.isLoop) {
      const match = node.name.match(/(?:back to|goto|repeat|return to)\s+(.+)/i);
      if (match) {
        const targetName = match[1].trim().toLowerCase();
        const target = nodes.find(n => n.name.toLowerCase().includes(targetName));
        if (target) {
          const loopFlowId = `Flow_Loop_${node.id}_${target.id}`;
          processContent += `    <bpmn:sequenceFlow id="${loopFlowId}" sourceRef="${node.id}" targetRef="${target.id}" />\n`;
          
          const src = positions[node.id];
          const trg = positions[target.id];
          // Draw a curved back-link above the diagram
          diagramContent += `
      <bpmndi:BPMNEdge id="${loopFlowId}_di" bpmnElement="${loopFlowId}">
        <di:waypoint x="${src.x + src.w / 2}" y="${src.renderY}" />
        <di:waypoint x="${src.x + src.w / 2}" y="${src.renderY - 60}" />
        <di:waypoint x="${trg.x + trg.w / 2}" y="${trg.renderY - 60}" />
        <di:waypoint x="${trg.x + trg.w / 2}" y="${trg.renderY}" />
      </bpmndi:BPMNEdge>`;
        }
      }
    }
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                  targetNamespace="http://bpmn.io/schema/bpmn"
                  exporter="BPMN FlowForge" 
                  exporterVersion="1.2">
  <bpmn:process id="Process_Professional" isExecutable="false">
${processContent}
${flowContent}
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_Professional">
${diagramContent}
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