export function generateBPMN(input: string, title: string = "Process Diagram"): string {
  if (!input.trim()) return '';

  const rawLines = input.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  const mappings = {
    start: ['መጀመሪያ', 'ጀምር', 'start', 'begin'],
    end: ['መጨረሻ', 'ጨርስ', 'ተጠናቀቀ', 'end', 'finish', 'success', 'done'],
    timer: ['ቆይታ', 'ሰዓት', 'timer', 'wait'],
    userTask: ['ባለሙያ', 'human', 'user task', 'ተግባር', 'action', 'ማከናወን', 'መቀበል', 'መለየት', 'ማዘጋጀት', 'መሰብሰብ', 'benchmarking', 'መለካት', 'ማቅረብ', 'ማደራጀት'],
    serviceTask: ['ሲስተም', 'አውቶማቲክ', 'service task', 'system', 'auto', 'gear'],
    manualTask: ['በእጅ', 'ፊዚካል', 'manual task', 'physical'],
    scriptTask: ['ስክሪፕት', 'ኮድ', 'script task', 'code'],
    exclusiveGateway: ['ውሳኔ', 'ከሆነ', 'ወይስ', 'ቢሆን', 'decision', 'xor', 'if', 'gateway', 'ማጽደቅ?', 'ጥያቄ?', 'አዋጭ?'],
    parallelGateway: ['በአንድ ጊዜ', 'እና', 'ትይዩ', 'parallel', 'and', 'simultaneous'],
    dataKeywords: ['ሰነድ', 'ፎርም', 'ማስረጃ', 'ደረሰኝ', 'document', 'form', 'file', 'ሪፖርት'],
    error: ['error', 'ስህተት', 'lightning'],
    reject: ['ውድቅ', 'reject', 'cancel', 'አልተቀበለም', 'no', 'ካልጸደቀ', 'ሰርዝ']
  };

  function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  const nodeDefs: any[] = [];
  const backFlows: any[] = [];
  let startTextToMove = "";

  // PASS 1: Identify Nodes and Categorize
  rawLines.forEach((line, index) => {
    const lowerLine = line.toLowerCase();
    
    // Detect Back/Loop triggers - High Clearance Skyway
    const isLoop = ['ተመለስ', 'back', 'correction', 'fix', 'edit', 'መመለስ'].some(t => lowerLine.includes(t));
    if (isLoop && nodeDefs.length > 0) {
      const sourceId = nodeDefs[nodeDefs.length - 1].id;
      // Target the first task or start
      const targetId = nodeDefs[0].id; 
      backFlows.push({
        id: `Flow_Back_${index}`,
        sourceRef: sourceId,
        targetRef: targetId,
        name: 'ተመለስ',
        type: 'loop'
      });
      return;
    }

    let type = 'userTask';
    let category = 'task';
    let hasDataAssociation = false;
    let dataLabel = "ሰነድ";

    if (mappings.dataKeywords.some(k => lowerLine.includes(k))) {
      hasDataAssociation = true;
    }

    if (mappings.start.some(k => lowerLine.includes(k))) { type = 'startEvent'; category = 'event'; }
    else if (mappings.end.some(k => lowerLine.includes(k))) { type = 'endEvent'; category = 'event'; }
    else if (mappings.timer.some(k => lowerLine.includes(k))) { type = 'timerEvent'; category = 'event'; }
    else if (mappings.exclusiveGateway.some(k => lowerLine.includes(k))) { type = 'exclusiveGateway'; category = 'gateway'; }
    else if (mappings.parallelGateway.some(k => lowerLine.includes(k))) { type = 'parallelGateway'; category = 'gateway'; }
    else if (mappings.serviceTask.some(k => lowerLine.includes(k))) { type = 'serviceTask'; category = 'task'; }
    else if (mappings.reject.some(k => lowerLine.includes(k))) { type = 'rejectEnd'; category = 'event'; }
    else if (mappings.error.some(k => lowerLine.includes(k))) { type = 'errorEnd'; category = 'event'; }

    // Label Cleaning
    let pureName = line;
    const allTriggers = [...Object.values(mappings).flat(), 'task', 'error', 'if', 'yes', 'no', '->', '=>', ':', 'if yes', 'if no back'];
    allTriggers.sort((a, b) => b.length - a.length).forEach(k => {
      if (!k) return;
      try {
        const regex = new RegExp(`^${escapeRegExp(k)}|\\(${escapeRegExp(k)}\\)|\\b${escapeRegExp(k)}\\b`, 'gi');
        pureName = pureName.replace(regex, '');
      } catch (e) {}
    });
    
    pureName = pureName.replace(/[?፧？]$/, '').replace(/^[\s>->:–—-]+/, '').trim();

    // RULE: Start Box Purity
    if (type === 'startEvent') {
      if (pureName) startTextToMove = pureName;
      pureName = ""; 
    } else if (category === 'task' && startTextToMove) {
      pureName = startTextToMove + (pureName ? " " + pureName : "");
      startTextToMove = "";
    }

    const nodeId = `Node_${index}`;
    nodeDefs.push({
      id: nodeId,
      name: pureName,
      type,
      category,
      hasDataAssociation,
      dataLabel,
    });
  });

  const elements: string[] = [];
  const flows: string[] = [];
  const diElements: string[] = [];
  const positions: Record<string, { x: number, y: number, w: number, h: number, row: number, col: number }> = {};

  // STRICTURE: 5000px wide workspace, 12 steps per row max
  const COL_SPACING = 450; 
  const MAX_COLS = 12; 
  const BOX_WIDTH = 140;
  const BOX_HEIGHT = 80;
  const ROW_SPACING = 450; 
  const X_START = 200;
  const Y_START = 250;

  nodeDefs.forEach((node, i) => {
    const row = Math.floor(i / MAX_COLS);
    const col = i % MAX_COLS;

    const x = X_START + col * COL_SPACING;
    const y = Y_START + row * ROW_SPACING;
    
    let w = BOX_WIDTH, h = BOX_HEIGHT;
    if (node.category === 'event') { w = 36; h = 36; }
    else if (node.category === 'gateway') { w = 50; h = 50; }

    positions[node.id] = { x, y, w, h, row, col };

    const escapedName = escapeXml(node.name);

    // Node XML
    switch (node.type) {
      case 'startEvent': elements.push(`<bpmn:startEvent id="${node.id}" name="" />`); break;
      case 'endEvent': elements.push(`<bpmn:endEvent id="${node.id}" name="${escapedName}" />`); break;
      case 'rejectEnd': elements.push(`<bpmn:endEvent id="${node.id}" name="ውድቅ"><bpmn:cancelEventDefinition id="Cancel_${node.id}" /></bpmn:endEvent>`); break;
      case 'errorEnd': elements.push(`<bpmn:endEvent id="${node.id}" name="ስህተት"><bpmn:errorEventDefinition id="Error_${node.id}" /></bpmn:endEvent>`); break;
      case 'exclusiveGateway': elements.push(`<bpmn:exclusiveGateway id="${node.id}" name="${escapedName}" isMarkerVisible="true" />`); break;
      case 'parallelGateway': elements.push(`<bpmn:parallelGateway id="${node.id}" name="${escapedName}" />`); break;
      case 'serviceTask': elements.push(`<bpmn:serviceTask id="${node.id}" name="${escapedName}" />`); break;
      default: elements.push(`<bpmn:userTask id="${node.id}" name="${escapedName}" />`);
    }

    // DI Shape
    diElements.push(`
      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
        <dc:Bounds x="${x - w/2}" y="${y - h/2}" width="${w}" height="${h}" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${x - 60}" y="${y + h/2 + 5}" width="120" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>`);

    // Data Object Positioning (Shifted +120px up to avoid overlaps)
    if (node.hasDataAssociation) {
      const dataId = `DataObj_${node.id}`;
      const assocId = `Assoc_${node.id}`;
      const dataX = x + 30; // Slightly side-shifted
      const dataY = y - 130;
      elements.push(`<bpmn:dataObjectReference id="${dataId}" name="${escapeXml(node.dataLabel)}" dataObjectRef="DO_Ref_${node.id}" />`);
      elements.push(`<bpmn:dataObject id="DO_Ref_${node.id}" />`);
      elements.push(`<bpmn:association id="${assocId}" sourceRef="${node.id}" targetRef="${dataId}" />`);
      diElements.push(`
        <bpmndi:BPMNShape id="${dataId}_di" bpmnElement="${dataId}">
          <dc:Bounds x="${dataX - 18}" y="${dataY - 25}" width="36" height="50" />
        </bpmndi:BPMNShape>
        <bpmndi:BPMNEdge id="${assocId}_di" bpmnElement="${assocId}">
          <di:waypoint x="${x}" y="${y - h/2}" />
          <di:waypoint x="${dataX}" y="${dataY + 25}" />
        </bpmndi:BPMNEdge>`);
    }

    // Sequence flows (Orthogonal Manhattan Routing)
    if (i > 0) {
      const prev = nodeDefs[i-1];
      const s = positions[prev.id];
      const t = positions[node.id];
      const flowId = `Flow_${prev.id}_${node.id}`;
      
      // Label Detachment for Decisions
      let label = "";
      if (prev.category === 'gateway') {
        const lowerRaw = rawLines[i] || "";
        if (lowerRaw.includes('yes') || lowerRaw.includes('ከጸደቀ')) label = "ከጸደቀ";
        else if (lowerRaw.includes('no') || lowerRaw.includes('ካልጸደቀ')) label = "ካልጸደቀ";
      }
      
      flows.push(`<bpmn:sequenceFlow id="${flowId}" ${label ? `name="${label}"` : ''} sourceRef="${prev.id}" targetRef="${node.id}" />`);

      let waypoints = [];
      if (s.row === t.row) {
        // Straight line between center edges
        waypoints = [{ x: s.x + s.w/2, y: s.y }, { x: t.x - t.w/2, y: t.y }];
      } else {
        // Snake flow row transition - Jog via mid-channel
        const midX = (s.x + t.x) / 2;
        waypoints = [
          { x: s.x + s.w/2, y: s.y },
          { x: s.x + s.w/2 + 50, y: s.y },
          { x: s.x + s.w/2 + 50, y: (s.y + t.y) / 2 },
          { x: t.x - t.w/2 - 50, y: (s.y + t.y) / 2 },
          { x: t.x - t.w/2 - 50, y: t.y },
          { x: t.x - t.w/2, y: t.y }
        ];
      }

      const labelX = (waypoints[0].x + waypoints[waypoints.length-1].x) / 2;
      const labelY = (waypoints[0].y + waypoints[waypoints.length-1].y) / 2 - 15;

      diElements.push(`
        <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
          ${waypoints.map(p => `<di:waypoint x="${p.x}" y="${p.y}" />`).join('\n')}
          ${label ? `
          <bpmndi:BPMNLabel>
            <dc:Bounds x="${labelX - 30}" y="${labelY}" width="60" height="14" />
          </bpmndi:BPMNLabel>` : ''}
        </bpmndi:BPMNEdge>`);
    }
  });

  // Loop-back Routing (High Skyway at -250px)
  backFlows.forEach(f => {
    flows.push(`<bpmn:sequenceFlow id="${f.id}" name="${f.name}" sourceRef="${f.sourceRef}" targetRef="${f.targetRef}" />`);
    const s = positions[f.sourceRef];
    const t = positions[f.targetRef];
    if (s && t) {
      const skyY = s.y - 250; 
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
