export function generateBPMN(input: string, title: string = "Process Diagram"): string {
  if (!input.trim()) return '';

  const rawLines = input.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  // Rule 5: Task classification keywords for User vs Service Tasks
  const userKeywords = ['approve', 'review', 'check', 'fill', 'input', 'verify', 'inspect', 'decide', 'manually', 'user', 'manager', 'client', 'customer', 'ውሳኔ', 'ከሆነ', 'መመደብ'];
  const serviceKeywords = ['send', 'notify', 'email', 'calculate', 'update', 'save', 'fetch', 'api', 'system', 'automatically', 'generate', 'process', 'trigger', 'compute'];

  // 1. Identify Node Types and Technical Elements
  const nodeDefs: any[] = [];
  rawLines.forEach((line, index) => {
    const lowerLine = line.toLowerCase();
    
    // Rule 1: Automated Sensing for XOR Gateways (Amharic & English)
    const amharicGateways = ['ውሳኔ', 'ከሆነ', 'መመደብ', '፧', '？'];
    const isGateway = line.includes('?') || amharicGateways.some(k => line.includes(k));
    
    // Rule 4: Parallel Processing Sensing
    const isParallel = lowerLine.includes('simultaneously') || lowerLine.includes('parallel') || lowerLine.includes('at the same time') || lowerLine.includes('tandem');
    
    // Rule 2: Edit/Back Logic detection
    const isLoopTrigger = lowerLine.includes('edit') || lowerLine.includes('fix') || lowerLine.includes('correct') || lowerLine.includes('back');
    const isCancelPath = lowerLine.includes('cancel') || lowerLine.includes('reject') || lowerLine.includes('fail');
    const isTimer = lowerLine.includes('wait') || lowerLine.includes('delay');

    let nodeType = 'task';
    let taskSubtype = 'task'; 

    if (isGateway) {
      nodeType = 'gateway';
    } else if (isParallel) {
      nodeType = 'parallel-gateway';
    } else if (isLoopTrigger) {
      nodeType = 'loop-back';
    } else if (isCancelPath) {
      nodeType = 'cancel-path';
    } else if (isTimer) {
      nodeType = 'timer';
    } else {
      // Rule 5: Strictly User Task or Service Task
      const isUser = userKeywords.some(k => lowerLine.includes(k));
      const isService = serviceKeywords.some(k => lowerLine.includes(k));
      if (isUser) taskSubtype = 'userTask';
      else if (isService) taskSubtype = 'serviceTask';
      else taskSubtype = 'userTask'; // Default to user task if ambiguous
    }

    nodeDefs.push({
      id: `Node_${index}`,
      name: line.replace(/^(cancel|reject|edit|fix|yes|no|wait|back|parallel|simultaneously)\s*[:\->\s]*/i, '').trim(),
      type: nodeType,
      taskSubtype,
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

  // Layout Constants (Zig-Zag / Snake pattern)
  const MAX_COLS = 5;
  const COL_SPACING = 250;
  const ROW_SPACING = 300; 
  const X_START = 200;
  const Y_START = 150;
  const TASK_W = 120, TASK_H = 80;
  const GATEWAY_SIZE = 50;
  const EVENT_SIZE = 36;

  const positions: Record<string, { x: number, y: number, w: number, h: number, row: number, col: number, direction: 'L-R' | 'R-L' }> = {
    "StartEvent": { x: 80, y: Y_START, w: 36, h: 36, row: 0, col: -1, direction: 'L-R' }
  };

  let lastNodeId = "StartEvent";
  let lastTaskId = "StartEvent"; 
  let currentGatewayId: string | null = null;
  let visualNodeCount = 0;

  nodeDefs.forEach((node) => {
    // Rule 2: Edit Logic - U-turn arrow back to previous task
    if (node.type === 'loop-back') {
      const sourceId = currentGatewayId || lastNodeId;
      const targetId = lastTaskId; 
      const flowId = `Flow_Loop_${node.id}`;
      const flowLabel = node.originalText.toLowerCase().includes('no') ? "No" : "Fix";
      
      registerFlow(flowId, sourceId, targetId, flowLabel);
      
      const sPos = positions[sourceId];
      const tPos = positions[targetId];

      if (sPos && tPos) {
        const loopY = Math.min(sPos.y, tPos.y) - 150;
        diElements.push(`
        <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
          <di:waypoint x="${sPos.x}" y="${sPos.y - (sPos.h / 2)}" />
          <di:waypoint x="${sPos.x}" y="${loopY}" />
          <di:waypoint x="${tPos.x}" y="${loopY}" />
          <di:waypoint x="${tPos.x}" y="${tPos.y - (tPos.h / 2)}" />
        </bpmndi:BPMNEdge>`);
      }
      return;
    }

    // Rule 3: Cancel Logic - Terminal branch
    if (node.type === 'cancel-path') {
      const sourceId = currentGatewayId || lastNodeId;
      const cancelEndId = `${node.id}_End`;
      const flowLabel = node.originalText.toLowerCase().includes('no') ? "No" : "Cancel";
      
      const sPos = positions[sourceId];
      const cancelX = sPos.x;
      const cancelY = sPos.y + 150; 
      
      positions[cancelEndId] = { x: cancelX, y: cancelY, w: 36, h: 36, row: sPos.row, col: sPos.col, direction: sPos.direction };
      const flowToCancel = registerFlow(`Flow_${sourceId}_to_Cancel`, sourceId, cancelEndId, flowLabel);

      diElements.push(`
      <bpmndi:BPMNShape id="${cancelEndId}_di" bpmnElement="${cancelEndId}">
        <dc:Bounds x="${cancelX - 18}" y="${cancelY - 18}" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="${flowToCancel}_di" bpmnElement="${flowToCancel}">
        <di:waypoint x="${sPos.x}" y="${sPos.y + (sPos.h / 2)}" />
        <di:waypoint x="${sPos.x}" y="${cancelY - 18}" />
      </bpmndi:BPMNEdge>`);

      elements.push(`    <bpmn:endEvent id="${cancelEndId}" name="Rejected">
      <bpmn:incoming>${flowToCancel}</bpmn:incoming>
    </bpmn:endEvent>`);
      return;
    }

    // Main Snake Path Logic
    const row = Math.floor(visualNodeCount / MAX_COLS);
    const col = visualNodeCount % MAX_COLS;
    const direction = (row % 2 === 0) ? 'L-R' : 'R-L';

    let nodeX;
    if (direction === 'L-R') {
      nodeX = X_START + col * COL_SPACING;
    } else {
      nodeX = X_START + (MAX_COLS - 1 - col) * COL_SPACING;
    }
    const nodeY = Y_START + row * ROW_SPACING;

    const width = (node.type.includes('task') ? TASK_W : (node.type.includes('gateway') ? GATEWAY_SIZE : (node.type === 'timer' ? 36 : EVENT_SIZE)));
    const height = (node.type.includes('task') ? TASK_H : (node.type.includes('gateway') ? GATEWAY_SIZE : (node.type === 'timer' ? 36 : EVENT_SIZE)));
    
    positions[node.id] = { x: nodeX, y: nodeY, w: width, h: height, row, col, direction };

    const sourceId = lastNodeId;
    const sPos = positions[sourceId];
    const isFromGateway = currentGatewayId === sourceId;
    const flowLabel = (isFromGateway || node.originalText.toLowerCase().includes('yes')) ? "Yes" : "";
    const flowId = `Flow_${sourceId}_to_${node.id}`;
    registerFlow(flowId, sourceId, node.id, flowLabel);

    if (sPos.row === row) {
      const exitX = sPos.direction === 'L-R' ? sPos.x + sPos.w / 2 : sPos.x - sPos.w / 2;
      const entryX = sPos.direction === 'L-R' ? nodeX - width / 2 : nodeX + width / 2;
      
      diElements.push(`
      <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
        <di:waypoint x="${exitX}" y="${sPos.y}" />
        <di:waypoint x="${entryX}" y="${nodeY}" />
      </bpmndi:BPMNEdge>`);
    } else {
      diElements.push(`
      <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
        <di:waypoint x="${sPos.x}" y="${sPos.y + sPos.h / 2}" />
        <di:waypoint x="${nodeX}" y="${nodeY - height / 2}" />
      </bpmndi:BPMNEdge>`);
    }

    if (node.type === 'task') lastTaskId = node.id;
    if (node.type.includes('gateway')) currentGatewayId = node.id; else currentGatewayId = null;

    lastNodeId = node.id;
    visualNodeCount++;
  });

  const finalEndId = 'FinalEndEvent';
  const lastPos = positions[lastNodeId];
  if (lastPos && lastNodeId !== 'StartEvent') {
    const finalFlowId = 'Flow_Final_End';
    registerFlow(finalFlowId, lastNodeId, finalEndId);
    
    const direction = lastPos.direction;
    const endX = direction === 'L-R' ? lastPos.x + 150 : lastPos.x - 150;
    
    positions[finalEndId] = { x: endX, y: lastPos.y, w: 36, h: 36, row: lastPos.row, col: lastPos.col + 1, direction };

    diElements.push(`
      <bpmndi:BPMNShape id="${finalEndId}_di" bpmnElement="${finalEndId}">
        <dc:Bounds x="${endX - 18}" y="${lastPos.y - 18}" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="${finalFlowId}_di" bpmnElement="${finalFlowId}">
        <di:waypoint x="${direction === 'L-R' ? lastPos.x + lastPos.w / 2 : lastPos.x - lastPos.w / 2}" y="${lastPos.y}" />
        <di:waypoint x="${endX - (direction === 'L-R' ? 18 : -18)}" y="${lastPos.y}" />
      </bpmndi:BPMNEdge>`);
  }

  elements.push(`    <bpmn:startEvent id="StartEvent" name="Start">
      ${(outgoingFlows["StartEvent"] || []).map(f => `<bpmn:outgoing>${f}</bpmn:outgoing>`).join('\n      ')}
    </bpmn:startEvent>`);
  diElements.push(`
      <bpmndi:BPMNShape id="StartEvent_di" bpmnElement="StartEvent">
        <dc:Bounds x="${positions["StartEvent"].x - 18}" y="${Y_START - 18}" width="36" height="36" />
      </bpmndi:BPMNShape>`);

  nodeDefs.forEach(node => {
    if (node.type === 'loop-back' || node.type === 'cancel-path') return;
    const pos = positions[node.id];
    const incoming = (incomingFlows[node.id] || []).map(f => `      <bpmn:incoming>${f}</bpmn:incoming>`).join('\n');
    const outgoing = (outgoingFlows[node.id] || []).map(f => `      <bpmn:outgoing>${f}</bpmn:outgoing>`).join('\n');

    if (node.type === 'gateway') {
      // Rule 1: Exclusive Gateway (XOR) with marker
      elements.push(`    <bpmn:exclusiveGateway id="${node.id}" name="${escapeXml(node.name)}" isMarkerVisible="true">\n${incoming}\n${outgoing}\n    </bpmn:exclusiveGateway>`);
      diElements.push(`
      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}" isMarkerVisible="true">
        <dc:Bounds x="${pos.x - 25}" y="${pos.y - 25}" width="50" height="50" />
      </bpmndi:BPMNShape>`);
    } else if (node.type === 'parallel-gateway') {
      // Rule 4: Parallel Gateway (AND)
      elements.push(`    <bpmn:parallelGateway id="${node.id}" name="${escapeXml(node.name)}">\n${incoming}\n${outgoing}\n    </bpmn:parallelGateway>`);
      diElements.push(`
      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
        <dc:Bounds x="${pos.x - 25}" y="${pos.y - 25}" width="50" height="50" />
      </bpmndi:BPMNShape>`);
    } else if (node.type === 'timer') {
      elements.push(`    <bpmn:intermediateCatchEvent id="${node.id}" name="${escapeXml(node.name)}">\n${incoming}\n${outgoing}\n      <bpmn:timerEventDefinition id="TimerDef_${node.id}" />\n    </bpmn:intermediateCatchEvent>`);
      diElements.push(`
      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
        <dc:Bounds x="${pos.x - 18}" y="${pos.y - 18}" width="36" height="36" />
      </bpmndi:BPMNShape>`);
    } else {
      // Rule 5: Task Subtypes (User/Service)
      const tagName = node.taskSubtype === 'userTask' ? 'userTask' : (node.taskSubtype === 'serviceTask' ? 'serviceTask' : 'userTask');
      elements.push(`    <bpmn:${tagName} id="${node.id}" name="${escapeXml(node.name)}">\n${incoming}\n${outgoing}\n    </bpmn:${tagName}>`);
      diElements.push(`
      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
        <dc:Bounds x="${pos.x - 60}" y="${pos.y - 40}" width="120" height="80" />
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
                  xmlns:camunda="http://camunda.org/schema/1.0/bpmn"
                  id="Definitions_1"
                  targetNamespace="http://bpmn.io/schema/bpmn"
                  exporter="Worku BPMN Core Engine" 
                  exporterVersion="3.0">
  <bpmn:process id="Process_Worku_Workflow" name="${escapeXml(title)}" isExecutable="true">
${elements.join('\n')}
${flows.join('\n')}
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_Worku_Workflow">
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