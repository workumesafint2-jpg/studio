export function generateBPMN(input: string, title: string = "Process Diagram"): string {
  if (!input.trim()) return '';

  const rawLines = input.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  const userKeywords = ['approve', 'review', 'check', 'fill', 'input', 'verify', 'inspect', 'decide', 'manually', 'user', 'manager', 'client', 'customer', 'ውሳኔ', 'ከሆነ', 'መመደብ'];
  const serviceKeywords = ['send', 'notify', 'email', 'calculate', 'update', 'save', 'fetch', 'api', 'system', 'automatically', 'generate', 'process', 'trigger', 'compute', 'digitalize', 'integrate'];

  const nodeDefs: any[] = [];
  rawLines.forEach((line, index) => {
    const lowerLine = line.toLowerCase();
    const isTimer = lowerLine.startsWith('timer:');
    const isGateway = line.includes('?') || ['ውሳኔ', 'ከሆነ', 'መመደብ', '፧', '？'].some(k => line.includes(k));
    const isParallel = lowerLine.includes('simultaneously') || lowerLine.includes('parallel') || lowerLine.includes('tandem');
    const isLoopTrigger = lowerLine.includes('edit') || lowerLine.includes('fix') || lowerLine.includes('correct') || lowerLine.includes('back') || lowerLine.includes('incomplete') || lowerLine.includes('no');
    const isCancelPath = lowerLine.includes('cancel') || lowerLine.includes('reject') || lowerLine.includes('fail');

    let nodeType = 'task';
    let taskSubtype = 'userTask'; 

    if (isTimer) {
      nodeType = 'timer-event';
    } else if (isParallel) {
      nodeType = 'parallel-gateway';
    } else if (isGateway) {
      nodeType = 'gateway';
    } else if (isLoopTrigger) {
      nodeType = 'loop-back';
    } else if (isCancelPath) {
      nodeType = 'cancel-path';
    } else {
      const isService = serviceKeywords.some(k => lowerLine.includes(k));
      taskSubtype = isService ? 'serviceTask' : 'userTask';
    }

    let pureName = line
      .replace(/^(timer|cancel|reject|edit|fix|yes|no|wait|back|go back to|return to|parallel|simultaneously|if|when|then|ወደ|እንደገና|አይ|አዎ|ከሆነ)\s*[:\->\s]*/i, '')
      .replace(/\?$/, '')
      .replace(/[፧？]$/, '')
      .trim();

    nodeDefs.push({
      id: `Node_${index}`,
      name: pureName,
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

  const MAX_COLS = 5;
  const COL_SPACING = 250;
  const ROW_SPACING = 250; 
  const X_START = 200;
  const Y_START = 250;
  const TASK_W = 120, TASK_H = 80;
  const GATEWAY_SIZE = 50;

  const positions: Record<string, { x: number, y: number, w: number, h: number, row: number, col: number }> = {
    "StartEvent": { x: 80, y: Y_START, w: 36, h: 36, row: 0, col: -1 }
  };

  let lastNodeId = "StartEvent";
  let lastTaskId = "StartEvent"; 
  let currentGatewayId: string | null = null;
  let visualNodeCount = 0;

  for (let i = 0; i < nodeDefs.length; i++) {
    const node = nodeDefs[i];

    if (node.type === 'loop-back') {
      const sourceId = currentGatewayId || lastNodeId;
      const targetId = lastTaskId; 
      const flowId = `Flow_Loop_${node.id}`;
      registerFlow(flowId, sourceId, targetId, "Fix/Edit");
      
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
          <bpmndi:BPMNLabel>
            <dc:Bounds x="${(sPos.x + tPos.x) / 2 - 40}" y="${loopY - 20}" width="80" height="14" />
          </bpmndi:BPMNLabel>
        </bpmndi:BPMNEdge>`);
      }
      continue;
    }

    if (node.type === 'cancel-path') {
      const sourceId = currentGatewayId || lastNodeId;
      const cancelEndId = `${node.id}_Terminate`;
      const sPos = positions[sourceId];
      const cancelY = sPos.y + 180; 
      
      positions[cancelEndId] = { x: sPos.x, y: cancelY, w: 36, h: 36, row: sPos.row, col: sPos.col };
      const flowToCancel = registerFlow(`Flow_Cancel_${node.id}`, sourceId, cancelEndId, "Reject");

      diElements.push(`
      <bpmndi:BPMNShape id="${cancelEndId}_di" bpmnElement="${cancelEndId}">
        <dc:Bounds x="${sPos.x - 18}" y="${cancelY - 18}" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="${flowToCancel}_di" bpmnElement="${flowToCancel}">
        <di:waypoint x="${sPos.x}" y="${sPos.y + (sPos.h / 2)}" />
        <di:waypoint x="${sPos.x}" y="${cancelY - 18}" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${sPos.x + 10}" y="${sPos.y + 60}" width="60" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>`);

      elements.push(`    <bpmn:endEvent id="${cancelEndId}" name="Rejected">
      <bpmn:incoming>${flowToCancel}</bpmn:incoming>
      <bpmn:terminateEventDefinition id="TerminateEventDefinition_${node.id}" />
    </bpmn:endEvent>`);
      continue;
    }

    if (node.type === 'parallel-gateway' && i + 2 < nodeDefs.length) {
      const splitId = node.id;
      const taskA = nodeDefs[++i];
      const taskB = nodeDefs[++i];
      const joinId = `${splitId}_Join`;

      const row = Math.floor(visualNodeCount / MAX_COLS);
      const col = visualNodeCount % MAX_COLS;
      const baseX = X_START + col * COL_SPACING;
      const baseY = Y_START + row * ROW_SPACING;

      positions[splitId] = { x: baseX, y: baseY, w: 50, h: 50, row, col };
      positions[taskA.id] = { x: baseX + 180, y: baseY - 120, w: 120, h: 80, row, col };
      positions[taskB.id] = { x: baseX + 180, y: baseY + 120, w: 120, h: 80, row, col };
      positions[joinId] = { x: baseX + 360, y: baseY, w: 50, h: 50, row, col };

      const f_to_split = registerFlow(`F_${lastNodeId}_S`, lastNodeId, splitId);
      const f_s_a = registerFlow(`F_S_A_${taskA.id}`, splitId, taskA.id);
      const f_s_b = registerFlow(`F_S_B_${taskB.id}`, splitId, taskB.id);
      const f_a_j = registerFlow(`F_A_J_${taskA.id}`, taskA.id, joinId);
      const f_b_j = registerFlow(`F_B_J_${taskB.id}`, taskB.id, joinId);

      const sP = positions[lastNodeId];
      diElements.push(`
      <bpmndi:BPMNShape id="${splitId}_di" bpmnElement="${splitId}">
        <dc:Bounds x="${baseX - 25}" y="${baseY - 25}" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="${taskA.id}_di" bpmnElement="${taskA.id}">
        <dc:Bounds x="${baseX + 180 - 60}" y="${baseY - 120 - 40}" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="${taskB.id}_di" bpmnElement="${taskB.id}">
        <dc:Bounds x="${baseX + 180 - 60}" y="${baseY + 120 - 40}" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="${joinId}_di" bpmnElement="${joinId}">
        <dc:Bounds x="${baseX + 360 - 25}" y="${baseY - 25}" width="50" height="50" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNEdge id="${f_to_split}_di" bpmnElement="${f_to_split}">
        <di:waypoint x="${sP.x + sP.w / 2}" y="${sP.y}" />
        <di:waypoint x="${baseX - 25}" y="${baseY}" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="${f_s_a}_di" bpmnElement="${f_s_a}">
        <di:waypoint x="${baseX}" y="${baseY - 25}" />
        <di:waypoint x="${baseX}" y="${baseY - 120}" />
        <di:waypoint x="${baseX + 180 - 60}" y="${baseY - 120}" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="${f_s_b}_di" bpmnElement="${f_s_b}">
        <di:waypoint x="${baseX}" y="${baseY + 25}" />
        <di:waypoint x="${baseX}" y="${baseY + 120}" />
        <di:waypoint x="${baseX + 180 - 60}" y="${baseY + 120}" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="${f_a_j}_di" bpmnElement="${f_a_j}">
        <di:waypoint x="${baseX + 180 + 60}" y="${baseY - 120}" />
        <di:waypoint x="${baseX + 360}" y="${baseY - 120}" />
        <di:waypoint x="${baseX + 360}" y="${baseY - 25}" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="${f_b_j}_di" bpmnElement="${f_b_j}">
        <di:waypoint x="${baseX + 180 + 60}" y="${baseY + 120}" />
        <di:waypoint x="${baseX + 360}" y="${baseY + 120}" />
        <di:waypoint x="${baseX + 360}" y="${baseY + 25}" />
      </bpmndi:BPMNEdge>`);

      elements.push(`    <bpmn:parallelGateway id="${splitId}" name="Split" />`);
      elements.push(`    <bpmn:${taskA.taskSubtype} id="${taskA.id}" name="${escapeXml(taskA.name)}" />`);
      elements.push(`    <bpmn:${taskB.taskSubtype} id="${taskB.id}" name="${escapeXml(taskB.name)}" />`);
      elements.push(`    <bpmn:parallelGateway id="${joinId}" name="Join" />`);

      lastNodeId = joinId;
      lastTaskId = taskB.id;
      visualNodeCount += 2;
      continue;
    }

    const row = Math.floor(visualNodeCount / MAX_COLS);
    const col = visualNodeCount % MAX_COLS;
    const nodeX = X_START + col * COL_SPACING;
    const nodeY = Y_START + row * ROW_SPACING;

    const width = node.type.includes('task') ? TASK_W : (node.type.includes('gateway') ? GATEWAY_SIZE : 36);
    const height = node.type.includes('task') ? TASK_H : (node.type.includes('gateway') ? GATEWAY_SIZE : 36);
    
    positions[node.id] = { x: nodeX, y: nodeY, w: width, h: height, row, col };

    const flowId = `Flow_${lastNodeId}_to_${node.id}`;
    const flowLabel = (currentGatewayId === lastNodeId) ? "Yes" : "";
    registerFlow(flowId, lastNodeId, node.id, flowLabel);

    const sPos = positions[lastNodeId];
    if (sPos.row === row) {
      const exitX = sPos.x + sPos.w / 2;
      const entryX = nodeX - width / 2;
      diElements.push(`
      <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
        <di:waypoint x="${exitX}" y="${sPos.y}" />
        <di:waypoint x="${entryX}" y="${nodeY}" />
        ${flowLabel ? `
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${(exitX + entryX) / 2 - 10}" y="${sPos.y - 20}" width="20" height="14" />
        </bpmndi:BPMNLabel>` : ''}
      </bpmndi:BPMNEdge>`);
    } else {
      diElements.push(`
      <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
        <di:waypoint x="${sPos.x}" y="${sPos.y + sPos.h / 2}" />
        <di:waypoint x="${nodeX}" y="${nodeY - height / 2}" />
      </bpmndi:BPMNEdge>`);
    }

    if (node.type === 'task') lastTaskId = node.id;
    currentGatewayId = node.type.includes('gateway') ? node.id : null;
    lastNodeId = node.id;
    visualNodeCount++;
  }

  const finalEndId = 'FinalEndEvent';
  const lastPos = positions[lastNodeId];
  if (lastPos && lastNodeId !== 'StartEvent') {
    const finalFlowId = 'Flow_Final_Complete';
    registerFlow(finalFlowId, lastNodeId, finalEndId, "Success");
    const endX = lastPos.x + 150;
    positions[finalEndId] = { x: endX, y: lastPos.y, w: 36, h: 36, row: lastPos.row, col: lastPos.col + 1 };

    diElements.push(`
      <bpmndi:BPMNShape id="${finalEndId}_di" bpmnElement="${finalEndId}">
        <dc:Bounds x="${endX - 18}" y="${lastPos.y - 18}" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="${finalFlowId}_di" bpmnElement="${finalFlowId}">
        <di:waypoint x="${lastPos.x + lastPos.w / 2}" y="${lastPos.y}" />
        <di:waypoint x="${endX - 18}" y="${lastPos.y}" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${(lastPos.x + endX) / 2 - 20}" y="${lastPos.y - 20}" width="40" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>`);
  }

  elements.push(`    <bpmn:startEvent id="StartEvent" name="Start" />`);
  diElements.push(`
      <bpmndi:BPMNShape id="StartEvent_di" bpmnElement="StartEvent">
        <dc:Bounds x="${positions["StartEvent"].x - 18}" y="${Y_START - 18}" width="36" height="36" />
      </bpmndi:BPMNShape>`);

  nodeDefs.forEach(node => {
    if (['loop-back', 'cancel-path', 'parallel-gateway'].includes(node.type)) return;
    const pos = positions[node.id];
    if (!pos) return;

    if (node.type === 'gateway') {
      elements.push(`    <bpmn:exclusiveGateway id="${node.id}" name="Decision" isMarkerVisible="true" />`);
      diElements.push(`
      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}" isMarkerVisible="true">
        <dc:Bounds x="${pos.x - 25}" y="${pos.y - 25}" width="50" height="50" />
      </bpmndi:BPMNShape>`);
    } else if (node.type === 'timer-event') {
      elements.push(`    <bpmn:intermediateCatchEvent id="${node.id}" name="${escapeXml(node.name)}">
      <bpmn:timerEventDefinition id="TimerEventDefinition_${node.id}" />
    </bpmn:intermediateCatchEvent>`);
      diElements.push(`
      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
        <dc:Bounds x="${pos.x - 18}" y="${pos.y - 18}" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${pos.x - 40}" y="${pos.y + 22}" width="80" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>`);
    } else {
      elements.push(`    <bpmn:${node.taskSubtype} id="${node.id}" name="${escapeXml(node.name)}" />`);
      diElements.push(`
      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
        <dc:Bounds x="${pos.x - 60}" y="${pos.y - 40}" width="120" height="80" />
      </bpmndi:BPMNShape>`);
    }
  });

  if (positions[finalEndId]) {
    elements.push(`    <bpmn:endEvent id="${finalEndId}" name="Success" />`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                  xmlns:camunda="http://camunda.org/schema/1.0/bpmn"
                  id="Definitions_Worku"
                  targetNamespace="http://bpmn.io/schema/bpmn"
                  exporter="Worku (ወርቁ) Pro Architect" 
                  exporterVersion="8.0">
  <bpmn:process id="Process_Worku_Auto" name="${escapeXml(title)}" isExecutable="true">
${elements.join('\n')}
${flows.join('\n')}
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_Worku_Auto">
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
