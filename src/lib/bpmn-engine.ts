export function generateBPMN(input: string, title: string = "Process Diagram"): string {
  if (!input.trim()) return '';

  const lines = input.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  // 1. Pre-process nodes and determine types
  const nodeDefs: any[] = [];
  lines.forEach((text, index) => {
    const lowerText = text.toLowerCase();
    
    // Loop trigger (Edit/Fix)
    const isLoopTrigger = lowerText.match(/edit|fix|retry|back to|repeat|return/i);
    
    // Parallel (Task A and Task B)
    const isParallel = text.includes(' and ') || text.includes(' & ');
    
    // Timer (Wait)
    const isTimer = lowerText.includes('wait');
    
    // Gateway (Question)
    const isQuestion = text.includes('?') || lowerText.startsWith('is ') || lowerText.startsWith('check ');
    
    // Terminal (Reject/Cancel)
    const isNegative = lowerText.match(/reject|cancel|fail|error|invalid|stop|terminate/i);
    
    nodeDefs.push({
      id: `Node_${index}`,
      originalText: text,
      name: text,
      type: isLoopTrigger ? 'loop' : (isParallel ? 'parallel' : (isTimer ? 'timer' : (isQuestion ? 'gateway' : 'task'))),
      isNegative: !!isNegative,
      index
    });
  });

  let processContent = '';
  let flowContent = '';
  let diagramContent = '';

  // Layout Constants
  const Y_MAIN = 225;
  const Y_UP = 150;    // Requested Y for Branch A
  const Y_DOWN = 300;  // Requested Y for Branch B
  const Y_NEG = 375;   // Terminal/Negative track
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

  // 2. Build Nodes and Flows
  nodeDefs.forEach((node, i) => {
    if (node.type === 'loop') {
      // Find the "target" (the task before the one that asked the question, or the previous task)
      // If we have: 1. Task A, 2. Question?, 3. Edit (loop)
      // We want to loop from Node_1 back to Node_0.
      let targetNode = nodeDefs.slice(0, i).reverse().find(n => n.type === 'task' || n.type === 'timer');
      if (!targetNode) targetNode = nodeDefs[0];
      
      const flowId = `Flow_Loop_${node.index}`;
      processContent += `    <bpmn:sequenceFlow id="${flowId}" name="Edit/Fix" sourceRef="${lastNodeId}" targetRef="${targetNode.id}" />\n`;
      
      const sourcePos = positions[lastNodeId];
      const targetPos = positions[targetNode.id];
      
      diagramContent += `
        <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
          <di:waypoint x="${sourcePos.x + (sourcePos.w / 2)}" y="${sourcePos.y - (sourcePos.h / 2)}" />
          <di:waypoint x="${sourcePos.x + (sourcePos.w / 2)}" y="${Y_UP - 100}" />
          <di:waypoint x="${targetPos.x + (targetPos.w / 2)}" y="${Y_UP - 100}" />
          <di:waypoint x="${targetPos.x + (targetPos.w / 2)}" y="${targetPos.y - (targetPos.h / 2)}" />
          <bpmndi:BPMNLabel>
            <dc:Bounds x="${(sourcePos.x + targetPos.x) / 2}" y="${Y_UP - 120}" width="40" height="14" />
          </bpmndi:BPMNLabel>
        </bpmndi:BPMNEdge>`;
      
      // Loops don't advance the "main" cursor usually, or they indicate a dead-end branch in this linear logic.
      return;
    }

    const flowId = `Flow_${lastNodeId}_to_${node.id}`;
    const flowLabel = (lastNodeId.includes('Node') && nodeDefs.find(n => n.id === lastNodeId)?.type === 'gateway') 
                        ? (node.isNegative ? "No" : "Yes") 
                        : "";

    if (node.type === 'parallel') {
      const splitId = `${node.id}_split`;
      const joinId = `${node.id}_join`;
      const parts = node.name.split(/ and | & /).map(p => p.trim());
      
      // Gateways
      processContent += `    <bpmn:parallelGateway id="${splitId}" name="Split" />\n`;
      processContent += `    <bpmn:parallelGateway id="${joinId}" name="Join" />\n`;
      
      // Shapes for Gateways
      diagramContent += `
        <bpmndi:BPMNShape id="${splitId}_di" bpmnElement="${splitId}">
          <dc:Bounds x="${currentX}" y="${Y_MAIN - 25}" width="${GATEWAY_SIZE}" height="${GATEWAY_SIZE}" />
        </bpmndi:BPMNShape>
        <bpmndi:BPMNShape id="${joinId}_di" bpmnElement="${joinId}">
          <dc:Bounds x="${currentX + 250}" y="${Y_MAIN - 25}" width="${GATEWAY_SIZE}" height="${GATEWAY_SIZE}" />
        </bpmndi:BPMNShape>`;

      // Flow from Previous to Split
      const prevPos = positions[lastNodeId];
      flowContent += `    <bpmn:sequenceFlow id="${flowId}" sourceRef="${lastNodeId}" targetRef="${splitId}" />\n`;
      diagramContent += `
        <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
          <di:waypoint x="${prevPos.x + (prevPos.w || 0)}" y="${prevPos.y}" />
          <di:waypoint x="${currentX}" y="${Y_MAIN}" />
        </bpmndi:BPMNEdge>`;

      // Branches
      parts.forEach((branchName, bIdx) => {
        const branchTaskId = `${node.id}_B${bIdx}`;
        const branchY = bIdx === 0 ? Y_UP : Y_DOWN;
        
        processContent += `    <bpmn:task id="${branchTaskId}" name="${escapeXml(branchName)}" />\n`;
        flowContent += `    <bpmn:sequenceFlow id="Flow_${splitId}_B${bIdx}" sourceRef="${splitId}" targetRef="${branchTaskId}" />\n`;
        flowContent += `    <bpmn:sequenceFlow id="Flow_B${bIdx}_${joinId}" sourceRef="${branchTaskId}" targetRef="${joinId}" />\n`;

        diagramContent += `
          <bpmndi:BPMNShape id="${branchTaskId}_di" bpmnElement="${branchTaskId}">
            <dc:Bounds x="${currentX + 75}" y="${branchY - 40}" width="${TASK_W}" height="${TASK_H}" />
          </bpmndi:BPMNShape>
          <bpmndi:BPMNEdge id="Flow_${splitId}_B${bIdx}_di" bpmnElement="Flow_${splitId}_B${bIdx}">
            <di:waypoint x="${currentX + 50}" y="${Y_MAIN}" />
            <di:waypoint x="${currentX + 50}" y="${branchY}" />
            <di:waypoint x="${currentX + 75}" y="${branchY}" />
          </bpmndi:BPMNEdge>
          <bpmndi:BPMNEdge id="Flow_B${bIdx}_${joinId}_di" bpmnElement="Flow_B${bIdx}_${joinId}">
            <di:waypoint x="${currentX + 75 + TASK_W}" y="${branchY}" />
            <di:waypoint x="${currentX + 200}" y="${branchY}" />
            <di:waypoint x="${currentX + 200}" y="${Y_MAIN}" />
            <di:waypoint x="${currentX + 250}" y="${Y_MAIN}" />
          </bpmndi:BPMNEdge>`;
      });

      positions[joinId] = { x: currentX + 250, y: Y_MAIN, w: GATEWAY_SIZE, h: GATEWAY_SIZE };
      lastNodeId = joinId;
      currentX += 350;

    } else if (node.type === 'timer') {
      processContent += `    <bpmn:intermediateCatchEvent id="${node.id}" name="${escapeXml(node.name)}">\n`;
      processContent += `      <bpmn:timerEventDefinition id="Timer_${node.id}" />\n`;
      processContent += `    </bpmn:intermediateCatchEvent>\n`;

      diagramContent += `
        <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
          <dc:Bounds x="${currentX}" y="${Y_MAIN - 18}" width="${EVENT_SIZE}" height="${EVENT_SIZE}" />
          <bpmndi:BPMNLabel>
            <dc:Bounds x="${currentX - 10}" y="${Y_MAIN + 23}" width="56" height="14" />
          </bpmndi:BPMNLabel>
        </bpmndi:BPMNShape>`;

      const prevPos = positions[lastNodeId];
      flowContent += `    <bpmn:sequenceFlow id="${flowId}" sourceRef="${lastNodeId}" targetRef="${node.id}" />\n`;
      diagramContent += `
        <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
          <di:waypoint x="${prevPos.x + (prevPos.w || 0)}" y="${prevPos.y}" />
          <di:waypoint x="${currentX}" y="${Y_MAIN}" />
        </bpmndi:BPMNEdge>`;

      positions[node.id] = { x: currentX, y: Y_MAIN, w: EVENT_SIZE, h: EVENT_SIZE };
      lastNodeId = node.id;
      currentX += 100;

    } else {
      const type = node.type === 'gateway' ? 'bpmn:exclusiveGateway' : 'bpmn:task';
      const nodeY = node.isNegative ? Y_NEG : Y_MAIN;
      const w = node.type === 'gateway' ? GATEWAY_SIZE : TASK_W;
      const h = node.type === 'gateway' ? GATEWAY_SIZE : TASK_H;
      const renderY = nodeY - (h / 2);

      processContent += `    <${type} id="${node.id}" name="${escapeXml(node.name)}" />\n`;
      
      diagramContent += `
        <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}" isMarkerVisible="true">
          <dc:Bounds x="${currentX}" y="${renderY}" width="${w}" height="${h}" />
          <bpmndi:BPMNLabel>
            <dc:Bounds x="${currentX}" y="${renderY + h + 5}" width="${w}" height="14" />
          </bpmndi:BPMNLabel>
        </bpmndi:BPMNShape>`;

      const prevPos = positions[lastNodeId];
      flowContent += `    <bpmn:sequenceFlow id="${flowId}" ${flowLabel ? `name="${flowLabel}"` : ''} sourceRef="${lastNodeId}" targetRef="${node.id}" />\n`;
      
      diagramContent += `
        <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
          <di:waypoint x="${prevPos.x + (prevPos.w || 0)}" y="${prevPos.y}" />
          <di:waypoint x="${currentX}" y="${nodeY}" />
          ${flowLabel ? `
          <bpmndi:BPMNLabel>
            <dc:Bounds x="${prevPos.x + 30}" y="${prevPos.y - 15}" width="20" height="14" />
          </bpmndi:BPMNLabel>` : ''}
        </bpmndi:BPMNEdge>`;

      if (node.isNegative) {
        const endNegId = `End_Neg_${node.id}`;
        processContent += `    <bpmn:endEvent id="${endNegId}" name="Rejected" />\n`;
        flowContent += `    <bpmn:sequenceFlow id="Flow_End_${node.id}" sourceRef="${node.id}" targetRef="${endNegId}" />\n`;
        diagramContent += `
          <bpmndi:BPMNShape id="${endNegId}_di" bpmnElement="${endNegId}">
            <dc:Bounds x="${currentX + w + 60}" y="${Y_NEG - 18}" width="36" height="36" />
          </bpmndi:BPMNShape>
          <bpmndi:BPMNEdge id="Flow_End_${node.id}_di" bpmnElement="Flow_End_${node.id}">
            <di:waypoint x="${currentX + w}" y="${Y_NEG}" />
            <di:waypoint x="${currentX + w + 60}" y="${Y_NEG}" />
          </bpmndi:BPMNEdge>`;
      }

      positions[node.id] = { x: currentX, y: nodeY, w, h };
      if (!node.isNegative) lastNodeId = node.id;
      currentX += w + STEP_X;
    }
  });

  // Final End
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

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                  targetNamespace="http://bpmn.io/schema/bpmn"
                  exporter="BPMN FlowForge" exporterVersion="1.8">
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
