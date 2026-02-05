export function generateBPMN(input: string, title: string = "Process Diagram"): string {
  if (!input.trim()) return '';

  const rawLines = input.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  // 1. Identify Node Types (Strictly preserve parsing logic)
  const nodeDefs: any[] = [];
  rawLines.forEach((line, index) => {
    const lowerLine = line.toLowerCase();
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

  // Layout Constants (Optimized for Z-Pattern / Snake Flow)
  const MAX_COLS = 5;
  const COL_SPACING = 250;
  const ROW_SPACING = 250; 
  const X_START = 250;
  const Y_START = 200;
  const START_EVENT_X = 80;
  const TASK_W = 120, TASK_H = 80;
  const GATEWAY_SIZE = 50;
  const EVENT_SIZE = 36;

  const positions: Record<string, { x: number, y: number, w: number, h: number, row: number, col: number }> = {
    "StartEvent": { x: START_EVENT_X, y: Y_START, w: 36, h: 36, row: 0, col: -1 }
  };

  let lastNodeId = "StartEvent";
  let lastTaskId = "StartEvent"; 
  let currentGatewayId: string | null = null;
  let visualNodeCount = 0;

  nodeDefs.forEach((node) => {
    // Loop back logic (Strictly preserve high-clearance arrows)
    if (node.type === 'loop-back') {
      const sourceId = currentGatewayId || lastNodeId;
      const targetId = lastTaskId; 
      const flowId = `Flow_Loop_${node.id}`;
      const flowLabel = node.originalText.toLowerCase().includes('no') ? "No" : "Fix";
      
      registerFlow(flowId, sourceId, targetId, flowLabel);
      
      const sPos = positions[sourceId];
      const tPos = positions[targetId];

      if (sPos && tPos) {
        // Higher clearance loop back above all rows
        const loopY = Math.min(sPos.y, tPos.y) - 120;
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

    // Cancel Path logic (Strictly preserve rejected track)
    if (node.type === 'cancel-path') {
      const sourceId = currentGatewayId || lastNodeId;
      const cancelEndId = `${node.id}_End`;
      const flowLabel = node.originalText.toLowerCase().includes('no') ? "No" : "Cancel";
      
      const sPos = positions[sourceId];
      const cancelX = sPos.x;
      const cancelY = sPos.y + 120;
      
      positions[cancelEndId] = { x: cancelX, y: cancelY, w: 36, h: 36, row: sPos.row, col: sPos.col };
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

    // Main Path: Orthogonal Snake Pattern (Row calculation)
    const col = visualNodeCount % MAX_COLS;
    const row = Math.floor(visualNodeCount / MAX_COLS);
    const nodeX = X_START + col * COL_SPACING;
    const nodeY = Y_START + row * ROW_SPACING;

    const width = (node.type === 'task' ? TASK_W : (node.type === 'gateway' ? GATEWAY_SIZE : (node.type === 'timer' ? 36 : EVENT_SIZE)));
    const height = (node.type === 'task' ? TASK_H : (node.type === 'gateway' ? GATEWAY_SIZE : (node.type === 'timer' ? 36 : EVENT_SIZE)));
    positions[node.id] = { x: nodeX, y: nodeY, w: width, h: height, row, col };

    const sourceId = lastNodeId;
    const sPos = positions[sourceId];
    const isFromGateway = currentGatewayId === sourceId;
    const flowLabel = (isFromGateway || node.originalText.toLowerCase().includes('yes')) ? "Yes" : "";
    const flowId = `Flow_${sourceId}_to_${node.id}`;
    registerFlow(flowId, sourceId, node.id, flowLabel);

    // Orthogonal Connectors (90-degree)
    const rightExitX = sPos.x + sPos.w / 2;
    const leftEntryX = nodeX - width / 2;

    if (sPos.row === row) {
      // Same Row (Straight Horizontal)
      diElements.push(`
      <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
        <di:waypoint x="${rightExitX}" y="${sPos.y}" />
        <di:waypoint x="${leftEntryX}" y="${nodeY}" />
      </bpmndi:BPMNEdge>`);
    } else {
      // Row Wrap: Drop down and go to far left of next row (Z-pattern)
      const margin = 50; // Clearance for orthogonal turns
      const bendX = rightExitX + margin;
      const entryBendX = leftEntryX - margin;
      const midY = sPos.y + (nodeY - sPos.y) / 2;
      
      diElements.push(`
      <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
        <di:waypoint x="${rightExitX}" y="${sPos.y}" />
        <di:waypoint x="${bendX}" y="${sPos.y}" />
        <di:waypoint x="${bendX}" y="${midY}" />
        <di:waypoint x="${entryBendX}" y="${midY}" />
        <di:waypoint x="${entryBendX}" y="${nodeY}" />
        <di:waypoint x="${leftEntryX}" y="${nodeY}" />
      </bpmndi:BPMNEdge>`);
    }

    if (node.type === 'task') lastTaskId = node.id;
    if (node.type === 'gateway') currentGatewayId = node.id; else currentGatewayId = null;

    lastNodeId = node.id;
    visualNodeCount++;
  });

  // Final Completion Node
  const finalEndId = 'FinalEndEvent';
  const lastPos = positions[lastNodeId];
  if (lastPos && lastNodeId !== 'StartEvent') {
    const finalFlowId = 'Flow_Final_End';
    registerFlow(finalFlowId, lastNodeId, finalEndId);
    const endX = lastPos.x + 150;
    positions[finalEndId] = { x: endX, y: lastPos.y, w: 36, h: 36, row: lastPos.row, col: lastPos.col + 1 };

    diElements.push(`
      <bpmndi:BPMNShape id="${finalEndId}_di" bpmnElement="${finalEndId}">
        <dc:Bounds x="${endX - 18}" y="${lastPos.y - 18}" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="${finalFlowId}_di" bpmnElement="${finalFlowId}">
        <di:waypoint x="${lastPos.x + lastPos.w / 2}" y="${lastPos.y}" />
        <di:waypoint x="${endX - 18}" y="${lastPos.y}" />
      </bpmndi:BPMNEdge>`);
  }

  // Start Event Generation
  elements.push(`    <bpmn:startEvent id="StartEvent" name="Start">
      ${(outgoingFlows["StartEvent"] || []).map(f => `<bpmn:outgoing>${f}</bpmn:outgoing>`).join('\n      ')}
    </bpmn:startEvent>`);
  diElements.push(`
      <bpmndi:BPMNShape id="StartEvent_di" bpmnElement="StartEvent">
        <dc:Bounds x="${START_EVENT_X - 18}" y="${Y_START - 18}" width="36" height="36" />
      </bpmndi:BPMNShape>`);

  // Node Element Generation (Strictly preserve XOR diamonds with X markers)
  nodeDefs.forEach(node => {
    if (node.type === 'loop-back' || node.type === 'cancel-path') return;
    const pos = positions[node.id];
    const incoming = (incomingFlows[node.id] || []).map(f => `      <bpmn:incoming>${f}</bpmn:incoming>`).join('\n');
    const outgoing = (outgoingFlows[node.id] || []).map(f => `      <bpmn:outgoing>${f}</bpmn:outgoing>`).join('\n');

    if (node.type === 'gateway') {
      elements.push(`    <bpmn:exclusiveGateway id="${node.id}" name="${escapeXml(node.name)}" isMarkerVisible="true">\n${incoming}\n${outgoing}\n    </bpmn:exclusiveGateway>`);
      diElements.push(`
      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}" isMarkerVisible="true">
        <dc:Bounds x="${pos.x - 25}" y="${pos.y - 25}" width="50" height="50" />
      </bpmndi:BPMNShape>`);
    } else if (node.type === 'timer') {
      elements.push(`    <bpmn:intermediateCatchEvent id="${node.id}" name="${escapeXml(node.name)}">\n${incoming}\n${outgoing}\n      <bpmn:timerEventDefinition id="TimerDef_${node.id}" />\n    </bpmn:intermediateCatchEvent>`);
      diElements.push(`
      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
        <dc:Bounds x="${pos.x - 18}" y="${pos.y - 18}" width="36" height="36" />
      </bpmndi:BPMNShape>`);
    } else {
      elements.push(`    <bpmn:task id="${node.id}" name="${escapeXml(node.name)}">\n${incoming}\n${outgoing}\n    </bpmn:task>`);
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
                  id="Definitions_1"
                  targetNamespace="http://bpmn.io/schema/bpmn"
                  exporter="Worku BPMN" 
                  exporterVersion="1.3">
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
