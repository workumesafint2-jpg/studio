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
    parallelGateway: ['በአንድ ጊዜ', 'እና', 'ትይዩ', 'parallel', 'and', '+', 'simultaneous'],
    dataKeywords: ['ሰነድ', 'ፎርም', 'ማስረጃ', 'ደረሰኝ', 'document', 'form', 'file'],
    error: ['error', 'ስህተት', 'lightning'],
    reject: ['ውድቅ', 'reject', 'cancel', 'አልተቀበለም', 'no', 'ካልጸደቀ', 'ሰርዝ']
  };

  const flowLabels = {
    approve: ['ከጸደቀ', 'ከሆነ', 'አዎ', 'yes', 'approve', 'ok', 'ቀጥል'],
    reject: ['ካልጸደቀ', 'ካልሆነ', 'አይደለም', 'no', 'reject', 'fail']
  };

  const flowDirectionTriggers = {
    loop: ['correction', 'fix', 'edit', 'back', 'return', 'ተመለስ', 'አስተካክል', 'ተመለሰ', 'ወደ መጀመሪያ'],
    reject: ['ውድቅ', 'reject', 'cancel', 'አልተቀበለም', 'ሰርዝ']
  };

  function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  const nodeDefs: any[] = [];
  const backFlows: any[] = [];
  let lastUserTaskId: string | null = null;

  // PASS 1: Identify Nodes and specialized associations
  rawLines.forEach((line, index) => {
    const lowerLine = line.toLowerCase();
    
    // Check for Loop/Back commands
    const isStrictLoop = flowDirectionTriggers.loop.some(t => lowerLine.includes(t));
    
    if (isStrictLoop && nodeDefs.length > 0) {
      const sourceId = nodeDefs[nodeDefs.length - 1].id;
      let targetId = lastUserTaskId || (nodeDefs.length > 1 ? nodeDefs[nodeDefs.length - 2].id : nodeDefs[0].id);
      
      // Look for a specific target in text if possible, otherwise default to previous/start
      let flowLabel = 'ተመለስ';
      if (lowerLine.includes('ካልጸደቀ')) flowLabel = 'ካልጸደቀ';

      backFlows.push({
        id: `Flow_Back_${index}`,
        sourceRef: sourceId,
        targetRef: targetId,
        name: flowLabel,
        direction: 'loop'
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
      const foundKeyword = mappings.dataKeywords.find(k => lowerLine.includes(k));
      if (foundKeyword) dataLabel = foundKeyword;
    }

    if (mappings.error.some(k => lowerLine.includes(k)) && nodeDefs.length > 0) {
      isBoundaryError = true;
    }
    
    if (mappings.start.some(k => lowerLine.includes(k))) { type = 'startEvent'; category = 'event'; }
    else if (mappings.end.some(k => lowerLine.includes(k))) { type = 'endEvent'; category = 'event'; }
    else if (mappings.timer.some(k => lowerLine.includes(k))) { type = 'timerEvent'; category = 'event'; }
    else if (mappings.exclusiveGateway.some(k => lowerLine.includes(k))) { type = 'exclusiveGateway'; category = 'gateway'; }
    else if (mappings.parallelGateway.some(k => lowerLine.includes(k))) { type = 'parallelGateway'; category = 'gateway'; }
    else if (mappings.serviceTask.some(k => lowerLine.includes(k))) { type = 'serviceTask'; category = 'task'; }
    else if (mappings.manualTask.some(k => lowerLine.includes(k))) { type = 'manualTask'; category = 'task'; }
    else if (mappings.scriptTask.some(k => lowerLine.includes(k))) { type = 'scriptTask'; category = 'task'; }
    else if (mappings.reject.some(k => lowerLine.includes(k))) { type = 'rejectEnd'; category = 'event'; }

    // CLEANUP NAME - Fixed RegExp to avoid "Nothing to repeat" error
    let pureName = line;
    const allTriggers = Array.from(new Set([
      ...Object.values(mappings).flat(),
      ...Object.values(flowDirectionTriggers).flat(),
      ...Object.values(flowLabels).flat(),
      'success', 'failed', 'done', 'task', 'error', 'decision', 'simultaneous', 'if', 'yes', 'no'
    ])).filter(Boolean);

    allTriggers.sort((a, b) => b.length - a.length).forEach(k => {
      const escapedK = escapeRegExp(k);
      try {
        // Use a safer regex that avoids 'nothing to repeat' by checking if escapedK is empty or problematic
        if (!escapedK) return;
        const regex = new RegExp(`^${escapedK}|\\(${escapedK}\\)|\\b${escapedK}\\b`, 'gi');
        pureName = pureName.replace(regex, '');
      } catch (e) {
        // Fallback for tricky strings
        pureName = pureName.split(k).join('');
      }
    });
    
    // Final polish of labels
    pureName = pureName
      .replace(/[?፧？]$/, '')
      .replace(/^[\s>->=>:–—-]+/, '')
      .replace(/\s*[:\-–—=>]+\s*/g, ' ')
      .replace(/\([^)]*\)/g, '')
      .trim();

    const nodeId = `Node_${index}`;
    nodeDefs.push({
      id: nodeId,
      name: pureName || (category === 'task' ? 'ተግባር' : ''),
      type,
      category,
      index,
      hasDataAssociation,
      dataLabel,
      isBoundaryError,
      attachedTo: isBoundaryError ? nodeDefs[nodeDefs.length-1].id : null
    });

    if (category === 'task') {
      lastUserTaskId = nodeId;
    }
  });

  const elements: string[] = [];
  const flows: string[] = [];
  const diElements: string[] = [];
  const positions: Record<string, { x: number, y: number, w: number, h: number, row: number, col: number }> = {};

  // Layout Constants - Optimized for Manhattan routing
  const MAX_COLS = 3; 
  const BOX_WIDTH = 120;
  const BOX_HEIGHT = 80;
  const COL_SPACING = 350; // Increased to 350px for zero overlap
  const ROW_SPACING = 300; // Vertical spacing
  const X_START = 200;
  const Y_START = 200;

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

    if (node.isBoundaryError && node.attachedTo) {
      const parentPos = positions[node.attachedTo];
      positions[node.id] = { x: parentPos.x + 40, y: parentPos.y + 40, w: 36, h: 36, row: parentPos.row, col: parentPos.col };
    } else {
      positions[node.id] = { x, y, w, h, row, col };
    }

    const escapedName = escapeXml(node.name);

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
      case 'userTask': 
        if (node.isBoundaryError && node.attachedTo) {
          elements.push(`<bpmn:boundaryEvent id="${node.id}" name="ስህተት" attachedToRef="${node.attachedTo}"><bpmn:errorEventDefinition id="ErrDef_${node.id}" /></bpmn:boundaryEvent>`);
        } else {
          elements.push(`<bpmn:userTask id="${node.id}" name="${escapedName}" />`);
        }
        break;
      default: elements.push(`<bpmn:userTask id="${node.id}" name="${escapedName}" />`);
    }

    const currentPos = positions[node.id];
    
    // DATA OBJECT Logic - Position directly ABOVE task
    if (node.hasDataAssociation) {
      const dataId = `DataObj_${node.id}`;
      const assocId = `Assoc_${node.id}`;
      const dataX = currentPos.x;
      const dataY = currentPos.y - 120; // Positioned above

      elements.push(`<bpmn:dataObjectReference id="${dataId}" name="${escapeXml(node.dataLabel)}" dataObjectRef="DO_Ref_${node.id}" />`);
      elements.push(`<bpmn:dataObject id="DO_Ref_${node.id}" />`);
      elements.push(`<bpmn:association id="${assocId}" sourceRef="${dataId}" targetRef="${node.id}" />`);

      diElements.push(`
        <bpmndi:BPMNShape id="${dataId}_di" bpmnElement="${dataId}">
          <dc:Bounds x="${dataX - 18}" y="${dataY - 25}" width="36" height="50" />
        </bpmndi:BPMNShape>
        <bpmndi:BPMNEdge id="${assocId}_di" bpmnElement="${assocId}">
          <di:waypoint x="${dataX}" y="${dataY + 25}" />
          <di:waypoint x="${currentPos.x}" y="${currentPos.y - currentPos.h/2}" />
        </bpmndi:BPMNEdge>`);
    }

    diElements.push(`
      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}" ${node.type === 'exclusiveGateway' ? 'isMarkerVisible="true"' : ''}>
        <dc:Bounds x="${currentPos.x - currentPos.w/2}" y="${currentPos.y - currentPos.h/2}" width="${currentPos.w}" height="${currentPos.h}" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${currentPos.x - 60}" y="${currentPos.y + currentPos.h/2 + 5}" width="120" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>`);

    // FORWARD FLOW Logic - 90 Degree Orthogonal (Manhattan)
    if (i > 0 && !node.isBoundaryError) {
      const prev = nodeDefs[i - 1];
      if (!prev.isBoundaryError) {
        const flowId = `Flow_${prev.id}_${node.id}`;
        let label = '';
        if (prev.type === 'exclusiveGateway') {
           label = 'ቀጥል'; // Default for gateway forward
        }
        
        flows.push(`<bpmn:sequenceFlow id="${flowId}" name="${label}" sourceRef="${prev.id}" targetRef="${node.id}" />`);
        
        const s = positions[prev.id];
        const t = positions[node.id];
        if (s && t) {
          const sRow = s.row;
          const tRow = t.row;
          const isEvenRow = sRow % 2 === 0;
          let waypoints: {x: number, y: number}[] = [];

          if (sRow === tRow) {
            // Horizontal sequential flow - Exit center-side, Enter center-side
            const exitX = isEvenRow ? s.x + s.w/2 : s.x - s.w/2;
            const entryX = isEvenRow ? t.x - t.w/2 : t.x + t.w/2;
            waypoints = [{ x: exitX, y: s.y }, { x: entryX, y: t.y }];
          } else {
            // Manhattan row transition - Exit bottom, Enter top
            const midY = (s.y + t.y) / 2;
            waypoints = [
              { x: s.x, y: s.y + s.h/2 },
              { x: s.x, y: midY },
              { x: t.x, y: midY },
              { x: t.x, y: t.y - t.h/2 }
            ];
          }

          diElements.push(`
            <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
              ${waypoints.map(w => `<di:waypoint x="${w.x}" y="${w.y}" />`).join('\n')}
              <bpmndi:BPMNLabel>
                <dc:Bounds x="${(waypoints[0].x + waypoints[waypoints.length-1].x) / 2 - 25}" y="${waypoints[waypoints.length-1].y - 25}" width="50" height="14" />
              </bpmndi:BPMNLabel>
            </bpmndi:BPMNEdge>`);
        }
      }
    }
  });

  // BACK/LOOP FLOW Logic - High Clearance (y-offset -100 or more)
  backFlows.forEach(f => {
    flows.push(`<bpmn:sequenceFlow id="${f.id}" name="${escapeXml(f.name)}" sourceRef="${f.sourceRef}" targetRef="${f.targetRef}" />`);
    const s = positions[f.sourceRef];
    const t = positions[f.targetRef];
    if (s && t) {
      // Set arrow height to at least 100-200 units above to avoid cluttering main flow
      const clearY = Math.min(s.y, t.y) - 220; 
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
    }
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                  targetNamespace="http://bpmn.io/schema/bpmn"
                  exporter="Worku (ወርቁ) Pro Architect" 
                  exporterVersion="15.0">
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
