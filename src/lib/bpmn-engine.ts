
export function generateBPMN(input: string, title: string = "Process Diagram"): string {
  if (!input.trim()) return '';

  const rawLines = input.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  // 1. Identify Node Types and Roles
  const nodeDefs: any[] = [];
  rawLines.forEach((line, index) => {
    const lowerLine = line.toLowerCase();
    const isGateway = line.includes('?');
    const isYes = lowerLine.startsWith('yes ->');
    const isNo = lowerLine.startsWith('no ->');
    
    let text = line;
    let flowLabel = '';
    
    if (isYes) {
      flowLabel = 'Yes';
      text = line.replace(/yes ->/i, '').trim();
    } else if (isNo) {
      flowLabel = 'No';
      text = line.replace(/no ->/i, '').trim();
    }

    const lowerText = text.toLowerCase();
    
    // Detect keywords
    const isLoop = lowerText.includes('fix') || lowerText.includes('edit');
    const isParallelSplit = lowerLine.startsWith('parallel:');
    const isJoin = lowerText === 'join';
    const isTimer = lowerText.includes('wait');
    const isCancel = lowerText.includes('cancel') || lowerText.includes('reject') || lowerText.includes('stop') || lowerText.includes('terminate');

    nodeDefs.push({
      id: `Node_${index}`,
      originalText: line,
      name: text.replace(/^parallel:/i, '').trim() || (isParallelSplit ? "Split" : text),
      type: isParallelSplit ? 'parallel-split' : 
            isJoin ? 'parallel-join' : 
            isGateway ? 'gateway' : 
            isTimer ? 'timer' : 
            isCancel ? 'cancel-end' :
            isLoop ? 'loop-back' : 'task',
      flowLabel,
      index
    });
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
  };

  // Layout Constants
  const Y_MAIN = 250;
  const Y_TOP = 120;
  const Y_BOTTOM = 380;
  const Y_NEG = 500;
  const STEP_X = 220;
  
  const TASK_W = 100, TASK_H = 80;
  const GATEWAY_SIZE = 50;
  const EVENT_SIZE = 36;

  const positions: Record<string, { x: number, y: number, w: number, h: number }> = {
    "StartEvent": { x: 100, y: Y_MAIN, w: 36, h: 36 }
  };

  let lastNodeId = "StartEvent";
  let currentX = 250;
  let activeParallelSplitId: string | null = null;
  let parallelBranches: string[] = [];

  nodeDefs.forEach((node) => {
    // RULE: Loop Back (Edit/Fix) - Don't create a box, just draw arrow back
    if (node.type === 'loop-back') {
      // Find the task before the current question gateway
      const history = nodeDefs.slice(0, node.index).reverse();
      const targetNode = history.find(n => n.type === 'task' || n.type === 'gateway');
      const targetId = targetNode ? targetNode.id : 'StartEvent';
      
      const flowId = `Flow_Loop_${node.id}`;
      registerFlow(flowId, lastNodeId, targetId, node.flowLabel || node.name);
      
      const sPos = positions[lastNodeId];
      const tPos = positions[targetId];

      diElements.push(`
      <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
        <di:waypoint x="${sPos.x + (sPos.w / 2)}" y="${sPos.y - (sPos.h / 2)}" />
        <di:waypoint x="${sPos.x + (sPos.w / 2)}" y="${Y_TOP - 80}" />
        <di:waypoint x="${tPos.x + (tPos.w / 2)}" y="${Y_TOP - 80}" />
        <di:waypoint x="${tPos.x + (tPos.w / 2)}" y="${tPos.y - (tPos.h / 2)}" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${(sPos.x + tPos.x) / 2}" y="${Y_TOP - 100}" width="60" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>`);
      return;
    }

    // Determine Y position
    let nodeY = Y_MAIN;
    if (activeParallelSplitId) {
      nodeY = parallelBranches.length % 2 === 0 ? Y_TOP : Y_BOTTOM;
    }

    // Node Rendering Logic
    if (node.type === 'cancel-end') {
      const endId = `End_${node.id}`;
      positions[endId] = { x: currentX, y: Y_NEG, w: EVENT_SIZE, h: EVENT_SIZE };
      const flowId = `Flow_Cancel_${node.id}`;
      registerFlow(flowId, lastNodeId, endId, node.flowLabel || 'No');
      
      diElements.push(`
      <bpmndi:BPMNShape id="${endId}_di" bpmnElement="${endId}">
        <dc:Bounds x="${currentX}" y="${Y_NEG - 18}" width="${EVENT_SIZE}" height="${EVENT_SIZE}" />
      </bpmndi:BPMNShape>`);
      
      const sPos = positions[lastNodeId];
      diElements.push(`
      <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
        <di:waypoint x="${sPos.x + (sPos.w / 2)}" y="${sPos.y + (sPos.h / 2)}" />
        <di:waypoint x="${sPos.x + (sPos.w / 2)}" y="${Y_NEG}" />
        <di:waypoint x="${currentX}" y="${Y_NEG}" />
      </bpmndi:BPMNEdge>`);
      return;
    }

    // Create element metadata
    positions[node.id] = { x: currentX, y: nodeY, w: (node.type === 'task' ? TASK_W : (node.type === 'gateway' || node.type === 'parallel-split' || node.type === 'parallel-join' ? GATEWAY_SIZE : EVENT_SIZE)), h: (node.type === 'task' ? TASK_H : (node.type === 'gateway' || node.type === 'parallel-split' || node.type === 'parallel-join' ? GATEWAY_SIZE : EVENT_SIZE)) };

    // Draw standard sequence flow
    const flowId = `Flow_${lastNodeId}_to_${node.id}`;
    registerFlow(flowId, lastNodeId, node.id, node.flowLabel);
    
    const pPos = positions[lastNodeId];
    diElements.push(`
      <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
        <di:waypoint x="${pPos.x + pPos.w}" y="${pPos.y}" />
        <di:waypoint x="${currentX}" y="${nodeY}" />
        ${node.flowLabel ? `<bpmndi:BPMNLabel><dc:Bounds x="${pPos.x + 40}" y="${pPos.y - 30}" width="30" height="14" /></bpmndi:BPMNLabel>` : ''}
      </bpmndi:BPMNEdge>`);

    if (node.type === 'parallel-join') {
      // Connect existing parallel branches to the join gateway
      parallelBranches.forEach(bId => {
        const joinFlowId = `Flow_Join_${bId}`;
        registerFlow(joinFlowId, bId, node.id);
        const bPos = positions[bId];
        diElements.push(`
        <bpmndi:BPMNEdge id="${joinFlowId}_di" bpmnElement="${joinFlowId}">
          <di:waypoint x="${bPos.x + bPos.w}" y="${bPos.y}" />
          <di:waypoint x="${currentX}" y="${Y_MAIN}" />
        </bpmndi:BPMNEdge>`);
      });
      activeParallelSplitId = null;
      parallelBranches = [];
      lastNodeId = node.id;
    } else if (activeParallelSplitId && node.type !== 'parallel-split') {
      parallelBranches.push(node.id);
    } else {
      lastNodeId = node.id;
      if (node.type === 'parallel-split') activeParallelSplitId = node.id;
    }

    currentX += positions[node.id].w + STEP_X;
  });

  // Final End Event
  const finalEndId = 'FinalEndEvent';
  registerFlow('Flow_Final_End', lastNodeId, finalEndId);
  const lastPos = positions[lastNodeId];
  positions[finalEndId] = { x: lastPos.x + lastPos.w + 100, y: Y_MAIN, w: 36, h: 36 };

  // Construct XML Elements with incoming/outgoing tags
  elements.push(`    <bpmn:startEvent id="StartEvent" name="Start">
      ${(outgoingFlows["StartEvent"] || []).map(f => `<bpmn:outgoing>${f}</bpmn:outgoing>`).join('\n      ')}
    </bpmn:startEvent>`);
  
  diElements.push(`
      <bpmndi:BPMNShape id="StartEvent_di" bpmnElement="StartEvent">
        <dc:Bounds x="100" y="${Y_MAIN - 18}" width="36" height="36" />
      </bpmndi:BPMNShape>`);

  nodeDefs.forEach(node => {
    if (node.type === 'loop-back') return;
    const pos = positions[node.id];
    const incoming = (incomingFlows[node.id] || []).map(f => `      <bpmn:incoming>${f}</bpmn:incoming>`).join('\n');
    const outgoing = (outgoingFlows[node.id] || []).map(f => `      <bpmn:outgoing>${f}</bpmn:outgoing>`).join('\n');

    if (node.type === 'gateway') {
      elements.push(`    <bpmn:exclusiveGateway id="${node.id}" name="${escapeXml(node.name)}">\n${incoming}\n${outgoing}\n    </bpmn:exclusiveGateway>`);
      diElements.push(`
      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}" isMarkerVisible="true">
        <dc:Bounds x="${pos.x}" y="${pos.y - 25}" width="50" height="50" />
        <bpmndi:BPMNLabel><dc:Bounds x="${pos.x}" y="${pos.y + 30}" width="50" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>`);
    } else if (node.type === 'parallel-split' || node.type === 'parallel-join') {
      elements.push(`    <bpmn:parallelGateway id="${node.id}" name="${escapeXml(node.name)}">\n${incoming}\n${outgoing}\n    </bpmn:parallelGateway>`);
      diElements.push(`
      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
        <dc:Bounds x="${pos.x}" y="${pos.y - 25}" width="50" height="50" />
      </bpmndi:BPMNShape>`);
    } else if (node.type === 'timer') {
      elements.push(`    <bpmn:intermediateCatchEvent id="${node.id}" name="${escapeXml(node.name)}">\n${incoming}\n${outgoing}\n      <bpmn:timerEventDefinition id="TimerDef_${node.id}" />\n    </bpmn:intermediateCatchEvent>`);
      diElements.push(`
      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
        <dc:Bounds x="${pos.x}" y="${pos.y - 18}" width="36" height="36" />
      </bpmndi:BPMNShape>`);
    } else if (node.type === 'cancel-end') {
      const endId = `End_${node.id}`;
      elements.push(`    <bpmn:endEvent id="${endId}" name="${escapeXml(node.name)}">\n      <bpmn:incoming>${incomingFlows[endId]}</bpmn:incoming>\n    </bpmn:endEvent>`);
    } else {
      elements.push(`    <bpmn:task id="${node.id}" name="${escapeXml(node.name)}">\n${incoming}\n${outgoing}\n    </bpmn:task>`);
      diElements.push(`
      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
        <dc:Bounds x="${pos.x}" y="${pos.y - 40}" width="100" height="80" />
      </bpmndi:BPMNShape>`);
    }
  });

  elements.push(`    <bpmn:endEvent id="${finalEndId}" name="End">\n      <bpmn:incoming>Flow_Final_End</bpmn:incoming>\n    </bpmn:endEvent>`);
  diElements.push(`
      <bpmndi:BPMNShape id="${finalEndId}_di" bpmnElement="${finalEndId}">
        <dc:Bounds x="${positions[finalEndId].x}" y="${Y_MAIN - 18}" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_Final_End_di" bpmnElement="Flow_Final_End">
        <di:waypoint x="${lastPos.x + lastPos.w}" y="${lastPos.y}" />
        <di:waypoint x="${positions[finalEndId].x}" y="${Y_MAIN}" />
      </bpmndi:BPMNEdge>`);

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
