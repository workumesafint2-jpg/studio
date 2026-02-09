export function generateBPMN(input: string, title: string = "Process Diagram"): string {
  if (!input.trim()) return '';

  const rawLines = input.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  const mappings = {
    start: ['መጀመሪያ', 'ጀምር', 'start', 'begin'],
    end: ['መጨረሻ', 'ጨርስ', 'ተጠናቀቀ', 'end', 'finish'],
    timer: ['ቆይታ', 'ሰዓት', 'ቀን', 'timer', 'wait'],
    userTask: ['ተግባር', 'ይመረምራል', 'ይፈጸማል', 'ይከናወናል', 'ይደረጋል', 'ባለሙያ', 'human', 'user task', 'userAction'],
    serviceTask: ['ሲስተም', 'አውቶማቲክ', 'service task', 'service', 'system', 'auto', 'script'],
    manualTask: ['በእጅ', 'ፊዚካል', 'manual task', 'manual'],
    exclusiveGateway: ['ውሳኔ', 'ከሆነ', 'ወይስ', 'ቢሆን', 'decision', 'xor', 'if'],
    parallelGateway: ['በአንድ ጊዜ', 'እና', 'ትይዩ', 'parallel', 'and', '+'],
    dataKeywords: ['ሰነድ', 'ፎርም', 'ማስረጃ', 'ደረሰኝ', 'document', 'form', 'data object'],
    error: ['error', 'ስህተት', 'ተቋረጠ'],
    reject: ['ውድቅ', 'reject', 'cancel', 'አልተቀበለም']
  };

  const flowDirectionTriggers = {
    forward: ['ከጸደቀ', 'approve', 'yes', 'ok', 'if yes'],
    loop: ['ካልጸደቀ', 'ካልሆነ', 'correction', 'fix', 'edit', 'back', 'return', 'ተመለስ', 'አስተካክል', 'if no back'],
    reject: ['ውድቅ', 'reject', 'no', 'cancel', 'አልተቀበለም', 'if no exit']
  };

  const nodeDefs: any[] = [];
  const backFlows: any[] = [];
  let lastUserTaskId: string | null = null;

  // PASS 1: Identify Nodes and Data Associations
  rawLines.forEach((line, index) => {
    const lowerLine = line.toLowerCase();
    
    const isStrictLoop = flowDirectionTriggers.loop.some(t => lowerLine.includes(t));
    const isStrictReject = flowDirectionTriggers.reject.some(t => lowerLine.includes(t));

    if (isStrictLoop && nodeDefs.length > 0) {
      const sourceId = nodeDefs[nodeDefs.length - 1].id;
      const targetId = lastUserTaskId || (nodeDefs.length > 1 ? nodeDefs[nodeDefs.length - 2].id : nodeDefs[0].id);
      backFlows.push({
        id: `Flow_Back_${index}`,
        sourceRef: sourceId,
        targetRef: targetId,
        name: 'ካልጸደቀ',
        direction: 'loop'
      });
      return;
    }

    if (isStrictReject && nodeDefs.length > 0) {
      const sourceId = nodeDefs[nodeDefs.length - 1].id;
      const rejectEndId = `Reject_End_${index}`;
      nodeDefs.push({
        id: rejectEndId,
        name: '', 
        type: 'endEvent',
        category: 'event',
        isReject: true
      });
      backFlows.push({
        id: `Flow_Reject_${index}`,
        sourceRef: sourceId,
        targetRef: rejectEndId,
        name: 'Reject',
        direction: 'reject'
      });
      return;
    }

    let type = 'userTask';
    let category = 'task';
    let hasDataAssociation = false;
    let dataLabel = "ሰነድ";

    if (mappings.dataKeywords.some(k => lowerLine.includes(k))) {
      hasDataAssociation = true;
      const foundKeyword = mappings.dataKeywords.find(k => lowerLine.includes(k));
      if (foundKeyword) dataLabel = foundKeyword;
    }
    
    if (mappings.start.some(k => lowerLine.includes(k))) { type = 'startEvent'; category = 'event'; }
    else if (mappings.end.some(k => lowerLine.includes(k))) { type = 'endEvent'; category = 'event'; }
    else if (mappings.timer.some(k => lowerLine.includes(k))) { type = 'timerEvent'; category = 'event'; }
    else if (mappings.exclusiveGateway.some(k => lowerLine.includes(k))) { type = 'exclusiveGateway'; category = 'gateway'; }
    else if (mappings.parallelGateway.some(k => lowerLine.includes(k))) { type = 'parallelGateway'; category = 'gateway'; }
    else if (mappings.serviceTask.some(k => lowerLine.includes(k))) { type = 'serviceTask'; category = 'task'; }
    else if (mappings.manualTask.some(k => lowerLine.includes(k))) { type = 'manualTask'; category = 'task'; }

    let pureName = line;
    const allTriggers = [
      ...Object.values(mappings).flat(),
      ...Object.values(flowDirectionTriggers).flat(),
      'success', 'failed', 'done'
    ];

    allTriggers.forEach(k => {
      const escapedK = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`^${escapedK}\\s*[:\\-–—\\s]*|\\s*\\(${escapedK}\\)|\\b${escapedK}\\b`, 'gi');
      pureName = pureName.replace(regex, '');
    });
    pureName = pureName.replace(/[?፧？]$/, '').trim();

    if (category === 'event' || category === 'gateway') {
      if (mappings.start.some(k => k === pureName.toLowerCase()) || 
          mappings.end.some(k => k === pureName.toLowerCase()) ||
          mappings.exclusiveGateway.some(k => k === pureName.toLowerCase())) {
        pureName = "";
      }
    }

    const nodeId = `Node_${index}`;
    nodeDefs.push({
      id: nodeId,
      name: pureName,
      type,
      category,
      index,
      hasDataAssociation,
      dataLabel
    });

    if (type === 'userTask') {
      lastUserTaskId = nodeId;
    }
  });

  const elements: string[] = [];
  const flows: string[] = [];
  const diElements: string[] = [];
  const positions: Record<string, { x: number, y: number, w: number, h: number, row: number }> = {};

  // Layout Constants
  const MAX_COLS = 4;
  const COL_SPACING = 350; // High clearance
  const ROW_SPACING = 300;
  const X_START = 200;
  const Y_START = 200;

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

    positions[node.id] = { x, y, w, h, row };
    const escapedName = escapeXml(node.name);

    switch (node.type) {
      case 'startEvent': elements.push(`<bpmn:startEvent id="${node.id}" name="${escapedName}" />`); break;
      case 'endEvent': 
        if (node.isReject) {
          elements.push(`<bpmn:endEvent id="${node.id}" name="Rejection"><bpmn:cancelEventDefinition id="Cancel_${node.id}" /></bpmn:endEvent>`);
        } else {
          elements.push(`<bpmn:endEvent id="${node.id}" name="${escapedName}" />`); 
        }
        break;
      case 'timerEvent': elements.push(`<bpmn:intermediateCatchEvent id="${node.id}" name="${escapedName}"><bpmn:timerEventDefinition id="T_${node.id}" /></bpmn:intermediateCatchEvent>`); break;
      case 'exclusiveGateway': elements.push(`<bpmn:exclusiveGateway id="${node.id}" name="${escapedName}" isMarkerVisible="true" />`); break;
      case 'parallelGateway': elements.push(`<bpmn:parallelGateway id="${node.id}" name="${escapedName}" />`); break;
      case 'serviceTask': elements.push(`<bpmn:serviceTask id="${node.id}" name="${escapedName}" />`); break;
      case 'manualTask': elements.push(`<bpmn:manualTask id="${node.id}" name="${escapedName}" />`); break;
      default: elements.push(`<bpmn:userTask id="${node.id}" name="${escapedName}" />`);
    }

    if (node.hasDataAssociation) {
      const dataId = `DataObj_${node.id}`;
      const assocId = `Assoc_${node.id}`;
      const dataX = x;
      const dataY = y - 110; 
      const dataW = 36, dataH = 50;

      elements.push(`<bpmn:dataObjectReference id="${dataId}" name="${escapeXml(node.dataLabel)}" dataObjectRef="DO_Ref_${node.id}" />`);
      elements.push(`<bpmn:dataObject id="DO_Ref_${node.id}" />`);
      elements.push(`<bpmn:association id="${assocId}" sourceRef="${dataId}" targetRef="${node.id}" />`);

      diElements.push(`
        <bpmndi:BPMNShape id="${dataId}_di" bpmnElement="${dataId}">
          <dc:Bounds x="${dataX - dataW/2}" y="${dataY - dataH/2}" width="${dataW}" height="${dataH}" />
        </bpmndi:BPMNShape>
        <bpmndi:BPMNEdge id="${assocId}_di" bpmnElement="${assocId}">
          <di:waypoint x="${dataX}" y="${dataY + dataH/2}" />
          <di:waypoint x="${x}" y="${y - h/2}" />
        </bpmndi:BPMNEdge>`);
    }

    diElements.push(`
      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}" ${node.type === 'exclusiveGateway' ? 'isMarkerVisible="true"' : ''}>
        <dc:Bounds x="${x - w/2}" y="${y - h/2}" width="${w}" height="${h}" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${x - 60}" y="${y + h/2 + 5}" width="120" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>`);

    // PASS 2: Sequence Flow Calculation with Orthogonal Waypoints
    if (i > 0 && !node.isReject) {
      const prev = nodeDefs[i - 1];
      if (!prev.isReject) {
        const flowId = `Flow_${prev.id}_${node.id}`;
        const label = (prev.type === 'exclusiveGateway') ? 'ከጸደቀ' : '';
        flows.push(`<bpmn:sequenceFlow id="${flowId}" name="${label}" sourceRef="${prev.id}" targetRef="${node.id}" />`);
        
        const s = positions[prev.id];
        const t = positions[node.id];
        if (s && t) {
          const isForwardInRow = s.row === t.row;
          const isEvenRow = s.row % 2 === 0;

          let waypoints: {x: number, y: number}[] = [];

          if (isForwardInRow) {
            // Straight Orthogonal Connection
            const exitX = isEvenRow ? s.x + s.w/2 : s.x - s.w/2;
            const entryX = isEvenRow ? t.x - t.w/2 : t.x + t.w/2;
            waypoints = [
              { x: exitX, y: s.y },
              { x: entryX, y: t.y }
            ];
          } else {
            // Manhattan Routing between rows to avoid collisions
            const midY = (s.y + t.y) / 2;
            waypoints = [
              { x: s.x, y: s.y + s.h / 2 },
              { x: s.x, y: midY },
              { x: t.x, y: midY },
              { x: t.x, y: t.y - t.h / 2 }
            ];
          }

          diElements.push(`
            <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
              ${waypoints.map(w => `<di:waypoint x="${w.x}" y="${w.y}" />`).join('\n')}
              <bpmndi:BPMNLabel>
                <dc:Bounds x="${(s.x + t.x) / 2 - 25}" y="${waypoints[waypoints.length-1].y - 20}" width="50" height="14" />
              </bpmndi:BPMNLabel>
            </bpmndi:BPMNEdge>`);
        }
      }
    }
  });

  // Loop-Back Routing with -80 Clear Height
  backFlows.forEach(f => {
    flows.push(`<bpmn:sequenceFlow id="${f.id}" name="${escapeXml(f.name)}" sourceRef="${f.sourceRef}" targetRef="${f.targetRef}" />`);
    const s = positions[f.sourceRef];
    const t = positions[f.targetRef];
    if (s && t) {
      if (f.direction === 'loop') {
        // High-Clearance Manhattan Routing
        const clearY = s.y - s.h/2 - 80; 
        diElements.push(`
          <bpmndi:BPMNEdge id="${f.id}_di" bpmnElement="${f.id}">
            <di:waypoint x="${s.x}" y="${s.y - s.h/2}" />
            <di:waypoint x="${s.x}" y="${clearY}" />
            <di:waypoint x="${t.x}" y="${clearY}" />
            <di:waypoint x="${t.x}" y="${t.y - t.h/2}" />
            <bpmndi:BPMNLabel>
              <dc:Bounds x="${(s.x + t.x) / 2 - 25}" y="${clearY - 20}" width="50" height="14" />
            </bpmndi:BPMNLabel>
          </bpmndi:BPMNEdge>`);
      } else if (f.direction === 'reject') {
        // Downward Orthogonal Routing
        diElements.push(`
          <bpmndi:BPMNEdge id="${f.id}_di" bpmnElement="${f.id}">
            <di:waypoint x="${s.x}" y="${s.y + s.h/2}" />
            <di:waypoint x="${s.x}" y="${t.y - t.h/2}" />
            <bpmndi:BPMNLabel>
              <dc:Bounds x="${s.x + 10}" y="${(s.y + t.y) / 2}" width="50" height="14" />
            </bpmndi:BPMNLabel>
          </bpmndi:BPMNEdge>`);
      }
    }
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                  targetNamespace="http://bpmn.io/schema/bpmn"
                  exporter="Worku (ወርቁ) Pro Architect" 
                  exporterVersion="12.0">
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