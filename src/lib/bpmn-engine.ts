export function generateBPMN(input: string, title: string = "Process Diagram"): string {
  if (!input.trim()) return '';

  const lines = input.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  // 1. Pre-process nodes and determine types
  const nodes = lines.map((text, index) => {
    const isQuestion = text.includes('?') || text.toLowerCase().startsWith('is ') || text.toLowerCase().startsWith('check ');
    const isNegative = text.toLowerCase().match(/reject|cancel|fail|error|invalid|stop|terminate/i);
    const isLoopTrigger = text.toLowerCase().match(/back to|goto|repeat|return to|fix|edit|retry/i);
    
    return {
      id: `Node_${index}`,
      originalText: text,
      name: text,
      isGateway: isQuestion,
      isNegative: !!isNegative,
      isLoopTrigger: !!isLoopTrigger,
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
  const STEP_X = 200;

  const positions: Record<string, { x: number, y: number, w: number, h: number, renderY: number }> = {
    "StartEvent": { x: 100, y: Y_MAIN, w: 36, h: 36, renderY: Y_MAIN - 18 }
  };

  // Start Event
  processContent += '    <bpmn:startEvent id="StartEvent" name="Start">\n      <bpmn:outgoing>Flow_Start</bpmn:outgoing>\n    </bpmn:startEvent>\n';
  diagramContent += `
      <bpmndi:BPMNShape id="StartEvent_di" bpmnElement="StartEvent">
        <dc:Bounds x="100" y="${Y_MAIN - 18}" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="106" y="${Y_MAIN + 23}" width="24" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>`;

  let lastNodeId = "StartEvent";
  let currentX = 200;

  // 2. Build Nodes and Primary Flows
  nodes.forEach((node, i) => {
    let loopTargetId: string | null = null;
    if (node.isLoopTrigger) {
      const match = node.name.match(/(?:back to|goto|repeat|return to)\s+(.+)/i);
      const targetName = match ? match[1].trim().toLowerCase() : null;
      
      const targetNode = targetName 
        ? nodes.find(n => n.name.toLowerCase().includes(targetName) && n.index < i)
        : nodes.slice(0, i).reverse().find(n => !n.isGateway); 
        
      if (targetNode) loopTargetId = targetNode.id;
    }

    const nodeY = node.isNegative ? Y_BRANCH : Y_MAIN;
    const w = node.isGateway ? GATEWAY_W : TASK_W;
    const h = node.isGateway ? GATEWAY_H : TASK_H;
    const renderY = nodeY - (h / 2);
    const nodeX = currentX;

    const type = node.isGateway ? 'bpmn:exclusiveGateway' : 'bpmn:task';
    processContent += `    <${type} id="${node.id}" name="${escapeXml(node.name)}">\n`;
    processContent += `      <bpmn:incoming>Flow_${lastNodeId}_to_${node.id}</bpmn:incoming>\n`;
    
    if (node.isNegative) {
      processContent += `      <bpmn:outgoing>Flow_${node.id}_to_End_Neg</bpmn:outgoing>\n`;
    } else if (i < nodes.length - 1) {
      processContent += `      <bpmn:outgoing>Flow_${node.id}_to_${nodes[i+1].id}</bpmn:outgoing>\n`;
    } else {
      processContent += `      <bpmn:outgoing>Flow_${node.id}_to_End</bpmn:outgoing>\n`;
    }
    
    if (loopTargetId) {
      processContent += `      <bpmn:outgoing>Flow_Loop_${node.id}</bpmn:outgoing>\n`;
    }
    processContent += `    </${type}>\n`;

    diagramContent += `
      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}" isMarkerVisible="true">
        <dc:Bounds x="${nodeX}" y="${renderY}" width="${w}" height="${h}" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${nodeX}" y="${renderY + h + 5}" width="${w}" height="${node.isGateway ? 28 : 14}" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>`;

    const flowId = `Flow_${lastNodeId}_to_${node.id}`;
    let flowLabel = "";
    
    const prevNode = nodes.find(n => n.id === lastNodeId);
    if (prevNode?.isGateway) {
      flowLabel = node.isNegative ? "No" : "Yes";
    }

    flowContent += `    <bpmn:sequenceFlow id="${flowId}" ${flowLabel ? `name="${flowLabel}"` : ''} sourceRef="${lastNodeId}" targetRef="${node.id}" />\n`;

    const prevPos = positions[lastNodeId];
    diagramContent += `
      <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
        <di:waypoint x="${prevPos.x + prevPos.w}" y="${prevPos.y + (lastNodeId === "StartEvent" ? 0 : 0)}" />
        <di:waypoint x="${nodeX}" y="${nodeY}" />
        ${flowLabel ? `
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${prevPos.x + prevPos.w + 10}" y="${prevPos.y - 15}" width="20" height="14" />
        </bpmndi:BPMNLabel>` : ''}
      </bpmndi:BPMNEdge>`;

    if (node.isNegative) {
      const endNegId = `End_Neg_${node.id}`;
      const flowToEndNeg = `Flow_${node.id}_to_End_Neg`;
      processContent += `    <bpmn:endEvent id="${endNegId}" name="Rejected">\n      <bpmn:incoming>${flowToEndNeg}</bpmn:incoming>\n    </bpmn:endEvent>\n`;
      flowContent += `    <bpmn:sequenceFlow id="${flowToEndNeg}" sourceRef="${node.id}" targetRef="${endNegId}" />\n`;
      
      diagramContent += `
      <bpmndi:BPMNShape id="${endNegId}_di" bpmnElement="${endNegId}">
        <dc:Bounds x="${nodeX + w + 80}" y="${Y_BRANCH - 18}" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${nodeX + w + 76}" y="${Y_BRANCH + 23}" width="44" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="${flowToEndNeg}_di" bpmnElement="${flowToEndNeg}">
        <di:waypoint x="${nodeX + w}" y="${Y_BRANCH}" />
        <di:waypoint x="${nodeX + w + 80}" y="${Y_BRANCH}" />
      </bpmndi:BPMNEdge>`;
    }

    if (loopTargetId) {
      const loopFlowId = `Flow_Loop_${node.id}`;
      flowContent += `    <bpmn:sequenceFlow id="${loopFlowId}" sourceRef="${node.id}" targetRef="${loopTargetId}" />\n`;
      
      const src = { x: nodeX, y: nodeY, w: w, h: h, renderY: renderY };
      const trg = positions[loopTargetId];
      diagramContent += `
      <bpmndi:BPMNEdge id="${loopFlowId}_di" bpmnElement="${loopFlowId}">
        <di:waypoint x="${src.x + src.w / 2}" y="${src.renderY}" />
        <di:waypoint x="${src.x + src.w / 2}" y="${src.renderY - 100}" />
        <di:waypoint x="${trg.x + trg.w / 2}" y="${trg.renderY - 100}" />
        <di:waypoint x="${trg.x + trg.w / 2}" y="${trg.renderY}" />
      </bpmndi:BPMNEdge>`;
    }

    positions[node.id] = { x: nodeX, y: nodeY, w: w, h: h, renderY: renderY };
    currentX += w + STEP_X;
    
    if (!node.isNegative) {
      lastNodeId = node.id;
    }
  });

  const lastMainNode = nodes.slice().reverse().find(n => !n.isNegative);
  if (lastMainNode) {
    const finalEndId = "EndEvent_Final";
    const finalFlowId = `Flow_${lastMainNode.id}_to_End`;
    processContent += `    <bpmn:endEvent id="${finalEndId}" name="Completed">\n      <bpmn:incoming>${finalFlowId}</bpmn:incoming>\n    </bpmn:endEvent>\n`;
    flowContent += `    <bpmn:sequenceFlow id="${finalFlowId}" sourceRef="${lastMainNode.id}" targetRef="${finalEndId}" />\n`;
    
    const finalX = positions[lastMainNode.id].x + positions[lastMainNode.id].w + 100;
    diagramContent += `
      <bpmndi:BPMNShape id="${finalEndId}_di" bpmnElement="${finalEndId}">
        <dc:Bounds x="${finalX}" y="${Y_MAIN - 18}" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${finalX - 10}" y="${Y_MAIN + 23}" width="56" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="${finalFlowId}_di" bpmnElement="${finalFlowId}">
        <di:waypoint x="${positions[lastMainNode.id].x + positions[lastMainNode.id].w}" y="${Y_MAIN}" />
        <di:waypoint x="${finalX}" y="${Y_MAIN}" />
      </bpmndi:BPMNEdge>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                  targetNamespace="http://bpmn.io/schema/bpmn"
                  exporter="BPMN FlowForge" 
                  exporterVersion="1.3">
  <bpmn:process id="Process_Professional" name="${escapeXml(title)}" isExecutable="false">
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
