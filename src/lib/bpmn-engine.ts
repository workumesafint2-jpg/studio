export function generateBPMN(input: string, title: string = "Process Diagram"): string {
  if (!input.trim()) return '';

  const rawLines = input.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  const mappings = {
    start: ['መጀመሪያ', 'ጀምር', 'start', 'begin'],
    end: ['መጨረሻ', 'ጨርስ', 'ተጠናቀቀ', 'end', 'finish', 'success', 'done'],
    timer: ['ቆይታ', 'ሰዓት', 'timer', 'wait'],
    userTask: ['ባለሙያ', 'human', 'user task', 'ተግባር', 'action', 'ማከናወን'],
    serviceTask: ['ሲስተም', 'አውቶማቲክ', 'service task', 'system', 'auto', 'gear'],
    manualTask: ['በእጅ', 'ፊዚካል', 'manual task', 'physical'],
    scriptTask: ['ስክሪፕት', 'ኮድ', 'script task', 'code'],
    exclusiveGateway: ['ውሳኔ', 'ከሆነ', 'ወይስ', 'ቢሆን', 'decision', 'xor', 'if', 'gateway'],
    parallelGateway: ['በአንድ ጊዜ', 'እና', 'ትይዩ', 'parallel', 'and', 'simultaneous'],
    dataKeywords: ['ሰነድ', 'ፎርም', 'ማስረጃ', 'ደረሰኝ', 'document', 'form', 'file'],
    error: ['error', 'ስህተት', 'lightning'],
    reject: ['ውድቅ', 'reject', 'cancel', 'አልተቀበለም', 'no', 'ካልጸደቀ', 'ሰርዝ']
  };

  function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  const nodeDefs: any[] = [];
  const backFlows: any[] = [];
  let lastUserTaskId: string | null = null;
  let startTextToMove = "";

  // PASS 1: Identify Nodes
  rawLines.forEach((line, index) => {
    const lowerLine = line.toLowerCase();
    
    // Detect Back/Loop triggers
    const isLoop = ['ተመለስ', 'back', 'correction', 'fix', 'edit', 'ካልጸደቀ'].some(t => lowerLine.includes(t));
    if (isLoop && nodeDefs.length > 0) {
      const sourceId = nodeDefs[nodeDefs.length - 1].id;
      const targetId = lastUserTaskId || (nodeDefs.length > 1 ? nodeDefs[nodeDefs.length - 2].id : nodeDefs[0].id);
      backFlows.push({
        id: `Flow_Back_${index}`,
        sourceRef: sourceId,
        targetRef: targetId,
        name: lowerLine.includes('ካልጸደቀ') ? 'ካልጸደቀ' : 'ተመለስ',
        type: 'loop'
      });
      return;
    }

    let type = 'userTask';
    let category = 'task';
    let hasDataAssociation = false;
    let dataLabel = "ሰነድ";
    let isBoundaryError = false;

    if (mappings.dataKeywords.some(k => lowerLine.includes(k))) {
      hasDataAssociation = true;
      dataLabel = mappings.dataKeywords.find(k => lowerLine.includes(k)) || "ሰነድ";
    }

    if (mappings.error.some(k => lowerLine.includes(k)) && nodeDefs.length > 0) isBoundaryError = true;
    
    if (mappings.start.some(k => lowerLine.includes(k))) { type = 'startEvent'; category = 'event'; }
    else if (mappings.end.some(k => lowerLine.includes(k))) { type = 'endEvent'; category = 'event'; }
    else if (mappings.timer.some(k => lowerLine.includes(k))) { type = 'timerEvent'; category = 'event'; }
    else if (mappings.exclusiveGateway.some(k => lowerLine.includes(k))) { type = 'exclusiveGateway'; category = 'gateway'; }
    else if (mappings.parallelGateway.some(k => lowerLine.includes(k))) { type = 'parallelGateway'; category = 'gateway'; }
    else if (mappings.serviceTask.some(k => lowerLine.includes(k))) { type = 'serviceTask'; category = 'task'; }
    else if (mappings.manualTask.some(k => lowerLine.includes(k))) { type = 'manualTask'; category = 'task'; }
    else if (mappings.scriptTask.some(k => lowerLine.includes(k))) { type = 'scriptTask'; category = 'task'; }
    else if (mappings.reject.some(k => lowerLine.includes(k))) { type = 'rejectEnd'; category = 'event'; }

    // Label Cleaning
    let pureName = line;
    const allTriggers = [...Object.values(mappings).flat(), 'task', 'error', 'if', 'yes', 'no', '->', '=>', ':-'];
    allTriggers.sort((a, b) => b.length - a.length).forEach(k => {
      if (!k) return;
      try {
        const regex = new RegExp(`^${escapeRegExp(k)}|\\(${escapeRegExp(k)}\\)|\\b${escapeRegExp(k)}\\b`, 'gi');
        pureName = pureName.replace(regex, '');
      } catch (e) {}
    });
    
    pureName = pureName.replace(/[?፧？]$/, '').replace(/^[\s>->:–—-]+/, '').trim();

    // RULE: Start Box Purity - Move text to following task
    if (type === 'startEvent' && pureName) {
      startTextToMove = pureName;
      pureName = ""; 
    } else if (category === 'task' && startTextToMove) {
      pureName = startTextToMove + (pureName ? " - " + pureName : "");
      startTextToMove = "";
    }

    const nodeId = `Node_${index}`;
    nodeDefs.push({
      id: nodeId,
      name: pureName || (category === 'task' ? 'ተግባር' : ''),
      type,
      category,
      hasDataAssociation,
      dataLabel,
      isBoundaryError,
      attachedTo: isBoundaryError ? nodeDefs[nodeDefs.length-1].id : null
    });

    if (category === 'task') lastUserTaskId = nodeId;
  });

  const elements: string[] = [];
  const flows: string[] = [];
  const diElements: string[] = [];
  const positions: Record<string, { x: number, y: number, w: number, h: number, row: number, col: number }> = {};

  const MAX_COLS = 3; 
  const BOX_WIDTH = 140;
  const BOX_HEIGHT = 80;
  const COL_SPACING = 350; 
  const ROW_SPACING = 350; 
  const X_START = 200;
  const Y_START = 250;

  nodeDefs.forEach((node, i) => {
    const row = Math.floor(i / MAX_COLS);
    const rawCol = i % MAX_COLS;
    const isEvenRow = row % 2 === 0;
    const col = isEvenRow ? rawCol : (MAX_COLS - 1 - rawCol);

    const x = X_START + col * COL_SPACING;
    const y = Y_START + row * ROW_SPACING;
    
    let w = BOX_WIDTH, h = BOX_HEIGHT;
    if (node.category === 'event') { w = 36; h = 36; }
    else if (node.category === 'gateway') { w = 50; h = 50; }

    positions[node.id] = { x, y, w, h, row, col };

    const escapedName = escapeXml(node.name);

    // Node XML
    switch (node.type) {
      case 'startEvent': elements.push(`<bpmn:startEvent id="${node.id}" name="${escapedName}" />`); break;
      case 'endEvent': elements.push(`<bpmn:endEvent id="${node.id}" name="${escapedName}" />`); break;
      case 'rejectEnd': elements.push(`<bpmn:endEvent id="${node.id}" name="ውድቅ"><bpmn:cancelEventDefinition id="Cancel_${node.id}" /></bpmn:endEvent>`); break;
      case 'timerEvent': elements.push(`<bpmn:intermediateCatchEvent id="${node.id}" name="${escapedName}"><bpmn:timerEventDefinition id="T_${node.id}" /></bpmn:intermediateCatchEvent>`); break;
      case 'exclusiveGateway': elements.push(`<bpmn:exclusiveGateway id="${node.id}" name="${escapedName}" isMarkerVisible="true" />`); break;
      case 'parallelGateway': elements.push(`<bpmn:parallelGateway id="${node.id}" name="${escapedName}" />`); break;
      case 'serviceTask': elements.push(`<bpmn:serviceTask id="${node.id}" name="${escapedName}" />`); break;
      case 'manualTask': elements.push(`<bpmn:manualTask id="${node.id}" name="${escapedName}" />`); break;
      case 'scriptTask': elements.push(`<bpmn:scriptTask id="${node.id}" name="${escapedName}" />`); break;
      default: elements.push(`<bpmn:userTask id="${node.id}" name="${escapedName}" />`);
    }

    // DI Shape
    diElements.push(`
      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}" ${node.type === 'exclusiveGateway' ? 'isMarkerVisible="true"' : ''}>
        <dc:Bounds x="${x - w/2}" y="${y - h/2}" width="${w}" height="${h}" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${x - 60}" y="${y + h/2 + 5}" width="120" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>`);

    // RULE: Shift Data Object to side - Connect with dotted line
    if (node.hasDataAssociation) {
      const dataId = `DataObj_${node.id}`;
      const assocId = `Assoc_${node.id}`;
      // Shifted to the side (independent)
      const dataX = x - 120;
      const dataY = y - 90;
      elements.push(`<bpmn:dataObjectReference id="${dataId}" name="${escapeXml(node.dataLabel)}" dataObjectRef="DO_Ref_${node.id}" />`);
      elements.push(`<bpmn:dataObject id="DO_Ref_${node.id}" />`);
      elements.push(`<bpmn:association id="${assocId}" sourceRef="${dataId}" targetRef="${node.id}" />`);

      diElements.push(`
        <bpmndi:BPMNShape id="${dataId}_di" bpmnElement="${dataId}">
          <dc:Bounds x="${dataX - 18}" y="${dataY - 25}" width="36" height="50" />
        </bpmndi:BPMNShape>
        <bpmndi:BPMNEdge id="${assocId}_di" bpmnElement="${assocId}">
          <di:waypoint x="${dataX + 18}" y="${dataY}" />
          <di:waypoint x="${x - w/2}" y="${y}" />
        </bpmndi:BPMNEdge>`);
    }

    // Boundary Error Event Icon
    if (node.isBoundaryError && node.attachedTo) {
      const boundaryId = `Boundary_${node.id}`;
      elements.push(`<bpmn:boundaryEvent id="${boundaryId}" name="ስህተት" attachedToRef="${node.attachedTo}"><bpmn:errorEventDefinition id="Error_${node.id}" /></bpmn:boundaryEvent>`);
      const parentPos = positions[node.attachedTo];
      if (parentPos) {
        diElements.push(`
          <bpmndi:BPMNShape id="${boundaryId}_di" bpmnElement="${boundaryId}">
            <dc:Bounds x="${parentPos.x + parentPos.w/2 - 18}" y="${parentPos.y + parentPos.h/2 - 18}" width="36" height="36" />
          </bpmndi:BPMNShape>`);
      }
    }

    // RULE: Orthogonal 90-degree Sequence Flows
    if (i > 0) {
      const prev = nodeDefs[i-1];
      const s = positions[prev.id];
      const t = positions[node.id];
      const flowId = `Flow_${prev.id}_${node.id}`;
      const isApproved = nodeDefs[i-1].category === 'gateway';
      const label = isApproved ? 'ከጸደቀ' : '';
      
      flows.push(`<bpmn:sequenceFlow id="${flowId}" ${label ? `name="${label}"` : ''} sourceRef="${prev.id}" targetRef="${node.id}" />`);

      let waypoints = [];
      if (s.row === t.row) {
        // Horizontal straight
        const direction = t.col > s.col ? 1 : -1;
        waypoints = [
          { x: s.x + (direction * s.w/2), y: s.y },
          { x: t.x - (direction * t.w/2), y: t.y }
        ];
      } else {
        // Manhattan Jog Transition
        const exitY = s.y + s.h/2;
        const enterY = t.y - t.h/2;
        const midY = (s.y + t.y) / 2;
        waypoints = [
          { x: s.x, y: exitY },
          { x: s.x, y: midY },
          { x: t.x, y: midY },
          { x: t.x, y: enterY }
        ];
      }

      diElements.push(`
        <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
          ${waypoints.map(p => `<di:waypoint x="${p.x}" y="${p.y}" />`).join('\n')}
          ${label ? `
          <bpmndi:BPMNLabel>
            <dc:Bounds x="${(waypoints[0].x + waypoints[1].x) / 2 - 25}" y="${waypoints[0].y - 20}" width="50" height="14" />
          </bpmndi:BPMNLabel>` : ''}
        </bpmndi:BPMNEdge>`);
    }
  });

  // RULE: UPWARD Routing for 'ካልጸደቀ' (Loop/Rejection)
  backFlows.forEach(f => {
    flows.push(`<bpmn:sequenceFlow id="${f.id}" name="${f.name}" sourceRef="${f.sourceRef}" targetRef="${f.targetRef}" />`);
    const s = positions[f.sourceRef];
    const t = positions[f.targetRef];
    if (s && t) {
      // Loop routes UP and back (Skyway)
      const skyY = s.y - 180; 
      
      diElements.push(`
        <bpmndi:BPMNEdge id="${f.id}_di" bpmnElement="${f.id}">
          <di:waypoint x="${s.x}" y="${s.y - s.h/2}" />
          <di:waypoint x="${s.x}" y="${skyY}" />
          <di:waypoint x="${t.x}" y="${skyY}" />
          <di:waypoint x="${t.x}" y="${t.y - t.h/2}" />
          <bpmndi:BPMNLabel>
            <dc:Bounds x="${(s.x + t.x) / 2 - 30}" y="${skyY + 5}" width="60" height="14" />
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
                  exporterVersion="1.0">
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
