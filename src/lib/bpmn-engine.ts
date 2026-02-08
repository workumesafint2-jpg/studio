export function generateBPMN(input: string, title: string = "Process Diagram"): string {
  if (!input.trim()) return '';

  const rawLines = input.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  // BPMN 2.0 Trigger Mapping (Amharic & English)
  const mappings = {
    start: ['መጀመሪያ', 'ጀምር', 'start', 'begin'],
    end: ['መጨረሻ', 'ጨርስ', 'ተጠናቀቀ', 'end', 'finish'],
    timer: ['ቆይታ', 'ሰዓት', 'ቀን', 'timer', 'wait'],
    userTask: ['ተግባር', 'ይመረምራል', 'ይፈጸማል', 'ይከናወናል', 'ይደረጋል', 'approve', 'review', 'verify', 'user'],
    exclusiveGateway: ['ውሳኔ', 'ከሆነ', 'ወይስ', 'ቢሆን', 'decision', 'xor', 'if'],
    serviceTask: ['በሲስተም', 'አውቶማቲክ', 'service', 'system', 'auto', 'script'],
    manualTask: ['በእጅ', 'ፊዚካል', 'manual'],
    dataObject: ['ሰነድ', 'ፎርም', 'ማስረጃ', 'ደረሰኝ', 'document', 'form'],
    parallelGateway: ['በአንድ ጊዜ', 'እና', 'ትይዩ', 'parallel', 'and'],
  };

  const flowDirectionTriggers = {
    forward: ['ከጸደቀ', 'approve', 'yes', 'ok'],
    loop: ['ካልጸደቀ', 'ካልሆነ', 'correction', 'fix', 'edit'],
    reject: ['ውድቅ', 'reject', 'no', 'cancel']
  };

  const nodeDefs: any[] = [];
  const backFlows: any[] = [];
  let lastUserTaskId: string | null = null;
  let secondToLastUserTaskId: string | null = null;

  // PASS 1: Generate Node Definitions
  rawLines.forEach((line, index) => {
    const lowerLine = line.toLowerCase();
    
    // Rule 1: Fix 'Back-loop' Logic
    // If input is strictly a loop command, don't create a node. Record a backflow instead.
    const isStrictLoop = flowDirectionTriggers.loop.some(t => lowerLine === t || lowerLine.startsWith(t + ' '));
    const isStrictReject = flowDirectionTriggers.reject.some(t => lowerLine === t || lowerLine.startsWith(t + ' '));

    if ((isStrictLoop || isStrictReject) && nodeDefs.length > 0) {
      const sourceId = nodeDefs[nodeDefs.length - 1].id;
      const targetId = lastUserTaskId || sourceId; // Default to self-loop if no prior task found
      
      backFlows.push({
        id: `Flow_Back_${index}`,
        sourceRef: sourceId,
        targetRef: targetId,
        name: isStrictLoop ? 'ካልጸደቀ' : 'Reject',
        direction: isStrictLoop ? 'loop' : 'reject'
      });
      return; // Skip node creation for this command line
    }

    let type = 'userTask';
    let category = 'task';
    
    if (mappings.start.some(k => lowerLine.includes(k))) { type = 'startEvent'; category = 'event'; }
    else if (mappings.end.some(k => lowerLine.includes(k))) { type = 'endEvent'; category = 'event'; }
    else if (mappings.timer.some(k => lowerLine.includes(k))) { type = 'timerEvent'; category = 'event'; }
    else if (mappings.exclusiveGateway.some(k => lowerLine.includes(k))) { type = 'exclusiveGateway'; category = 'gateway'; }
    else if (mappings.parallelGateway.some(k => lowerLine.includes(k))) { type = 'parallelGateway'; category = 'gateway'; }
    else if (mappings.dataObject.some(k => lowerLine.includes(k))) { type = 'dataObject'; category = 'data'; }
    else if (mappings.serviceTask.some(k => lowerLine.includes(k))) { type = 'serviceTask'; category = 'task'; }
    else if (mappings.manualTask.some(k => lowerLine.includes(k))) { type = 'manualTask'; category = 'task'; }

    // Rule 3: CLEAN Visual Labels
    // Strip trigger words and technical junk from visible names
    let pureName = line;
    const allTriggers = [
      ...Object.values(mappings).flat(),
      ...Object.values(flowDirectionTriggers).flat(),
      'success', 'failed', 'done', 'ተሳክቷል'
    ];

    allTriggers.forEach(k => {
      const regex = new RegExp(`^${k}\\s*[:\\-–—\\s]*|\\s*\\(${k}\\)`, 'gi');
      pureName = pureName.replace(regex, '');
    });
    pureName = pureName.replace(/[?፧？]$/, '').trim();

    const nodeId = `Node_${index}`;
    nodeDefs.push({
      id: nodeId,
      name: pureName || line,
      type,
      category,
      index
    });

    if (type === 'userTask') {
      secondToLastUserTaskId = lastUserTaskId;
      lastUserTaskId = nodeId;
    }
  });

  // Rule 2: FIX 'Data Object' Sequence
  // Ensure DataObjectReference is never the first element after a StartEvent.
  if (nodeDefs.length > 2 && nodeDefs[0].type === 'startEvent' && nodeDefs[1].type === 'dataObject') {
    const firstTaskIdx = nodeDefs.findIndex(n => n.category === 'task');
    if (firstTaskIdx !== -1) {
      const dataObjNode = nodeDefs.splice(1, 1)[0];
      nodeDefs.splice(firstTaskIdx, 0, dataObjNode); // Move Data Object after the first task
    }
  }

  const elements: string[] = [];
  const flows: string[] = [];
  const diElements: string[] = [];
  const positions: Record<string, { x: number, y: number, w: number, h: number, row: number, col: number }> = {};

  const MAX_COLS = 5;
  const COL_SPACING = 240;
  const ROW_SPACING = 260;
  const X_START = 150;
  const Y_START = 200;

  // PASS 2: Generate XML and DI
  nodeDefs.forEach((node, i) => {
    const row = Math.floor(i / MAX_COLS);
    const rawCol = i % MAX_COLS;
    const isEvenRow = row % 2 === 0;
    const col = isEvenRow ? rawCol : (MAX_COLS - 1 - rawCol);

    const x = X_START + col * COL_SPACING;
    const y = Y_START + row * ROW_SPACING;
    
    let w = 120, h = 80;
    if (node.category === 'event') { w = 36; h = 36; }
    else if (node.category === 'gateway') { w = 50; h = 50; }
    else if (node.category === 'data') { w = 40; h = 60; }

    positions[node.id] = { x, y, w, h, row, col };

    // BPMN 2.0 XML Definitions
    switch (node.type) {
      case 'startEvent': elements.push(`<bpmn:startEvent id="${node.id}" name="${escapeXml(node.name)}" />`); break;
      case 'endEvent': elements.push(`<bpmn:endEvent id="${node.id}" name="${escapeXml(node.name)}" />`); break;
      case 'timerEvent': elements.push(`<bpmn:intermediateCatchEvent id="${node.id}" name="${escapeXml(node.name)}"><bpmn:timerEventDefinition id="T_${node.id}" /></bpmn:intermediateCatchEvent>`); break;
      case 'exclusiveGateway': elements.push(`<bpmn:exclusiveGateway id="${node.id}" name="${escapeXml(node.name)}" isMarkerVisible="true" />`); break;
      case 'parallelGateway': elements.push(`<bpmn:parallelGateway id="${node.id}" name="${escapeXml(node.name)}" />`); break;
      case 'serviceTask': elements.push(`<bpmn:serviceTask id="${node.id}" name="${escapeXml(node.name)}" />`); break;
      case 'manualTask': elements.push(`<bpmn:manualTask id="${node.id}" name="${escapeXml(node.name)}" />`); break;
      case 'dataObject': elements.push(`<bpmn:dataObjectReference id="${node.id}" name="${escapeXml(node.name)}" dataObjectRef="DO_${node.id}" /><bpmn:dataObject id="DO_${node.id}" />`); break;
      default: elements.push(`<bpmn:userTask id="${node.id}" name="${escapeXml(node.name)}" />`);
    }

    diElements.push(`
      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}" ${node.type === 'exclusiveGateway' ? 'isMarkerVisible="true"' : ''}>
        <dc:Bounds x="${x - w/2}" y="${y - h/2}" width="${w}" height="${h}" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${x - 60}" y="${y + h/2 + 5}" width="120" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>`);

    // Main Sequence Flows
    if (i > 0) {
      const prev = nodeDefs[i - 1];
      const flowId = `Flow_${prev.id}_${node.id}`;
      flows.push(`<bpmn:sequenceFlow id="${flowId}" sourceRef="${prev.id}" targetRef="${node.id}" />`);
      
      const sPos = positions[prev.id];
      const isForward = sPos.row === row;

      if (isForward) {
        const isRight = (sPos.row % 2 === 0);
        diElements.push(`
          <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
            <di:waypoint x="${sPos.x + (sPos.w / 2 * (isRight ? 1 : -1))}" y="${sPos.y}" />
            <di:waypoint x="${x - (w / 2 * (isRight ? 1 : -1))}" y="${y}" />
          </bpmndi:BPMNEdge>`);
      } else {
        // Vertical Wrap (Snake)
        diElements.push(`
          <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
            <di:waypoint x="${sPos.x}" y="${sPos.y + sPos.h / 2}" />
            <di:waypoint x="${sPos.x}" y="${y - h / 2 - 40}" />
            <di:waypoint x="${x}" y="${y - h / 2 - 40}" />
            <di:waypoint x="${x}" y="${y - h / 2}" />
          </bpmndi:BPMNEdge>`);
      }
    }
  });

  // PASS 3: Render Back-flows (Loops)
  backFlows.forEach(f => {
    flows.push(`<bpmn:sequenceFlow id="${f.id}" name="${escapeXml(f.name)}" sourceRef="${f.sourceRef}" targetRef="${f.targetRef}" />`);
    const sPos = positions[f.sourceRef];
    const tPos = positions[f.targetRef];

    if (sPos && tPos) {
      const offset = f.direction === 'loop' ? -80 : 80;
      diElements.push(`
        <bpmndi:BPMNEdge id="${f.id}_di" bpmnElement="${f.id}">
          <di:waypoint x="${sPos.x}" y="${sPos.y + (sPos.h / 2 * (offset > 0 ? 1 : -1))}" />
          <di:waypoint x="${sPos.x}" y="${sPos.y + offset}" />
          <di:waypoint x="${tPos.x}" y="${sPos.y + offset}" />
          <di:waypoint x="${tPos.x}" y="${tPos.y + (tPos.h / 2 * (offset > 0 ? 1 : -1))}" />
          <bpmndi:BPMNLabel>
            <dc:Bounds x="${(sPos.x + tPos.x) / 2 - 25}" y="${sPos.y + offset - 20}" width="50" height="14" />
          </bpmndi:BPMNLabel>
        </bpmndi:BPMNEdge>`);
    }
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                  targetNamespace="http://bpmn.io/schema/bpmn"
                  exporter="Worku (ወርቁ) Pro Architect" 
                  exporterVersion="8.5">
  <bpmn:process id="Process_Worku_Pro" name="${escapeXml(title)}" isExecutable="true">
${elements.join('\n')}
${flows.join('\n')}
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_Worku_Pro">
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
