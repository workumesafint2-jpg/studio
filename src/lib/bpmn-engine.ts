
export function generateBPMN(input: string, title: string = "Process Diagram"): string {
  if (!input.trim()) return '';

  const rawLines = input.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  // 1. Identify Node Types and Roles
  const nodeDefs: any[] = [];
  rawLines.forEach((line, index) => {
    const isGateway = line.includes('?');
    const isYes = line.toLowerCase().startsWith('yes ->');
    const isNo = line.toLowerCase().startsWith('no ->');
    
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
    const isLoop = lowerText.includes('fix') || lowerText.includes('edit');
    const isCancel = lowerText.includes('cancel') || lowerText.includes('reject') || lowerText.includes('stop') || lowerText.includes('terminate');
    const isParallelSplit = line.toLowerCase().startsWith('parallel:');
    const isJoin = lowerText === 'join';
    const isTimer = lowerText.includes('wait');

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

  let processContent = '';
  let flowContent = '';
  let diagramContent = '';

  // Layout Constants
  const Y_MAIN = 250;
  const Y_TOP = 150;    // Rule 1: Task A at y: 150
  const Y_BOTTOM = 350; // Rule 1: Task B at y: 350
  const Y_NEG = 450;
  
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
      </bpmndi:BPMNShape>`;

  let lastNodeId = "StartEvent";
  let currentX = 220;
  let activeParallelSplitId: string | null = null;
  let parallelBranches: string[] = [];

  nodeDefs.forEach((node) => {
    // RULE 4: Fix Loops (Edit) - Do NOT create a new task box.
    if (node.type === 'loop-back') {
      const previousTasks = nodeDefs.slice(0, node.index).filter(n => n.type === 'task' || n.type === 'gateway').reverse();
      const targetNode = previousTasks.length > 1 ? previousTasks[1] : previousTasks[0]; // Point back to the task before the decision or previous task
      const targetId = targetNode ? targetNode.id : 'StartEvent';
      
      const flowId = `Flow_Loop_${node.index}`;
      const label = node.flowLabel || node.name;
      flowContent += `    <bpmn:sequenceFlow id="${flowId}" name="${escapeXml(label)}" sourceRef="${lastNodeId}" targetRef="${targetId}" />\n`;
      
      const sPos = positions[lastNodeId];
      const tPos = positions[targetId];

      diagramContent += `
        <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
          <di:waypoint x="${sPos.x + (sPos.w / 2)}" y="${sPos.y - (sPos.h / 2)}" />
          <di:waypoint x="${sPos.x + (sPos.w / 2)}" y="${Y_TOP - 70}" />
          <di:waypoint x="${tPos.x + (tPos.w / 2)}" y="${Y_TOP - 70}" />
          <di:waypoint x="${tPos.x + (tPos.w / 2)}" y="${tPos.y - (tPos.h / 2)}" />
          <bpmndi:BPMNLabel>
            <dc:Bounds x="${(sPos.x + tPos.x) / 2}" y="${Y_TOP - 90}" width="60" height="14" />
          </bpmndi:BPMNLabel>
        </bpmndi:BPMNEdge>`;
      return;
    }

    // RULE: Cancel/Reject
    if (node.type === 'cancel-end') {
      const endId = `End_${node.id}`;
      processContent += `    <bpmn:endEvent id="${endId}" name="${escapeXml(node.name)}" />\n`;
      
      const sPos = positions[lastNodeId];
      const flowId = `Flow_Cancel_${node.id}`;
      flowContent += `    <bpmn:sequenceFlow id="${flowId}" name="${escapeXml(node.flowLabel || 'No')}" sourceRef="${lastNodeId}" targetRef="${endId}" />\n`;
      
      positions[endId] = { x: currentX, y: Y_NEG, w: EVENT_SIZE, h: EVENT_SIZE };
      
      diagramContent += `
        <bpmndi:BPMNShape id="${endId}_di" bpmnElement="${endId}">
          <dc:Bounds x="${currentX}" y="${Y_NEG - 18}" width="${EVENT_SIZE}" height="${EVENT_SIZE}" />
        </bpmndi:BPMNShape>
        <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
          <di:waypoint x="${sPos.x + (sPos.w / 2)}" y="${sPos.y + (sPos.h / 2)}" />
          <di:waypoint x="${sPos.x + (sPos.w / 2)}" y="${Y_NEG}" />
          <di:waypoint x="${currentX}" y="${Y_NEG}" />
          <bpmndi:BPMNLabel>
            <dc:Bounds x="${sPos.x + 30}" y="${Y_NEG - 20}" width="30" height="14" />
          </bpmndi:BPMNLabel>
        </bpmndi:BPMNEdge>`;
      return;
    }

    let nodeY = Y_MAIN;
    if (activeParallelSplitId) {
      // RULE 1: Vertical branching
      nodeY = parallelBranches.length % 2 === 0 ? Y_TOP : Y_BOTTOM;
    }

    // RULE 3: XOR Gateway (X)
    if (node.type === 'gateway') {
      processContent += `    <bpmn:exclusiveGateway id="${node.id}" name="${escapeXml(node.name)}" />\n`;
      positions[node.id] = { x: currentX, y: nodeY, w: GATEWAY_SIZE, h: GATEWAY_SIZE };
      diagramContent += `
        <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}" isMarkerVisible="true">
          <dc:Bounds x="${currentX}" y="${nodeY - 25}" width="${GATEWAY_SIZE}" height="${GATEWAY_SIZE}" />
        </bpmndi:BPMNShape>`;
    } 
    // RULE 5: Timers (Circle with clock)
    else if (node.type === 'timer') {
      processContent += `    <bpmn:intermediateCatchEvent id="${node.id}" name="${escapeXml(node.name)}">\n      <bpmn:timerEventDefinition id="T_${node.id}" />\n    </bpmn:intermediateCatchEvent>\n`;
      positions[node.id] = { x: currentX, y: nodeY, w: EVENT_SIZE, h: EVENT_SIZE };
      diagramContent += `
        <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
          <dc:Bounds x="${currentX}" y="${nodeY - 18}" width="${EVENT_SIZE}" height="${EVENT_SIZE}" />
        </bpmndi:BPMNShape>`;
    } 
    // RULE 1: Parallel Gateway (+)
    else if (node.type === 'parallel-split') {
      processContent += `    <bpmn:parallelGateway id="${node.id}" name="Split" />\n`;
      positions[node.id] = { x: currentX, y: Y_MAIN, w: GATEWAY_SIZE, h: GATEWAY_SIZE };
      diagramContent += `
        <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
          <dc:Bounds x="${currentX}" y="${Y_MAIN - 25}" width="${GATEWAY_SIZE}" height="${GATEWAY_SIZE}" />
        </bpmndi:BPMNShape>`;
      activeParallelSplitId = node.id;
    } 
    // RULE 2: Join (+)
    else if (node.type === 'parallel-join') {
      processContent += `    <bpmn:parallelGateway id="${node.id}" name="Join" />\n`;
      positions[node.id] = { x: currentX, y: Y_MAIN, w: GATEWAY_SIZE, h: GATEWAY_SIZE };
      diagramContent += `
        <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
          <dc:Bounds x="${currentX}" y="${Y_MAIN - 25}" width="${GATEWAY_SIZE}" height="${GATEWAY_SIZE}" />
        </bpmndi:BPMNShape>`;
      
      parallelBranches.forEach(bId => {
        const bFlow = `Flow_${bId}_to_${node.id}`;
        const bPos = positions[bId];
        flowContent += `    <bpmn:sequenceFlow id="${bFlow}" sourceRef="${bId}" targetRef="${node.id}" />\n`;
        diagramContent += `
          <bpmndi:BPMNEdge id="${bFlow}_di" bpmnElement="${bFlow}">
            <di:waypoint x="${bPos.x + bPos.w}" y="${bPos.y}" />
            <di:waypoint x="${currentX}" y="${Y_MAIN}" />
          </bpmndi:BPMNEdge>`;
      });
      activeParallelSplitId = null;
      parallelBranches = [];
    } else {
      processContent += `    <bpmn:task id="${node.id}" name="${escapeXml(node.name)}" />\n`;
      positions[node.id] = { x: currentX, y: nodeY, w: TASK_W, h: TASK_H };
      diagramContent += `
        <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
          <dc:Bounds x="${currentX}" y="${nodeY - 40}" width="${TASK_W}" height="${TASK_H}" />
        </bpmndi:BPMNShape>`;
    }

    // Connect sequence flow from last node
    const flowId = `Flow_${lastNodeId}_to_${node.id}`;
    const flowLabel = node.flowLabel || ''; // Rule 3: Labels on arrows
    flowContent += `    <bpmn:sequenceFlow id="${flowId}" name="${escapeXml(flowLabel)}" sourceRef="${lastNodeId}" targetRef="${node.id}" />\n`;
    
    const pPos = positions[lastNodeId];
    diagramContent += `
      <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
        <di:waypoint x="${pPos.x + pPos.w}" y="${pPos.y}" />
        <di:waypoint x="${currentX}" y="${nodeY}" />
        ${flowLabel ? `<bpmndi:BPMNLabel><dc:Bounds x="${pPos.x + 40}" y="${pPos.y - 25}" width="30" height="14" /></bpmndi:BPMNLabel>` : ''}
      </bpmndi:BPMNEdge>`;

    if (activeParallelSplitId && node.type !== 'parallel-split') {
      parallelBranches.push(node.id);
    } else {
      lastNodeId = node.id;
    }

    currentX += positions[node.id].w + STEP_X;
  });

  // Final End Event
  const finalEndId = 'FinalEndEvent';
  processContent += `    <bpmn:endEvent id="${finalEndId}" name="End" />\n`;
  const lastPos = positions[lastNodeId];
  flowContent += `    <bpmn:sequenceFlow id="Flow_Final_End" sourceRef="${lastNodeId}" targetRef="${finalEndId}" />\n`;
  diagramContent += `
      <bpmndi:BPMNShape id="${finalEndId}_di" bpmnElement="${finalEndId}">
        <dc:Bounds x="${lastPos.x + lastPos.w + 100}" y="${Y_MAIN - 18}" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_Final_End_di" bpmnElement="Flow_Final_End">
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
