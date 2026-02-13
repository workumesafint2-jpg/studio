export function generateBPMN(input: string, title: string = "Process Diagram"): string {
  if (!input.trim()) return '';

  const rawLines = input.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  const mappings = {
    start: ['መጀመሪያ', 'ጀምር', 'start', 'begin'],
    end: ['መጨረሻ', 'ጨርስ', 'ተጠናቀቀ', 'end', 'finish', 'success', 'done'],
    timer: ['ቆይታ', 'ሰዓት', 'timer', 'wait'],
    userTask: ['ባለሙያ', 'human', 'user task', 'ተግባር', 'action', 'ማከናወን', 'መለየት', 'ማዘጋጀት', 'መሰብሰብ', 'መለካት', 'ማቅረብ', 'ማደራጀት'],
    serviceTask: ['ሲስተም', 'አውቶማቲክ', 'service task', 'system', 'auto', 'gear', 'መላክ', 'መቀበል', 'መመዝገብ'],
    manualTask: ['በእጅ', 'ፊዚካል', 'manual task', 'physical'],
    scriptTask: ['ስክሪፕት', 'ኮድ', 'script task', 'code'],
    exclusiveGateway: ['ውሳኔ', 'ከሆነ', 'ወይስ', 'ቢሆን', 'decision', 'xor', 'if', 'gateway', 'ማጽደቅ?', 'ጥያቄ?', 'አዋጭ?'],
    parallelGateway: ['በአንድ ጊዜ', 'እና', 'ትይዩ', 'parallel', 'and', 'simultaneous'],
    dataKeywords: ['ሰነድ', 'ፎርም', 'ማስረጃ', 'document', 'form', 'file', 'ሪፖርት'],
    error: ['error', 'ስህተት', 'lightning'],
    reject: ['ውድቅ', 'reject', 'cancel', 'አልተቀበለም', 'no', 'ካልጸደቀ', 'ሰርዝ']
  };

  function escapeRegExp(string: string) {
    if (!string) return '';
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  const nodeDefs: any[] = [];
  const backFlows: any[] = [];
  const branchNodes: any[] = [];
  let startTextToMove = "";

  // PASS 1: Identify Nodes and Categorize
  rawLines.forEach((line, index) => {
    const lowerLine = line.toLowerCase();
    
    const isLoop = ['ተመለስ', 'back', 'correction', 'fix', 'edit'].some(t => lowerLine.includes(t)) && 
                   !['ካልጸደቀ', 'reject', 'no', 'ውድቅ'].some(t => lowerLine.includes(t));
    
    if (isLoop && nodeDefs.length > 0) {
      const sourceId = nodeDefs[nodeDefs.length - 1].id;
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
    else if (mappings.scriptTask.some(k => lowerLine.includes(k))) { type = 'scriptTask'; category = 'task'; }
    else if (mappings.reject.some(k => lowerLine.includes(k))) { type = 'rejectEnd'; category = 'event'; }

    let pureName = line;
    const allTriggers = [
      ...Object.values(mappings).flat(), 
      'user task', 'service task', 'manual task', 'script task', 'start', 'end', 'gateway', 'decision',
      'task', 'error', 'if', 'yes', 'no', '->', '=>', ':', 'if yes', 'if no back'
    ];
    
    allTriggers.filter(Boolean).sort((a, b) => b.length - a.length).forEach(k => {
      try {
        const regex = new RegExp(`^${escapeRegExp(k)}|\\(${escapeRegExp(k)}\\)|\\b${escapeRegExp(k)}\\b`, 'gi');
        pureName = pureName.replace(regex, '');
      } catch (e) {}
    });
    
    pureName = pureName.replace(/[?፧？]$/, '').replace(/^[\s>->:–—-]+/, '').trim();

    // RULE: Start Event is STRICTLY EMPTY. Label moves to first task.
    if (type === 'startEvent') {
      if (pureName) startTextToMove = pureName;
      pureName = ""; 
    } else if (category === 'task' && startTextToMove) {
      pureName = startTextToMove + (pureName ? " " + pureName : "");
      startTextToMove = "";
    }

    const nodeId = `Node_${index}`;
    
    if (type === 'exclusiveGateway' && (lowerLine.includes('ካልጸደቀ') || lowerLine.includes('reject') || lowerLine.includes('no') || lowerLine.includes('ውድቅ'))) {
      const errorEventId = `ErrorEvent_${index}`;
      branchNodes.push({
        id: errorEventId,
        label: 'ካልጸደቀ',
        type: 'errorEnd',
        parentId: nodeId
      });
    }

    nodeDefs.push({
      id: nodeId,
      name: pureName,
      type,
      category,
      hasDataAssociation,
      dataLabel
    });
  });

  const elements: string[] = [];
  const flows: string[] = [];
  const diElements: string[] = [];
  const positions: Record<string, { x: number, y: number, w: number, h: number }> = {};

  // RULE: Layout Stability - 400px Spacing, HorizontalOnly Strategy
  const COL_SPACING = 400; 
  const BOX_WIDTH = 140;
  const BOX_HEIGHT = 80;
  const X_START = 200;
  const Y_START = 400;

  nodeDefs.forEach((node, i) => {
    const x = X_START + i * COL_SPACING;
    const y = Y_START;
    
    let w = BOX_WIDTH, h = BOX_HEIGHT;
    if (node.category === 'event') { w = 36; h = 36; }
    else if (node.category === 'gateway') { w = 50; h = 50; }

    positions[node.id] = { x, y, w, h };
    const escapedName = escapeXml(node.name);

    switch (node.type) {
      case 'startEvent': elements.push(`<bpmn:startEvent id="${node.id}" name="" />`); break;
      case 'endEvent': elements.push(`<bpmn:endEvent id="${node.id}" name="${escapedName}" />`); break;
      case 'rejectEnd': elements.push(`<bpmn:endEvent id="${node.id}" name="ውድቅ"><bpmn:cancelEventDefinition id="Cancel_${node.id}" /></bpmn:endEvent>`); break;
      case 'exclusiveGateway': elements.push(`<bpmn:exclusiveGateway id="${node.id}" name="${escapedName}" isMarkerVisible="true" />`); break;
      case 'parallelGateway': elements.push(`<bpmn:parallelGateway id="${node.id}" name="${escapedName}" />`); break;
      case 'serviceTask': elements.push(`<bpmn:serviceTask id="${node.id}" name="${escapedName}" />`); break;
      case 'scriptTask': elements.push(`<bpmn:scriptTask id="${node.id}" name="${escapedName}" />`); break;
      default: elements.push(`<bpmn:userTask id="${node.id}" name="${escapedName}" />`);
    }

    diElements.push(`
      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
        <dc:Bounds x="${x - w/2}" y="${y - h/2}" width="${w}" height="${h}" />
      </bpmndi:BPMNShape>`);

    // RULE: Data Objects side-positioned with dotted association
    if (node.hasDataAssociation) {
      const dataId = `DataObj_${node.id}`;
      const assocId = `Assoc_${node.id}`;
      const dataX = x + 100;
      const dataY = y - 100;
      elements.push(`<bpmn:dataObjectReference id="${dataId}" name="${escapeXml(node.dataLabel)}" dataObjectRef="DO_Ref_${node.id}" />`);
      elements.push(`<bpmn:dataObject id="DO_Ref_${node.id}" />`);
      elements.push(`<bpmn:association id="${assocId}" sourceRef="${node.id}" targetRef="${dataId}" />`);
      diElements.push(`
        <bpmndi:BPMNShape id="${dataId}_di" bpmnElement="${dataId}">
          <dc:Bounds x="${dataX - 18}" y="${dataY - 25}" width="36" height="50" />
        </bpmndi:BPMNShape>
        <bpmndi:BPMNEdge id="${assocId}_di" bpmnElement="${assocId}">
          <di:waypoint x="${x + w/2}" y="${y - h/4}" />
          <di:waypoint x="${dataX - 18}" y="${dataY}" />
        </bpmndi:BPMNEdge>`);
    }

    if (i > 0) {
      const prev = nodeDefs[i-1];
      const s = positions[prev.id];
      const t = positions[node.id];
      const flowId = `Flow_${prev.id}_${node.id}`;
      let label = (prev.category === 'gateway') ? "ከጸደቀ" : "";
      
      flows.push(`<bpmn:sequenceFlow id="${flowId}" ${label ? `name="${label}"` : ''} sourceRef="${prev.id}" targetRef="${node.id}" />`);
      
      // RULE: Arrow Labels hardcoded to Midpoint of the sequence flow
      diElements.push(`
        <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
          <di:waypoint x="${s.x + s.w/2}" y="${s.y}" />
          <di:waypoint x="${t.x - t.w/2}" y="${t.y}" />
          ${label ? `<bpmndi:BPMNLabel>
            <dc:Bounds x="${(s.x + t.x)/2 - 30}" y="${s.y - 20}" width="60" height="14" />
          </bpmndi:BPMNLabel>` : ''}
        </bpmndi:BPMNEdge>`);
    }
  });

  branchNodes.forEach(branch => {
    const parentPos = positions[branch.parentId];
    if (!parentPos) return;

    const x = parentPos.x;
    const y = parentPos.y - 200; 
    const w = 36, h = 36;
    positions[branch.id] = { x, y, w, h };

    elements.push(`<bpmn:endEvent id="${branch.id}" name="ካልጸደቀ"><bpmn:errorEventDefinition id="ErrorDef_${branch.id}" /></bpmn:endEvent>`);
    diElements.push(`
      <bpmndi:BPMNShape id="${branch.id}_di" bpmnElement="${branch.id}">
        <dc:Bounds x="${x - w/2}" y="${y - h/2}" width="${w}" height="${h}" />
      </bpmndi:BPMNShape>`);

    const flowId = `Flow_Branch_${branch.id}`;
    flows.push(`<bpmn:sequenceFlow id="${flowId}" name="${branch.label}" sourceRef="${branch.parentId}" targetRef="${branch.id}" />`);
    
    // Midpoint label for upward flow
    diElements.push(`
      <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
        <di:waypoint x="${parentPos.x}" y="${parentPos.y - parentPos.h/2}" />
        <di:waypoint x="${x}" y="${y + h/2}" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${x + 10}" y="${(parentPos.y + y)/2 - 7}" width="60" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>`);
  });

  backFlows.forEach(f => {
    flows.push(`<bpmn:sequenceFlow id="${f.id}" name="${f.name}" sourceRef="${f.sourceRef}" targetRef="${f.targetRef}" />`);
    const s = positions[f.sourceRef];
    const t = positions[f.targetRef];
    if (s && t) {
      const skyY = Y_START - 220; 
      diElements.push(`
        <bpmndi:BPMNEdge id="${f.id}_di" bpmnElement="${f.id}">
          <di:waypoint x="${s.x}" y="${s.y - s.h/2}" />
          <di:waypoint x="${s.x}" y="${skyY}" />
          <di:waypoint x="${t.x}" y="${skyY}" />
          <di:waypoint x="${t.x}" y="${t.y - t.h/2}" />
          <bpmndi:BPMNLabel><dc:Bounds x="${(s.x + t.x)/2 - 30}" y="${skyY - 20}" width="60" height="14" /></bpmndi:BPMNLabel>
        </bpmndi:BPMNEdge>`);
    }
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                  targetNamespace="http://bpmn.io/schema/bpmn"
                  exporter="Worku (ወርቁ) Pro" 
                  exporterVersion="2.0">
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
