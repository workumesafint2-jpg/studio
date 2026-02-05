export function generateBPMN(input: string, title: string = "Process Diagram"): string {
  if (!input.trim()) return '';

  const lines = input.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  // 1. Pre-process nodes and determine types
  const nodes: any[] = [];
  lines.forEach((text, index) => {
    const lowerText = text.toLowerCase();
    
    // Check for Parallel tasks (Split & Join pattern)
    // Pattern: "Task A and Task B"
    const isParallel = text.includes(' and ') || text.includes(' & ');
    
    // Check for Timer (Wait/Time/Duration)
    const isTimer = lowerText.includes('wait') || lowerText.includes('time') || lowerText.includes('duration');
    
    // Check for Gateway
    const isQuestion = text.includes('?') || lowerText.startsWith('is ') || lowerText.startsWith('check ');
    
    // Check for Terminal/Negative
    const isNegative = lowerText.match(/reject|cancel|fail|error|invalid|stop|terminate/i);
    
    // Check for Loop
    const isLoopTrigger = lowerText.match(/back to|goto|repeat|return to|fix|edit|retry/i);
    
    if (isParallel) {
      const parts = text.split(/ and | & /).map(p => p.trim());
      nodes.push({
        id: `Parallel_${index}`,
        type: 'parallel',
        name: text,
        branches: parts,
        index
      });
    } else if (isTimer) {
      nodes.push({
        id: `Timer_${index}`,
        type: 'timer',
        name: text,
        index
      });
    } else {
      nodes.push({
        id: `Node_${index}`,
        type: isQuestion ? 'gateway' : 'task',
        name: text,
        isNegative: !!isNegative,
        isLoopTrigger: !!isLoopTrigger,
        index
      });
    }
  });

  let processContent = '';
  let flowContent = '';
  let diagramContent = '';

  // Layout Constants
  const Y_MAIN = 200;
  const Y_UP = 80;
  const Y_DOWN = 320;
  const TASK_W = 100;
  const TASK_H = 80;
  const GATEWAY_W = 50;
  const GATEWAY_H = 50;
  const EVENT_SIZE = 36;
  const STEP_X = 180;

  const positions: Record<string, { x: number, y: number, w: number, h: number, renderY: number }> = {
    "StartEvent": { x: 100, y: Y_MAIN, w: 36, h: 36, renderY: Y_MAIN - 18 }
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

  // 2. Build Nodes and Flows
  nodes.forEach((node, i) => {
    const flowId = `Flow_${lastNodeId}_to_${node.id}`;
    
    if (node.type === 'parallel') {
      const splitId = `${node.id}_split`;
      const joinId = `${node.id}_join`;
      
      // Split Gateway
      processContent += `    <bpmn:parallelGateway id="${splitId}" name="Split">\n`;
      processContent += `      <bpmn:incoming>Flow_${lastNodeId}_to_${splitId}</bpmn:incoming>\n`;
      node.branches.forEach((branch: string, bIdx: number) => {
        processContent += `      <bpmn:outgoing>Flow_${splitId}_to_${node.id}_B${bIdx}</bpmn:outgoing>\n`;
      });
      processContent += `    </bpmn:parallelGateway>\n`;

      // Branches (Tasks)
      node.branches.forEach((branch: string, bIdx: number) => {
        const branchTaskId = `${node.id}_B${bIdx}`;
        const branchY = bIdx === 0 ? Y_UP : Y_DOWN;
        
        processContent += `    <bpmn:task id="${branchTaskId}" name="${escapeXml(branch)}">\n`;
        processContent += `      <bpmn:incoming>Flow_${splitId}_to_${branchTaskId}</bpmn:incoming>\n`;
        processContent += `      <bpmn:outgoing>Flow_${branchTaskId}_to_${joinId}</bpmn:outgoing>\n`;
        processContent += `    </bpmn:task>\n`;

        // Diagram for Branch Task
        diagramContent += `
          <bpmndi:BPMNShape id="${branchTaskId}_di" bpmnElement="${branchTaskId}">
            <dc:Bounds x="${currentX + 80}" y="${branchY - 40}" width="${TASK_W}" height="${TASK_H}" />
          </bpmndi:BPMNShape>`;

        // Flow Split -> Branch
        flowContent += `    <bpmn:sequenceFlow id="Flow_${splitId}_to_${branchTaskId}" sourceRef="${splitId}" targetRef="${branchTaskId}" />\n`;
        diagramContent += `
          <bpmndi:BPMNEdge id="Flow_${splitId}_to_${branchTaskId}_di" bpmnElement="Flow_${splitId}_to_${branchTaskId}">
            <di:waypoint x="${currentX + GATEWAY_W}" y="${Y_MAIN}" />
            <di:waypoint x="${currentX + 50}" y="${branchY}" />
            <di:waypoint x="${currentX + 80}" y="${branchY}" />
          </bpmndi:BPMNEdge>`;

        // Flow Branch -> Join
        flowContent += `    <bpmn:sequenceFlow id="Flow_${branchTaskId}_to_${joinId}" sourceRef="${branchTaskId}" targetRef="${joinId}" />\n`;
        diagramContent += `
          <bpmndi:BPMNEdge id="Flow_${branchTaskId}_to_${joinId}_di" bpmnElement="Flow_${branchTaskId}_to_${joinId}">
            <di:waypoint x="${currentX + 80 + TASK_W}" y="${branchY}" />
            <di:waypoint x="${currentX + 80 + TASK_W + 30}" y="${branchY}" />
            <di:waypoint x="${currentX + 80 + TASK_W + 30}" y="${Y_MAIN}" />
            <di:waypoint x="${currentX + 220}" y="${Y_MAIN}" />
          </bpmndi:BPMNEdge>`;
      });

      // Join Gateway
      processContent += `    <bpmn:parallelGateway id="${joinId}" name="Join">\n`;
      node.branches.forEach((_: any, bIdx: number) => {
        processContent += `      <bpmn:incoming>Flow_${node.id}_B${bIdx}_to_${joinId}</bpmn:incoming>\n`;
      });
      if (i < nodes.length - 1) {
        processContent += `      <bpmn:outgoing>Flow_${joinId}_to_${nodes[i+1].id}</bpmn:outgoing>\n`;
      } else {
        processContent += `      <bpmn:outgoing>Flow_${joinId}_to_End</bpmn:outgoing>\n`;
      }
      processContent += `    </bpmn:parallelGateway>\n`;

      // Shapes for Split/Join
      diagramContent += `
        <bpmndi:BPMNShape id="${splitId}_di" bpmnElement="${splitId}">
          <dc:Bounds x="${currentX}" y="${Y_MAIN - 25}" width="${GATEWAY_W}" height="${GATEWAY_H}" />
        </bpmndi:BPMNShape>
        <bpmndi:BPMNShape id="${joinId}_di" bpmnElement="${joinId}">
          <dc:Bounds x="${currentX + 220}" y="${Y_MAIN - 25}" width="${GATEWAY_W}" height="${GATEWAY_H}" />
        </bpmndi:BPMNShape>`;

      // Flow from Previous
      const prevPos = positions[lastNodeId];
      const incomingFlowId = `Flow_${lastNodeId}_to_${splitId}`;
      flowContent += `    <bpmn:sequenceFlow id="${incomingFlowId}" sourceRef="${lastNodeId}" targetRef="${splitId}" />\n`;
      diagramContent += `
        <bpmndi:BPMNEdge id="${incomingFlowId}_di" bpmnElement="${incomingFlowId}">
          <di:waypoint x="${prevPos.x + prevPos.w}" y="${prevPos.y}" />
          <di:waypoint x="${currentX}" y="${Y_MAIN}" />
        </bpmndi:BPMNEdge>`;

      positions[joinId] = { x: currentX + 220, y: Y_MAIN, w: GATEWAY_W, h: GATEWAY_H, renderY: Y_MAIN - 25 };
      lastNodeId = joinId;
      currentX += 350;

    } else if (node.type === 'timer') {
      const type = 'bpmn:intermediateCatchEvent';
      processContent += `    <${type} id="${node.id}" name="${escapeXml(node.name)}">\n`;
      processContent += `      <bpmn:incoming>${flowId}</bpmn:incoming>\n`;
      if (i < nodes.length - 1) {
        processContent += `      <bpmn:outgoing>Flow_${node.id}_to_${nodes[i+1].id}</bpmn:outgoing>\n`;
      } else {
        processContent += `      <bpmn:outgoing>Flow_${node.id}_to_End</bpmn:outgoing>\n`;
      }
      processContent += `      <bpmn:timerEventDefinition id="TimerEventDef_${node.id}" />\n`;
      processContent += `    </${type}>\n`;

      diagramContent += `
        <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
          <dc:Bounds x="${currentX}" y="${Y_MAIN - 18}" width="${EVENT_SIZE}" height="${EVENT_SIZE}" />
          <bpmndi:BPMNLabel>
            <dc:Bounds x="${currentX - 10}" y="${Y_MAIN + 23}" width="${EVENT_SIZE + 20}" height="14" />
          </bpmndi:BPMNLabel>
        </bpmndi:BPMNShape>`;

      // Flow from previous
      const prevPos = positions[lastNodeId];
      flowContent += `    <bpmn:sequenceFlow id="${flowId}" sourceRef="${lastNodeId}" targetRef="${node.id}" />\n`;
      diagramContent += `
        <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
          <di:waypoint x="${prevPos.x + prevPos.w}" y="${prevPos.y}" />
          <di:waypoint x="${currentX}" y="${Y_MAIN}" />
        </bpmndi:BPMNEdge>`;

      positions[node.id] = { x: currentX, y: Y_MAIN, w: EVENT_SIZE, h: EVENT_SIZE, renderY: Y_MAIN - 18 };
      lastNodeId = node.id;
      currentX += 100;

    } else {
      // Normal Task/Gateway
      const type = node.type === 'gateway' ? 'bpmn:exclusiveGateway' : 'bpmn:task';
      const nodeY = node.isNegative ? Y_DOWN : Y_MAIN;
      const w = node.type === 'gateway' ? GATEWAY_W : TASK_W;
      const h = node.type === 'gateway' ? GATEWAY_H : TASK_H;
      const renderY = nodeY - (h / 2);

      processContent += `    <${type} id="${node.id}" name="${escapeXml(node.name)}">\n`;
      processContent += `      <bpmn:incoming>${flowId}</bpmn:incoming>\n`;
      
      if (node.isNegative) {
        processContent += `      <bpmn:outgoing>Flow_${node.id}_to_End_Neg</bpmn:outgoing>\n`;
      } else if (i < nodes.length - 1) {
        processContent += `      <bpmn:outgoing>Flow_${node.id}_to_${nodes[i+1].id}</bpmn:outgoing>\n`;
      } else {
        processContent += `      <bpmn:outgoing>Flow_${node.id}_to_End</bpmn:outgoing>\n`;
      }
      processContent += `    </${type}>\n`;

      diagramContent += `
        <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}" isMarkerVisible="true">
          <dc:Bounds x="${currentX}" y="${renderY}" width="${w}" height="${h}" />
          <bpmndi:BPMNLabel>
            <dc:Bounds x="${currentX}" y="${renderY + h + 5}" width="${w}" height="14" />
          </bpmndi:BPMNLabel>
        </bpmndi:BPMNShape>`;

      // Flow from previous
      const prevPos = positions[lastNodeId];
      const prevNode = nodes.find(n => n.id === lastNodeId || n.id === `${lastNodeId}_join` || n.id === `${lastNodeId}_split`);
      let flowLabel = "";
      if (prevPos && lastNodeId.includes('Node_') && nodes.find(n => n.id === lastNodeId)?.type === 'gateway') {
        flowLabel = node.isNegative ? "No" : "Yes";
      }

      flowContent += `    <bpmn:sequenceFlow id="${flowId}" ${flowLabel ? `name="${flowLabel}"` : ''} sourceRef="${lastNodeId}" targetRef="${node.id}" />\n`;
      diagramContent += `
        <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
          <di:waypoint x="${prevPos.x + prevPos.w}" y="${prevPos.y}" />
          <di:waypoint x="${currentX}" y="${nodeY}" />
          ${flowLabel ? `
          <bpmndi:BPMNLabel>
            <dc:Bounds x="${prevPos.x + prevPos.w + 10}" y="${prevPos.y - 15}" width="20" height="14" />
          </bpmndi:BPMNLabel>` : ''}
        </bpmndi:BPMNEdge>`;

      if (node.isNegative) {
        const endNegId = `End_Neg_${node.id}`;
        processContent += `    <bpmn:endEvent id="${endNegId}" name="Rejected">\n      <bpmn:incoming>Flow_${node.id}_to_End_Neg</bpmn:incoming>\n    </bpmn:endEvent>\n`;
        flowContent += `    <bpmn:sequenceFlow id="Flow_${node.id}_to_End_Neg" sourceRef="${node.id}" targetRef="${endNegId}" />\n`;
        diagramContent += `
        <bpmndi:BPMNShape id="${endNegId}_di" bpmnElement="${endNegId}">
          <dc:Bounds x="${currentX + w + 60}" y="${Y_DOWN - 18}" width="36" height="36" />
        </bpmndi:BPMNShape>
        <bpmndi:BPMNEdge id="Flow_${node.id}_to_End_Neg_di" bpmnElement="Flow_${node.id}_to_End_Neg">
          <di:waypoint x="${currentX + w}" y="${Y_DOWN}" />
          <di:waypoint x="${currentX + w + 60}" y="${Y_DOWN}" />
        </bpmndi:BPMNEdge>`;
      }

      positions[node.id] = { x: currentX, y: nodeY, w: w, h: h, renderY: renderY };
      if (!node.isNegative) lastNodeId = node.id;
      currentX += w + STEP_X;
    }
  });

  const lastMainNode = nodes.slice().reverse().find(n => !n.isNegative);
  if (lastMainNode) {
    const finalEndId = "EndEvent_Final";
    const finalFlowId = `Flow_${lastNodeId}_to_End`;
    processContent += `    <bpmn:endEvent id="${finalEndId}" name="Completed">\n      <bpmn:incoming>${finalFlowId}</bpmn:incoming>\n    </bpmn:endEvent>\n`;
    flowContent += `    <bpmn:sequenceFlow id="${finalFlowId}" sourceRef="${lastNodeId}" targetRef="${finalEndId}" />\n`;
    
    const lastPos = positions[lastNodeId];
    const finalX = lastPos.x + lastPos.w + 100;
    diagramContent += `
      <bpmndi:BPMNShape id="${finalEndId}_di" bpmnElement="${finalEndId}">
        <dc:Bounds x="${finalX}" y="${Y_MAIN - 18}" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${finalX - 10}" y="${Y_MAIN + 23}" width="56" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="${finalFlowId}_di" bpmnElement="${finalFlowId}">
        <di:waypoint x="${lastPos.x + lastPos.w}" y="${lastPos.y}" />
        <di:waypoint x="${finalX}" y="${Y_MAIN}" />
      </bpmndi:BPMNEdge>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                  targetNamespace="http://bpmn.io/schema/bpmn"
                  exporter="BPMN FlowForge" 
                  exporterVersion="1.5">
  <bpmn:process id="Process_Parallel_Logic" name="${escapeXml(title)}" isExecutable="false">
${processContent}
${flowContent}
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_Parallel_Logic">
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
