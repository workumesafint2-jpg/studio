export function generateBPMN(input: string, title: string = "Process Diagram"): string {
  if (!input.trim()) return '';

  const rawLines = input.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  // 1. Identify Node Types and Roles
  const nodeDefs: any[] = [];
  rawLines.forEach((line, index) => {
    const lowerLine = line.toLowerCase();
    
    // Detection logic
    const isGateway = line.includes('?') || line.includes('፧') || line.includes('？');
    const isLoopTrigger = lowerLine.includes('edit') || lowerLine.includes('fix') || lowerLine.includes('correct') || lowerLine.includes('back');
    const isCancelPath = lowerLine.includes('cancel') || lowerLine.includes('reject') || lowerLine.includes('fail');
    const isTimer = lowerLine.includes('wait') || lowerLine.includes('delay');

    let nodeType = 'task';
    if (isGateway) nodeType = 'gateway';
    else if (isLoopTrigger) nodeType = 'loop-back';
    else if (isCancelPath) nodeType = 'cancel-path';
    else if (isTimer) nodeType = 'timer';

    nodeDefs.push({
      id: `Node_${index}`,
      name: line.replace(/^(cancel|reject|edit|fix|yes|no|wait|back)\s*[:\->\s]*/i, '').trim(),
      type: nodeType,
      originalText: line,
      index
    });
  });

  const elements: string[] = [];
  const flows: string[] = [];
  const diElements: string[] = [];
  const incomingFlows: Record<string, string[]> = {};
  const outgoingFlows: Record<string, string[]> = {};

  const registerFlow = (id: string, source: string, target: string, name: string = '') => {
    flows.push(`    <bpmn:sequenceFlow id="${id}" name="${escapeXml(name)}" sourceRef="${source}" targetRef="${target}" />`);
    if (!outgoingFlows[source]) outgoingFlows[source] = [];
    if (!incomingFlows[target]) incomingFlows[target] = [];
    outgoingFlows[source].push(id);
    incomingFlows[target].push(id);
    return id;
  };

  // Layout Constants
  const Y_MAIN = 250;
  const Y_REJECT = 450;
  const Y_LOOP_TOP = 100; // High clearance (Rule 3)
  const STEP_X = 220;
  const TASK_W = 120, TASK_H = 80;
  const GATEWAY_SIZE = 50;
  const EVENT_SIZE = 36;

  const positions: Record<string, { x: number, y: number, w: number, h: number }> = {
    "StartEvent": { x: 100, y: Y_MAIN, w: 36, h: 36 }
  };

  let lastNodeId = "StartEvent";
  let lastTaskId = "StartEvent"; 
  let currentGatewayId: string | null = null;
  let currentX = 250;

  nodeDefs.forEach((node) => {
    // RULE 1: No New Box for Edit
    // RULE 2: Create U-Turn Arrow
    // RULE 3: High Clearance Waypoints
    if (node.type === 'loop-back') {
      const sourceId = currentGatewayId || lastNodeId;
      const targetId = lastTaskId; 
      const flowId = `Flow_Loop_${node.id}`;
      
      // RULE 5: Explicit "No" label for loop
      const flowLabel = node.originalText.toLowerCase().includes('no') ? "No" : "Fix";
      
      registerFlow(flowId, sourceId, targetId, flowLabel);
      
      const sPos = positions[sourceId];
      const tPos = positions[targetId];

      if (sPos && tPos) {
        diElements.push(`
        <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
          <di:waypoint x="${sPos.x + (sPos.w / 2)}" y="${sPos.y - (sPos.h / 2)}" />
          <di:waypoint x="${sPos.x + (sPos.w / 2)}" y="${Y_LOOP_TOP}" />
          <di:waypoint x="${tPos.x + (tPos.w / 2)}" y="${Y_LOOP_TOP}" />
          <di:waypoint x="${tPos.x + (tPos.w / 2)}" y="${tPos.y - (tPos.h / 2)}" />
          <bpmndi:BPMNLabel>
            <dc:Bounds x="${(sPos.x + tPos.x) / 2 - 10}" y="${Y_LOOP_TOP - 20}" width="20" height="14" />
          </bpmndi:BPMNLabel>
        </bpmndi:BPMNEdge>`);
      }
      return; // Skip box creation
    }

    // RULE 4 & 5: Cancel Path (Leads to Rejected end event)
    if (node.type === 'cancel-path') {
      const sourceId = currentGatewayId || lastNodeId;
      const cancelEndId = `${node.id}_End`;
      const flowLabel = node.originalText.toLowerCase().includes('no') ? "No" : "Cancel";
      
      positions[cancelEndId] = { x: currentX, y: Y_REJECT, w: 36, h: 36 };
      const flowToCancel = registerFlow(`Flow_${sourceId}_to_Cancel`, sourceId, cancelEndId, flowLabel);
      const sPos = positions[sourceId];

      diElements.push(`
      <bpmndi:BPMNShape id="${cancelEndId}_di" bpmnElement="${cancelEndId}">
        <dc:Bounds x="${currentX}" y="${Y_REJECT - 18}" width="36" height="36" />
        <bpmndi:BPMNLabel><dc:Bounds x="${currentX - 5}" y="${Y_REJECT + 22}" width="46" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="${flowToCancel}_di" bpmnElement="${flowToCancel}">
        <di:waypoint x="${sPos.x + (sPos.w / 2)}" y="${sPos.y + (sPos.h / 2)}" />
        <di:waypoint x="${sPos.x + (sPos.w / 2)}" y="${Y_REJECT}" />
        <di:waypoint x="${currentX}" y="${Y_REJECT}" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${sPos.x + 10}" y="${Y_REJECT - 20}" width="20" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>`);

      elements.push(`    <bpmn:endEvent id="${cancelEndId}" name="Rejected">
      <bpmn:incoming>${flowToCancel}</bpmn:incoming>
    </bpmn:endEvent>`);
      
      return;
    }

    // Main Linear Path
    const width = (node.type === 'task' ? TASK_W : (node.type === 'gateway' ? GATEWAY_SIZE : EVENT_SIZE));
    const height = (node.type === 'task' ? TASK_H : (node.type === 'gateway' ? GATEWAY_SIZE : EVENT_SIZE));
    positions[node.id] = { x: currentX, y: Y_MAIN, w: width, h: height };

    const sourceId = lastNodeId;
    const isFromGateway = currentGatewayId === sourceId;
    const flowLabel = (isFromGateway || node.originalText.toLowerCase().includes('yes')) ? "Yes" : "";
    const flowId = `Flow_${sourceId}_to_${node.id}`;
    registerFlow(flowId, sourceId, node.id, flowLabel);

    const sPos = positions[sourceId];
    diElements.push(`
      <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
        <di:waypoint x="${sPos.x + sPos.w}" y="${sPos.y}" />
        <di:waypoint x="${currentX}" y="${Y_MAIN}" />
        ${flowLabel ? `<bpmndi:BPMNLabel><dc:Bounds x="${sPos.x + 60}" y="${Y_MAIN - 20}" width="20" height="14" /></bpmndi:BPMNLabel>` : ''}
      </bpmndi:BPMNEdge>`);

    if (node.type === 'task') {
      lastTaskId = node.id;
    }

    if (node.type === 'gateway') {
      currentGatewayId = node.id;
    } else {
      currentGatewayId = null;
    }

    lastNodeId = node.id;
    currentX += width + STEP_X;
  });

  // Final End Event
  const finalEndId = 'FinalEndEvent';
  const lastPos = positions[lastNodeId];
  if (lastPos && lastNodeId !== 'StartEvent') {
    const finalFlowId = 'Flow_Final_End';
    registerFlow(finalFlowId, lastNodeId, finalEndId);
    positions[finalEndId] = { x: lastPos.x + lastPos.w + 120, y: Y_MAIN, w: 36, h: 36 };

    diElements.push(`
      <bpmndi:BPMNShape id="${finalEndId}_di" bpmnElement="${finalEndId}">
        <dc:Bounds x="${positions[finalEndId].x}" y="${Y_MAIN - 18}" width="36" height="36" />
        <bpmndi:BPMNLabel><dc:Bounds x="${positions[finalEndId].x - 10}" y="${Y_MAIN + 22}" width="56" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="${finalFlowId}_di" bpmnElement="${finalFlowId}">
        <di:waypoint x="${lastPos.x + lastPos.w}" y="${lastPos.y}" />
        <di:waypoint x="${positions[finalEndId].x}" y="${Y_MAIN}" />
      </bpmndi:BPMNEdge>`);
  }

  // XML Assembly
  elements.push(`    <bpmn:startEvent id="StartEvent" name="Start">
      ${(outgoingFlows["StartEvent"] || []).map(f => `<bpmn:outgoing>${f}</bpmn:outgoing>`).join('\n      ')}
    </bpmn:startEvent>`);
  diElements.push(`
      <bpmndi:BPMNShape id="StartEvent_di" bpmnElement="StartEvent">
        <dc:Bounds x="100" y="${Y_MAIN - 18}" width="36" height="36" />
        <bpmndi:BPMNLabel><dc:Bounds x="105" y="${Y_MAIN + 22}" width="25" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>`);

  nodeDefs.forEach(node => {
    if (node.type === 'loop-back' || node.type === 'cancel-path') return;
    const pos = positions[node.id];
    const incoming = (incomingFlows[node.id] || []).map(f => `      <bpmn:incoming>${f}</bpmn:incoming>`).join('\n');
    const outgoing = (outgoingFlows[node.id] || []).map(f => `      <bpmn:outgoing>${f}</bpmn:outgoing>`).join('\n');

    if (node.type === 'gateway') {
      // RULE 4: XOR Marker Visible
      elements.push(`    <bpmn:exclusiveGateway id="${node.id}" name="${escapeXml(node.name)}" isMarkerVisible="true">\n${incoming}\n${outgoing}\n    </bpmn:exclusiveGateway>`);
      diElements.push(`
      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}" isMarkerVisible="true">
        <dc:Bounds x="${pos.x}" y="${pos.y - 25}" width="50" height="50" />
        <bpmndi:BPMNLabel><dc:Bounds x="${pos.x - 25}" y="${pos.y + 30}" width="100" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>`);
    } else if (node.type === 'timer') {
      elements.push(`    <bpmn:intermediateCatchEvent id="${node.id}" name="${escapeXml(node.name)}">\n${incoming}\n${outgoing}\n      <bpmn:timerEventDefinition id="TimerDef_${node.id}" />\n    </bpmn:intermediateCatchEvent>`);
      diElements.push(`
      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
        <dc:Bounds x="${pos.x}" y="${pos.y - 18}" width="36" height="36" />
        <bpmndi:BPMNLabel><dc:Bounds x="${pos.x - 32}" y="${pos.y + 22}" width="100" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>`);
    } else {
      elements.push(`    <bpmn:task id="${node.id}" name="${escapeXml(node.name)}">\n${incoming}\n${outgoing}\n    </bpmn:task>`);
      diElements.push(`
      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
        <dc:Bounds x="${pos.x}" y="${pos.y - 40}" width="${TASK_W}" height="${TASK_H}" />
      </bpmndi:BPMNShape>`);
    }
  });

  const fPos = positions[finalEndId];
  if (fPos) {
    const fIncoming = (incomingFlows[finalEndId] || []).map(f => `      <bpmn:incoming>${f}</bpmn:incoming>`).join('\n');
    elements.push(`    <bpmn:endEvent id="${finalEndId}" name="Completed">\n${fIncoming}\n    </bpmn:endEvent>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" name="${escapeXml(title)}" isExecutable="false">
${elements.join('\n')}
${flows.join('\n')}
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
${diElements.join('\n')}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}

function escapeXml(unsafe: string): string {
  if (!unsafe) return "";
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
