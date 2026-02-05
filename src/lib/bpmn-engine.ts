export function generateBPMN(input: string, title: string = "Process Diagram"): string {
  if (!input.trim()) return '';

  const rawLines = input.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  // 1. Identify Node Types and Roles
  const nodeDefs: any[] = [];
  rawLines.forEach((line, index) => {
    const lowerLine = line.toLowerCase();
    
    // XOR Gateway detection (Standard and Amharic)
    const isGateway = line.includes('?') || line.includes('፧') || line.includes('？');
    
    // Loop-Back detection (Edit/Fix) - Must not create a box
    const isLoopTrigger = lowerLine.includes('edit') || lowerLine.includes('fix') || lowerLine.includes('re-verify');
    
    // Cancel Path detection
    const isCancelPath = lowerLine.startsWith('cancel') || lowerLine.includes('reject');

    // Timer detection
    const isTimer = lowerLine.includes('wait');

    let nodeType = 'task';
    if (isGateway) nodeType = 'gateway';
    else if (isLoopTrigger) nodeType = 'loop-back';
    else if (isCancelPath) nodeType = 'cancel-path';
    else if (isTimer) nodeType = 'timer';

    const node = {
      id: `Node_${index}`,
      name: line.replace(/^(cancel|reject|edit|fix)\s*:?\s*/i, '').trim(),
      type: nodeType,
      originalText: line,
      index
    };

    nodeDefs.push(node);
  });

  // Data structures for XML generation
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
    // RULE: Loop-Back Logic (Non-Box, High-Clearance)
    if (node.type === 'loop-back') {
      const sourceId = currentGatewayId || lastNodeId;
      const targetId = lastTaskId; // Points back to the previous actual task box
      const flowId = `Flow_Loop_${node.id}`;
      registerFlow(flowId, sourceId, targetId, "Edit/Fix");
      
      const sPos = positions[sourceId];
      const tPos = positions[targetId];

      if (sPos && tPos) {
        // Draw U-shaped arrow ABOVE tasks for clarity
        diElements.push(`
        <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
          <di:waypoint x="${sPos.x + (sPos.w / 2)}" y="${sPos.y - (sPos.h / 2)}" />
          <di:waypoint x="${sPos.x + (sPos.w / 2)}" y="100" />
          <di:waypoint x="${tPos.x + (tPos.w / 2)}" y="100" />
          <di:waypoint x="${tPos.x + (tPos.w / 2)}" y="${tPos.y - (tPos.h / 2)}" />
          <bpmndi:BPMNLabel>
            <dc:Bounds x="${(sPos.x + tPos.x) / 2 - 20}" y="80" width="40" height="14" />
          </bpmndi:BPMNLabel>
        </bpmndi:BPMNEdge>`);
      }
      return;
    }

    // RULE: Cancel/Reject Path (Task + End Event)
    if (node.type === 'cancel-path') {
      const sourceId = currentGatewayId || lastNodeId;
      const cancelTaskId = `${node.id}_CancelTask`;
      const cancelEndId = `${node.id}_CancelEnd`;
      
      positions[cancelTaskId] = { x: currentX, y: 450, w: TASK_W, h: TASK_H };
      positions[cancelEndId] = { x: currentX + 180, y: 450, w: 36, h: 36 };

      // Flow from Gateway/Node to Cancel Task
      const flowToTask = registerFlow(`Flow_${sourceId}_to_Cancel`, sourceId, cancelTaskId, "No");
      const sPos = positions[sourceId];
      diElements.push(`
      <bpmndi:BPMNEdge id="${flowToTask}_di" bpmnElement="${flowToTask}">
        <di:waypoint x="${sPos.x + (sPos.w / 2)}" y="${sPos.y + (sPos.h / 2)}" />
        <di:waypoint x="${sPos.x + (sPos.w / 2)}" y="450" />
        <di:waypoint x="${currentX}" y="450" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${sPos.x + 10}" y="410" width="40" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>`);

      // Flow from Cancel Task to End
      const flowToEnd = registerFlow(`Flow_Cancel_to_End_${node.id}`, cancelTaskId, cancelEndId);
      diElements.push(`
      <bpmndi:BPMNEdge id="${flowToEnd}_di" bpmnElement="${flowToEnd}">
        <di:waypoint x="${currentX + TASK_W}" y="450" />
        <di:waypoint x="${currentX + 180}" y="450" />
      </bpmndi:BPMNEdge>`);

      elements.push(`    <bpmn:task id="${cancelTaskId}" name="${escapeXml(node.name)}" />`);
      elements.push(`    <bpmn:endEvent id="${cancelEndId}" name="Rejected">
      <bpmn:incoming>${flowToEnd}</bpmn:incoming>
      <bpmn:terminateEventDefinition id="Terminate_${node.id}" />
    </bpmn:endEvent>`);

      diElements.push(`
      <bpmndi:BPMNShape id="${cancelTaskId}_di" bpmnElement="${cancelTaskId}">
        <dc:Bounds x="${currentX}" y="410" width="${TASK_W}" height="${TASK_H}" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="${cancelEndId}_di" bpmnElement="${cancelEndId}">
        <dc:Bounds x="${currentX + 180}" y="432" width="36" height="36" />
        <bpmndi:BPMNLabel><dc:Bounds x="${currentX + 175}" y="475" width="46" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>`);
      
      return;
    }

    // Standard node positioning (Task, Gateway, Timer)
    const width = (node.type === 'task' ? TASK_W : (node.type === 'gateway' ? GATEWAY_SIZE : EVENT_SIZE));
    const height = (node.type === 'task' ? TASK_H : (node.type === 'gateway' ? GATEWAY_SIZE : EVENT_SIZE));
    positions[node.id] = { x: currentX, y: Y_MAIN, w: width, h: height };

    if (node.type === 'task') {
      lastTaskId = node.id;
    }

    const sourceId = lastNodeId;
    const flowLabel = (currentGatewayId === sourceId) ? "Yes" : "";
    const flowId = `Flow_${sourceId}_to_${node.id}`;
    registerFlow(flowId, sourceId, node.id, flowLabel);

    const sPos = positions[sourceId];
    diElements.push(`
      <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
        <di:waypoint x="${sPos.x + sPos.w}" y="${sPos.y}" />
        <di:waypoint x="${currentX}" y="${Y_MAIN}" />
        ${flowLabel ? `<bpmndi:BPMNLabel><dc:Bounds x="${sPos.x + 60}" y="${sPos.y - 20}" width="40" height="14" /></bpmndi:BPMNLabel>` : ''}
      </bpmndi:BPMNEdge>`);

    if (node.type === 'gateway') {
      currentGatewayId = node.id;
    } else {
      currentGatewayId = null;
    }

    lastNodeId = node.id;
    currentX += width + STEP_X;
  });

  // Final Terminal Node (Completed)
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

  // XML Construction
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
      // RULE: Exclusive Gateway with 'X' marker
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