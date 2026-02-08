export function generateBPMN(input: string, title: string = "Process Diagram"): string {
  if (!input.trim()) return '';

  const rawLines = input.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
  
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
    loop: ['ካልጸደቀ', 'ካልሆነ', 'correction', 'fix', 'edit', 'back', 'return', 'ተመለስ', 'አስተካክል'],
    reject: ['ውድቅ', 'reject', 'no', 'cancel', 'አልተቀበለም']
  };

  const nodeDefs: any[] = [];
  const backFlows: any[] = [];
  let lastUserTaskId: string | null = null;

  // PASS 1: Identify Nodes vs. Backflows
  rawLines.forEach((line, index) => {
    const lowerLine = line.toLowerCase();
    
    // Check if this line is purely a loop command (e.g., "ካልጸደቀ" or "Back")
    const isStrictLoop = flowDirectionTriggers.loop.some(t => lowerLine === t || lowerLine.startsWith(t + ' '));
    const isStrictReject = flowDirectionTriggers.reject.some(t => lowerLine === t || lowerLine.startsWith(t + ' '));

    if ((isStrictLoop || isStrictReject) && nodeDefs.length > 0) {
      const sourceId = nodeDefs[nodeDefs.length - 1].id;
      // Connect back to the previous task or the one before that
      const targetId = lastUserTaskId || sourceId;
      
      backFlows.push({
        id: `Flow_Back_${index}`,
        sourceRef: sourceId,
        targetRef: targetId,
        name: isStrictLoop ? (lowerLine.includes('ካልጸደቀ') ? 'ካልጸደቀ' : 'ካልሆነ') : 'Reject',
        direction: isStrictLoop ? 'loop' : 'reject'
      });
      return; // DO NOT create a box for these commands
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

    // TEXT SANITIZATION: Remove trigger keywords and junk status words from the label
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
      lastUserTaskId = nodeId;
    }
  });

  const elements: string[] = [];
  const flows: string[] = [];
  const diElements: string[] = [];
  const positions: Record<string, { x: number, y: number, w: number, h: number, row: number, col: number }> = {};

  const MAX_COLS = 5;
  const COL_SPACING = 240;
  const ROW_SPACING = 260;
  const X_START = 150;
  const Y_START = 200;

  // PASS 2: Layout XML and DI
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

    if (i > 0) {
      const prev = nodeDefs[i - 1];
      const flowId = `Flow_${prev.id}_${node.id}`;
      // Clean arrow labeling: If the previous node was a gateway, we check for 'if yes' context
      const label = (prev.type === 'exclusiveGateway') ? 'ከጸደቀ' : '';
      flows.push(`<bpmn:sequenceFlow id="${flowId}" name="${label}" sourceRef="${prev.id}" targetRef="${node.id}" />`);
      
      const sPos = positions[prev.id];
      const isForward = sPos.row === row;

      if (isForward) {
        const isRight = (sPos.row % 2 === 0);
        diElements.push(`
          <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
            <di:waypoint x="${sPos.x + (sPos.w / 2 * (isRight ? 1 : -1))}" y="${sPos.y}" />
            <di:waypoint x="${x - (w / 2 * (isRight ? 1 : -1))}" y="${y}" />
            <bpmndi:BPMNLabel>
              <dc:Bounds x="${(sPos.x + x) / 2 - 25}" y="${y - 20}" width="50" height="14" />
            </bpmndi:BPMNLabel>
          </bpmndi:BPMNEdge>`);
      } else {
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

  // PASS 3: Render Back-flows (Loop-back connections)
  backFlows.forEach(f => {
    flows.push(`<bpmn:sequenceFlow id="${f.id}" name="${escapeXml(f.name)}" sourceRef="${f.sourceRef}" targetRef="${f.targetRef}" />`);
    const sPos = positions[f.sourceRef];
    const tPos = positions[f.targetRef];

    if (sPos && tPos) {
      const offset = f.direction === 'loop' ? -100 : 100;
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
                  exporterVersion="9.0">
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
