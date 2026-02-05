
export function generateBPMN(input: string, title: string = "Process Diagram"): string {
  if (!input.trim()) return '';

  const lines = input.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  // 1. Identify Node Types and Roles
  const nodeDefs: any[] = [];
  lines.forEach((text, index) => {
    const lowerText = text.toLowerCase();
    
    const isParallelSplit = lowerText.startsWith('parallel:');
    const isJoin = lowerText === 'join';
    const isTimer = lowerText.includes('wait');
    const isLoopTrigger = lowerText.includes('edit') || lowerText.includes('fix');
    const isQuestion = text.includes('?');
    const isNegative = lowerText.match(/reject|cancel|fail|error|invalid|stop|terminate/i);
    
    nodeDefs.push({
      id: `Node_${index}`,
      originalText: text,
      name: text.replace(/^parallel:/i, '').trim() || (isParallelSplit ? "Split" : text),
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
  const Y_MAIN = 250;
  const Y_TOP = 150;    // Parallel Branch 1
  const Y_BOTTOM = 350; // Parallel Branch 2
  const Y_NEG = 450;    // Terminal path
  
  const TASK_W = 100;
  const TASK_H = 80;
  const GATEWAY_SIZE = 50;
  const EVENT_SIZE = 36;
  const STEP_X = 160;

  const positions: Record<string, { x: number, y: number, w: number, h: number }> = {
    "StartEvent": { x: 100, y: Y_MAIN, w: 36, h: 36 }
  };

  // Start Event
  processContent += '    <bpmn:startEvent id="StartEvent" name="Start">\n      <bpmn:outgoing>Flow_Start</bpmn:outgoing>\n    </bpmn:startEvent>\n';
  diagramContent += `
      <bpmndi:BPMNShape id="StartEvent_di" bpmnElement="StartEvent">
        <dc:Bounds x="100" y="${Y_MAIN - 18}" width="36" height="36" />
      </bpmndi:BPMNShape>`;

  let lastNodeId = "StartEvent";
  let currentX = 200;
  let activeParallelSplitId: string | null = null;
  let parallelBranches: string[] = [];

  // 2. Generate Nodes and Sequence Flows
  nodeDefs.forEach((node) => {
    // Rule 4: Looping (Edit) - No box, just a flow back
    if (node.type === 'loop') {
      // Find the most recent task to loop back to
      const previousNodes = nodeDefs.slice(0, node.index).reverse();
      const targetNode = previousNodes.find(n => n.type === 'task' || n.id === 'StartEvent');
      const targetId = targetNode ? targetNode.id : 'StartEvent';
      
      const flowId = `Flow_Loop_${node.index}`;
      flowContent += `    <bpmn:sequenceFlow id="${flowId}" name="${escapeXml(node.originalText)}" sourceRef="${lastNodeId}" targetRef="${targetId}" />\n`;
      
      const sPos = positions[lastNodeId];
      const tPos = positions[targetId];
      
      diagramContent += `
        <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
          <di:waypoint x="${sPos.x + (sPos.w / 2)}" y="${sPos.y - (sPos.h / 2)}" />
          <di:waypoint x="${sPos.x + (sPos.w / 2)}" y="${Y_TOP - 100}" />
          <di:waypoint x="${tPos.x + (tPos.w / 2)}" y="${Y_TOP - 100}" />
          <di:waypoint x="${tPos.x + (tPos.w / 2)}" y="${tPos.y - (tPos.h / 2)}" />
        </bpmndi:BPMNEdge>`;
      return;
    }

    // Rule 1: Parallel Splitting (+)
    if (node.type === 'parallel-split') {
      activeParallelSplitId = node.id;
      parallelBranches = [];
      processContent += `    <bpmn:parallelGateway id="${node.id}" name="Split" />\n`;
      positions[node.id] = { x: currentX, y: Y_MAIN, w: GATEWAY_SIZE, h: GATEWAY_SIZE };
      
      diagramContent += `
        <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
          <dc:Bounds x="${currentX}" y="${Y_MAIN - 25}" width="${GATEWAY_SIZE}" height="${GATEWAY_SIZE}" />
        </bpmndi:BPMNShape>`;

      const flowId = `Flow_${lastNodeId}_to_${node.id}`;
      const prevPos = positions[lastNodeId];
      flowContent += `    <bpmn:sequenceFlow id="${flowId}" sourceRef="${lastNodeId}" targetRef="${node.id}" />\n`;
      diagramContent += `
        <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
          <di:waypoint x="${prevPos.x + prevPos.w}" y="${prevPos.y}" />
          <di:waypoint x="${currentX}" y="${Y_MAIN}" />
        </bpmndi:BPMNEdge>`;

      lastNodeId = node.id;
      currentX += 100;
      return;
    }

    // Rule 3: The Join (+)
    if (node.type === 'parallel-join') {
      processContent += `    <bpmn:parallelGateway id="${node.id}" name="Join" />\n`;
      positions[node.id] = { x: currentX, y: Y_MAIN, w: GATEWAY_SIZE, h: GATEWAY_SIZE };
      
      diagramContent += `
        <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
          <dc:Bounds x="${currentX}" y="${Y_MAIN - 25}" width="${GATEWAY_SIZE}" height="${GATEWAY_SIZE}" />
        </bpmndi:BPMNShape>`;

      parallelBranches.forEach((branchId) => {
        const bFlowId = `Flow_${branchId}_to_${node.id}`;
        const bPos = positions[branchId];
        flowContent += `    <bpmn:sequenceFlow id="${bFlowId}" sourceRef="${branchId}" targetRef="${node.id}" />\n`;
        diagramContent += `
          <bpmndi:BPMNEdge id="${bFlowId}_di" bpmnElement="${bFlowId}">
            <di:waypoint x="${bPos.x + bPos.w}" y="${bPos.y}" />
            <di:waypoint x="${currentX + 25}" y="${bPos.y}" />
            <di:waypoint x="${currentX + 25}" y="${Y_MAIN}" />
          </bpmndi:BPMNEdge>`;
      });

      lastNodeId = node.id;
      activeParallelSplitId = null;
      parallelBranches = [];
      currentX += 100;
      return;
    }

    // Standard positioning with Rule 2 (Y-axis offset)
    let nodeY = Y_MAIN;
    if (activeParallelSplitId) {
      nodeY = parallelBranches.length % 2 === 0 ? Y_TOP : Y_BOTTOM;
    } else if (node.isNegative) {
      nodeY = Y_NEG;
    }

    // Rule 5: Timers (Catch Event)
    if (node.type === 'timer') {
      processContent += `    <bpmn:intermediateCatchEvent id="${node.id}" name="${escapeXml(node.name)}">\n      <bpmn:timerEventDefinition id="T_${node.id}" />\n    </bpmn:intermediateCatchEvent>\n`;
      positions[node.id] = { x: currentX, y: nodeY, w: EVENT_SIZE, h: EVENT_SIZE };
      diagramContent += `
        <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
          <dc:Bounds x="${currentX}" y="${nodeY - 18}" width="${EVENT_SIZE}" height="${EVENT_SIZE}" />
          <bpmndi:BPMNLabel><dc:Bounds x="${currentX - 10}" y="${nodeY + 25}" width="60" height="14" /></bpmndi:BPMNLabel>
        </bpmndi:BPMNShape>`;
    } else if (node.type === 'gateway') {
      processContent += `    <bpmn:exclusiveGateway id="${node.id}" name="${escapeXml(node.name)}" />\n`;
      positions[node.id] = { x: currentX, y: nodeY, w: GATEWAY_SIZE, h: GATEWAY_SIZE };
      diagramContent += `
        <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}" isMarkerVisible="true">
          <dc:Bounds x="${currentX}" y="${nodeY - 25}" width="${GATEWAY_SIZE}" height="${GATEWAY_SIZE}" />
        </bpmndi:BPMNShape>`;
    } else {
      processContent += `    <bpmn:task id="${node.id}" name="${escapeXml(node.name)}" />\n`;
      positions[node.id] = { x: currentX, y: nodeY, w: TASK_W, h: TASK_H };
      diagramContent += `
        <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
          <dc:Bounds x="${currentX}" y="${nodeY - 40}" width="${TASK_W}" height="${TASK_H}" />
        </bpmndi:BPMNShape>`;
    }

    // Connect flow
    const flowId = `Flow_${lastNodeId}_to_${node.id}`;
    const flowLabel = (lastNodeId.includes('Node') && nodeDefs.find(n => n.id === lastNodeId)?.type === 'gateway') 
                        ? (node.isNegative ? "No" : "Yes") : "";
    
    flowContent += `    <bpmn:sequenceFlow id="${flowId}" ${flowLabel ? `name="${flowLabel}"` : ''} sourceRef="${lastNodeId}" targetRef="${node.id}" />\n`;
    const pPos = positions[lastNodeId];
    diagramContent += `
      <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
        <di:waypoint x="${pPos.x + pPos.w}" y="${pPos.y}" />
        <di:waypoint x="${currentX}" y="${nodeY}" />
        ${flowLabel ? `<bpmndi:BPMNLabel><dc:Bounds x="${pPos.x + 30}" y="${pPos.y - 15}" width="20" height="14" /></bpmndi:BPMNLabel>` : ''}
      </bpmndi:BPMNEdge>`;

    if (activeParallelSplitId) {
      parallelBranches.push(node.id);
    } else {
      lastNodeId = node.id;
    }

    currentX += positions[node.id].w + STEP_X;
  });

  // Final End
  processContent += '    <bpmn:endEvent id="EndEvent" name="End" />\n';
  const lastPos = positions[lastNodeId];
  flowContent += `    <bpmn:sequenceFlow id="Flow_End" sourceRef="${lastNodeId}" targetRef="EndEvent" />\n`;
  diagramContent += `
      <bpmndi:BPMNShape id="EndEvent_di" bpmnElement="EndEvent">
        <dc:Bounds x="${lastPos.x + lastPos.w + 100}" y="${Y_MAIN - 18}" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_End_di" bpmnElement="Flow_End">
        <di:waypoint x="${lastPos.x + lastPos.w}" y="${lastPos.y}" />
        <di:waypoint x="${lastPos.x + lastPos.w + 100}" y="${Y_MAIN}" />
      </bpmndi:BPMNEdge>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                  targetNamespace="http://bpmn.io/schema/bpmn">
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
