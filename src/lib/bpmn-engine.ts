
export function generateBPMN(input: string, title: string = "Process Diagram"): string {
  if (!input.trim()) return '';

  const lines = input.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  // 1. Pre-process nodes and determine types
  const nodeDefs: any[] = [];
  lines.forEach((text, index) => {
    const lowerText = text.toLowerCase();
    
    // Rule 1: Loop Back (Edit/Fix)
    const isLoopTrigger = lowerText.includes('edit') || lowerText.includes('fix');
    // Rule 2 & 3: Parallel Gateways
    const isParallelSplit = lowerText.startsWith('parallel:');
    const isJoin = lowerText === 'join';
    // Rule 4: Timer (Wait)
    const isTimer = lowerText.includes('wait');
    // Decision Gateway
    const isQuestion = text.includes('?');
    // Negative path
    const isNegative = lowerText.match(/reject|cancel|fail|error|invalid|stop|terminate/i);
    
    nodeDefs.push({
      id: `Node_${index}`,
      originalText: text,
      name: text,
      type: isLoopTrigger ? 'loop' : 
            (isParallelSplit ? 'parallel-split' : 
            (isJoin ? 'parallel-join' : 
            (isTimer ? 'timer' : 
            (isQuestion ? 'gateway' : 'task')))),
      isNegative: !!isNegative,
      index
    });
  });

  let processContent = '';
  let flowContent = '';
  let diagramContent = '';

  // Layout Constants
  const Y_MAIN = 225;
  const Y_UP = 120;    // Parallel Branch 1
  const Y_DOWN = 330;  // Parallel Branch 2
  const Y_NEG = 450;   // Terminal/Negative track
  const TASK_W = 100;
  const TASK_H = 80;
  const GATEWAY_SIZE = 50;
  const EVENT_SIZE = 36;
  const STEP_X = 180;

  const positions: Record<string, { x: number, y: number, w: number, h: number }> = {
    "StartEvent": { x: 100, y: Y_MAIN, w: 36, h: 36 }
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
  let activeParallelSplitId: string | null = null;
  let parallelBranches: string[] = [];

  // 2. Build Nodes and Flows
  nodeDefs.forEach((node, i) => {
    // Rule 1: Loop Back (Edit/Fix) - Draw arrow back to previous task, no box
    if (node.type === 'loop') {
      // Find the most recent task or timer to loop back to
      let targetNode = nodeDefs.slice(0, i).reverse().find(n => n.type === 'task' || n.type === 'timer' || n.id === 'StartEvent');
      const targetId = targetNode ? targetNode.id : 'StartEvent';
      
      const flowId = `Flow_Loop_${node.index}`;
      processContent += `    <bpmn:sequenceFlow id="${flowId}" name="${escapeXml(node.name)}" sourceRef="${lastNodeId}" targetRef="${targetId}" />\n`;
      
      const sourcePos = positions[lastNodeId];
      const targetPos = positions[targetId] || positions["StartEvent"];
      
      // Draw curved loop-back arrow
      diagramContent += `
        <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
          <di:waypoint x="${sourcePos.x + (sourcePos.w / 2)}" y="${sourcePos.y - (sourcePos.h / 2)}" />
          <di:waypoint x="${sourcePos.x + (sourcePos.w / 2)}" y="${Y_UP - 80}" />
          <di:waypoint x="${targetPos.x + (targetPos.w / 2)}" y="${Y_UP - 80}" />
          <di:waypoint x="${targetPos.x + (targetPos.w / 2)}" y="${targetPos.y - (targetPos.h / 2)}" />
          <bpmndi:BPMNLabel>
            <dc:Bounds x="${(sourcePos.x + targetPos.x) / 2}" y="${Y_UP - 100}" width="40" height="14" />
          </bpmndi:BPMNLabel>
        </bpmndi:BPMNEdge>`;
      return;
    }

    // Rule 2: Parallel Gateway (Split)
    if (node.type === 'parallel-split') {
      activeParallelSplitId = node.id;
      parallelBranches = [];
      processContent += `    <bpmn:parallelGateway id="${node.id}" name="Split" />\n`;
      
      diagramContent += `
        <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
          <dc:Bounds x="${currentX}" y="${Y_MAIN - 25}" width="${GATEWAY_SIZE}" height="${GATEWAY_SIZE}" />
        </bpmndi:BPMNShape>`;

      const flowId = `Flow_${lastNodeId}_to_${node.id}`;
      const prevPos = positions[lastNodeId];
      flowContent += `    <bpmn:sequenceFlow id="${flowId}" sourceRef="${lastNodeId}" targetRef="${node.id}" />\n`;
      diagramContent += `
        <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
          <di:waypoint x="${prevPos.x + (prevPos.w || 0)}" y="${prevPos.y}" />
          <di:waypoint x="${currentX}" y="${Y_MAIN}" />
        </bpmndi:BPMNEdge>`;

      positions[node.id] = { x: currentX, y: Y_MAIN, w: GATEWAY_SIZE, h: GATEWAY_SIZE };
      lastNodeId = node.id;
      currentX += 100;
      return;
    }

    // Rule 3: Parallel Gateway (Join)
    if (node.type === 'parallel-join') {
      processContent += `    <bpmn:parallelGateway id="${node.id}" name="Join" />\n`;
      diagramContent += `
        <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
          <dc:Bounds x="${currentX}" y="${Y_MAIN - 25}" width="${GATEWAY_SIZE}" height="${GATEWAY_SIZE}" />
        </bpmndi:BPMNShape>`;

      // Connect all recorded parallel branches into this join gateway
      parallelBranches.forEach((branchTaskId) => {
        const branchFlowId = `Flow_${branchTaskId}_to_Join_${node.index}`;
        const branchPos = positions[branchTaskId];
        flowContent += `    <bpmn:sequenceFlow id="${branchFlowId}" sourceRef="${branchTaskId}" targetRef="${node.id}" />\n`;
        diagramContent += `
          <bpmndi:BPMNEdge id="${branchFlowId}_di" bpmnElement="${branchFlowId}">
            <di:waypoint x="${branchPos.x + branchPos.w}" y="${branchPos.y}" />
            <di:waypoint x="${currentX + 25}" y="${branchPos.y}" />
            <di:waypoint x="${currentX + 25}" y="${Y_MAIN}" />
          </bpmndi:BPMNEdge>`;
      });

      positions[node.id] = { x: currentX, y: Y_MAIN, w: GATEWAY_SIZE, h: GATEWAY_SIZE };
      lastNodeId = node.id;
      activeParallelSplitId = null;
      parallelBranches = [];
      currentX += 100;
      return;
    }

    // Standard Node Positioning
    let nodeY = Y_MAIN;
    if (activeParallelSplitId) {
      // Rule 2: Branch tasks into different Y-coordinates (vertical stack)
      nodeY = parallelBranches.length % 2 === 0 ? Y_UP : Y_DOWN;
    } else if (node.isNegative) {
      nodeY = Y_NEG;
    }

    const flowId = `Flow_${lastNodeId}_to_${node.id}`;
    const flowLabel = (lastNodeId.includes('Node') && nodeDefs.find(n => n.id === lastNodeId)?.type === 'gateway') 
                        ? (node.isNegative ? "No" : "Yes") 
                        : "";

    // Rule 4: Timer Event (Wait)
    if (node.type === 'timer') {
      processContent += `    <bpmn:intermediateCatchEvent id="${node.id}" name="${escapeXml(node.name)}">\n`;
      processContent += `      <bpmn:timerEventDefinition id="Timer_${node.id}" />\n`;
      processContent += `    </bpmn:intermediateCatchEvent>\n`;

      diagramContent += `
        <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
          <dc:Bounds x="${currentX}" y="${nodeY - 18}" width="${EVENT_SIZE}" height="${EVENT_SIZE}" />
          <bpmndi:BPMNLabel>
            <dc:Bounds x="${currentX - 10}" y="${nodeY + 23}" width="56" height="14" />
          </bpmndi:BPMNLabel>
        </bpmndi:BPMNShape>`;
      
      positions[node.id] = { x: currentX, y: nodeY, w: EVENT_SIZE, h: EVENT_SIZE };
    } else if (node.type === 'gateway') {
      processContent += `    <bpmn:exclusiveGateway id="${node.id}" name="${escapeXml(node.name)}" />\n`;
      diagramContent += `
        <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}" isMarkerVisible="true">
          <dc:Bounds x="${currentX}" y="${nodeY - 25}" width="${GATEWAY_SIZE}" height="${GATEWAY_SIZE}" />
        </bpmndi:BPMNShape>`;
      positions[node.id] = { x: currentX, y: nodeY, w: GATEWAY_SIZE, h: GATEWAY_SIZE };
    } else {
      processContent += `    <bpmn:task id="${node.id}" name="${escapeXml(node.name)}" />\n`;
      diagramContent += `
        <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
          <dc:Bounds x="${currentX}" y="${nodeY - 40}" width="${TASK_W}" height="${TASK_H}" />
        </bpmndi:BPMNShape>`;
      positions[node.id] = { x: currentX, y: nodeY, w: TASK_W, h: TASK_H };
    }

    // Connect last node to current
    const sourceRef = lastNodeId;
    flowContent += `    <bpmn:sequenceFlow id="${flowId}" ${flowLabel ? `name="${flowLabel}"` : ''} sourceRef="${sourceRef}" targetRef="${node.id}" />\n`;
    
    const prevPos = positions[sourceRef];
    diagramContent += `
      <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
        <di:waypoint x="${prevPos.x + (prevPos.w || 0)}" y="${prevPos.y}" />
        <di:waypoint x="${currentX}" y="${nodeY}" />
        ${flowLabel ? `
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${prevPos.x + 30}" y="${prevPos.y - 15}" width="20" height="14" />
        </bpmndi:BPMNLabel>` : ''}
      </bpmndi:BPMNEdge>`;

    if (activeParallelSplitId) {
      parallelBranches.push(node.id);
      // We don't advance 'lastNodeId' to the branch node so the next parallel branch starts from the split gateway
      // However, for the first node after split, we want to stay at the split gate
    } else {
      lastNodeId = node.id;
    }

    // Terminal logic for negative paths
    if (node.isNegative) {
      const endNegId = `End_Neg_${node.id}`;
      processContent += `    <bpmn:endEvent id="${endNegId}" name="Rejected" />\n`;
      flowContent += `    <bpmn:sequenceFlow id="Flow_End_${node.id}" sourceRef="${node.id}" targetRef="${endNegId}" />\n`;
      diagramContent += `
        <bpmndi:BPMNShape id="${endNegId}_di" bpmnElement="${endNegId}">
          <dc:Bounds x="${currentX + positions[node.id].w + 60}" y="${nodeY - 18}" width="36" height="36" />
        </bpmndi:BPMNShape>
        <bpmndi:BPMNEdge id="Flow_End_${node.id}_di" bpmnElement="Flow_End_${node.id}">
          <di:waypoint x="${currentX + positions[node.id].w}" y="${nodeY}" />
          <di:waypoint x="${currentX + positions[node.id].w + 60}" y="${nodeY}" />
        </bpmndi:BPMNEdge>`;
    }

    currentX += positions[node.id].w + STEP_X;
  });

  // Final End Event
  const finalEndId = "EndEvent_Final";
  processContent += `    <bpmn:endEvent id="${finalEndId}" name="Completed" />\n`;
  flowContent += `    <bpmn:sequenceFlow id="Flow_Final" sourceRef="${lastNodeId}" targetRef="${finalEndId}" />\n`;
  
  const lastPos = positions[lastNodeId];
  diagramContent += `
    <bpmndi:BPMNShape id="${finalEndId}_di" bpmnElement="${finalEndId}">
      <dc:Bounds x="${lastPos.x + lastPos.w + 100}" y="${Y_MAIN - 18}" width="36" height="36" />
    </bpmndi:BPMNShape>
    <bpmndi:BPMNEdge id="Flow_Final_di" bpmnElement="Flow_Final">
      <di:waypoint x="${lastPos.x + lastPos.w}" y="${Y_MAIN}" />
      <di:waypoint x="${lastPos.x + lastPos.w + 100}" y="${Y_MAIN}" />
    </bpmndi:BPMNEdge>`;

  // Rule 5: Don't overwrite - Wrap in definitions including the Service Title
  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                  targetNamespace="http://bpmn.io/schema/bpmn"
                  exporter="BPMN FlowForge" exporterVersion="2.0">
  <bpmn:process id="Process_1" name="${escapeXml(title)}" isExecutable="false">
${processContent}
${flowContent}
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
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
