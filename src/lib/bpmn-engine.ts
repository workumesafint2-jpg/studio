
export function generateBPMN(input: string, title: string = "Process Diagram"): string {
  if (!input.trim()) return '';

  const rawLines = input.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  // 1. Identify Node Types and Roles
  const nodeDefs: any[] = [];
  rawLines.forEach((line, index) => {
    const lowerLine = line.toLowerCase();
    
    // Check for explicit branches (Yes/No)
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
    // Detect multiple question mark types for Amharic/Universal support
    const isGateway = text.includes('?') || text.includes('፧') || text.includes('？');
    
    // Detect keywords for specific BPMN elements
    const isLoopTrigger = lowerText.includes('fix') || lowerText.includes('edit') || lowerText.includes('back');
    const isParallelSplit = lowerLine.startsWith('parallel:');
    const isJoin = lowerText === 'join';
    const isTimer = lowerText.includes('wait');
    const isCancel = lowerText.includes('cancel') || lowerText.includes('reject') || lowerText.includes('stop') || lowerText.includes('terminate');

    nodeDefs.push({
      id: `Node_${index}`,
      originalText: line,
      name: text.replace(/^parallel:/i, '').trim() || (isParallelSplit ? "Split" : text),
      // Rule 3: Loop Back (Edit/Fix) NEVER creates a task box
      type: isLoopTrigger ? 'loop-back' :
            isParallelSplit ? 'parallel-split' : 
            isJoin ? 'parallel-join' : 
            isGateway ? 'gateway' : 
            isTimer ? 'timer' : 
            isCancel ? 'cancel-end' : 'task',
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
    return id;
  };

  // Layout Constants
  const Y_MAIN = 250;
  const Y_TOP = 150;
  const Y_BOTTOM = 350;
  const STEP_X = 220;
  
  const TASK_W = 100, TASK_H = 80;
  const GATEWAY_SIZE = 50;
  const EVENT_SIZE = 36;

  const positions: Record<string, { x: number, y: number, w: number, h: number }> = {
    "StartEvent": { x: 100, y: Y_MAIN, w: 36, h: 36 }
  };

  let lastNodeId = "StartEvent";
  let lastTaskId = "StartEvent"; // Track actual task boxes for loop-backs
  let activeGatewayId: string | null = null;
  let activeParallelSplitId: string | null = null;
  let parallelBranches: string[] = [];
  let currentX = 250;

  nodeDefs.forEach((node) => {
    // Rule 3: Loop Back Logic (Non-Box)
    if (node.type === 'loop-back') {
      const sourceId = activeGatewayId || lastNodeId;
      // Find the most recent task box to point back to
      const targetId = lastTaskId;
      const flowId = `Flow_Loop_${node.id}`;
      registerFlow(flowId, sourceId, targetId, node.flowLabel || node.name);
      
      const sPos = positions[sourceId];
      const tPos = positions[targetId];

      if (sPos && tPos) {
        // Draw a professional high-clearance loop-back path
        diElements.push(`
        <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
          <di:waypoint x="${sPos.x + (sPos.w / 2)}" y="${sPos.y - (sPos.h / 2)}" />
          <di:waypoint x="${sPos.x + (sPos.w / 2)}" y="60" />
          <di:waypoint x="${tPos.x + (tPos.w / 2)}" y="60" />
          <di:waypoint x="${tPos.x + (tPos.w / 2)}" y="${tPos.y - (tPos.h / 2)}" />
          <bpmndi:BPMNLabel>
            <dc:Bounds x="${(sPos.x + tPos.x) / 2 - 30}" y="40" width="60" height="14" />
          </bpmndi:BPMNLabel>
        </bpmndi:BPMNEdge>`);
      }
      return;
    }

    // Determine Y position (Rule 2: Vertical branching for Parallel)
    let nodeY = Y_MAIN;
    if (activeParallelSplitId) {
      nodeY = (parallelBranches.length % 2 === 0) ? Y_TOP : Y_BOTTOM;
    }

    // Shape Bounds Calculation
    const width = (node.type === 'task' ? TASK_W : (node.type.includes('gateway') ? GATEWAY_SIZE : EVENT_SIZE));
    const height = (node.type === 'task' ? TASK_H : (node.type.includes('gateway') ? GATEWAY_SIZE : EVENT_SIZE));
    positions[node.id] = { x: currentX, y: nodeY, w: width, h: height };

    if (node.type === 'task') {
      lastTaskId = node.id;
    }

    // Connection Logic
    let sourceId = lastNodeId;
    if (node.flowLabel && activeGatewayId) {
      sourceId = activeGatewayId;
    } else if (activeParallelSplitId && !node.type.includes('join')) {
      sourceId = activeParallelSplitId;
    }

    const flowId = `Flow_${sourceId}_to_${node.id}`;
    registerFlow(flowId, sourceId, node.id, node.flowLabel);

    const sPos = positions[sourceId];
    diElements.push(`
      <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
        <di:waypoint x="${sPos.x + sPos.w}" y="${sPos.y}" />
        <di:waypoint x="${currentX}" y="${nodeY}" />
        ${node.flowLabel ? `<bpmndi:BPMNLabel><dc:Bounds x="${sPos.x + 60}" y="${sPos.y - 20}" width="40" height="14" /></bpmndi:BPMNLabel>` : ''}
      </bpmndi:BPMNEdge>`);

    // State Transitions
    if (node.type === 'gateway') {
      activeGatewayId = node.id;
    } else if (node.type === 'parallel-split') {
      activeParallelSplitId = node.id;
    } else if (node.type === 'parallel-join') {
      // Connect all active parallel branches to the join gateway
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
    } else if (activeParallelSplitId) {
      parallelBranches.push(node.id);
    }

    lastNodeId = node.id;
    currentX += width + STEP_X;
  });

  // Final Terminal Node
  const finalEndId = 'FinalEndEvent';
  const lastPos = positions[lastNodeId];
  if (lastPos) {
    registerFlow('Flow_Final_End', lastNodeId, finalEndId);
    positions[finalEndId] = { x: lastPos.x + lastPos.w + 100, y: Y_MAIN, w: 36, h: 36 };
  }

  // XML Construction
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
      // Rule 1: Exclusive Gateway (X)
      elements.push(`    <bpmn:exclusiveGateway id="${node.id}" name="${escapeXml(node.name)}">\n${incoming}\n${outgoing}\n    </bpmn:exclusiveGateway>`);
      diElements.push(`
      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}" isMarkerVisible="true">
        <dc:Bounds x="${pos.x}" y="${pos.y - 25}" width="50" height="50" />
        <bpmndi:BPMNLabel><dc:Bounds x="${pos.x - 25}" y="${pos.y + 30}" width="100" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>`);
    } else if (node.type === 'parallel-split' || node.type === 'parallel-join') {
      // Rule 2: Parallel Gateway (+)
      elements.push(`    <bpmn:parallelGateway id="${node.id}" name="${escapeXml(node.name)}">\n${incoming}\n${outgoing}\n    </bpmn:parallelGateway>`);
      diElements.push(`
      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
        <dc:Bounds x="${pos.x}" y="${pos.y - 25}" width="50" height="50" />
      </bpmndi:BPMNShape>`);
    } else if (node.type === 'timer') {
      // Rule 4: Timer (Wait) Circle
      elements.push(`    <bpmn:intermediateCatchEvent id="${node.id}" name="${escapeXml(node.name)}">\n${incoming}\n${outgoing}\n      <bpmn:timerEventDefinition id="TimerDef_${node.id}" />\n    </bpmn:intermediateCatchEvent>`);
      diElements.push(`
      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
        <dc:Bounds x="${pos.x}" y="${pos.y - 18}" width="36" height="36" />
        <bpmndi:BPMNLabel><dc:Bounds x="${pos.x - 32}" y="${pos.y + 22}" width="100" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>`);
    } else if (node.type === 'cancel-end') {
      elements.push(`    <bpmn:endEvent id="${node.id}" name="${escapeXml(node.name)}">\n${incoming}\n      <bpmn:terminateEventDefinition id="Terminate_${node.id}" />\n    </bpmn:endEvent>`);
      diElements.push(`
      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
        <dc:Bounds x="${pos.x}" y="${pos.y - 18}" width="36" height="36" />
      </bpmndi:BPMNShape>`);
    } else {
      elements.push(`    <bpmn:task id="${node.id}" name="${escapeXml(node.name)}">\n${incoming}\n${outgoing}\n    </bpmn:task>`);
      diElements.push(`
      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
        <dc:Bounds x="${pos.x}" y="${pos.y - 40}" width="100" height="80" />
      </bpmndi:BPMNShape>`);
    }
  });

  const fPos = positions[finalEndId];
  if (fPos) {
    const fIncoming = (incomingFlows[finalEndId] || []).map(f => `      <bpmn:incoming>${f}</bpmn:incoming>`).join('\n');
    elements.push(`    <bpmn:endEvent id="${finalEndId}" name="End">\n${fIncoming}\n    </bpmn:endEvent>`);
    diElements.push(`
      <bpmndi:BPMNShape id="${finalEndId}_di" bpmnElement="${finalEndId}">
        <dc:Bounds x="${fPos.x}" y="${Y_MAIN - 18}" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_Final_End_di" bpmnElement="Flow_Final_End">
        <di:waypoint x="${lastPos.x + lastPos.w}" y="${lastPos.y}" />
        <di:waypoint x="${fPos.x}" y="${Y_MAIN}" />
      </bpmndi:BPMNEdge>`);
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
