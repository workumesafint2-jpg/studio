/**
 * ወርቁ Pro - Industrial BPMN Engine v5.0
 * STABLE PRODUCTION BUILD: Logic Freeze & Scale Optimization
 */

export function generateBPMN(input: string, title: string = "Process Diagram"): string {
  if (!input.trim()) return '';

  // Pre-process: ensure [wrap] is treated as a clean line break for the layout logic
  // This allows the AI to output a single string with [wrap] markers
  const processedInput = input.replace(/\[wrap\]/gi, '\n[wrap]\n');
  const rawLines = processedInput.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  const mappings = {
    start: ['መጀመሪያ', 'ጀምር', 'start', 'begin'],
    end: ['መጨረሻ', 'ጨርስ', 'ተጠናቀቀ', 'end', 'finish', 'success', 'done'],
    exclusiveGateway: ['ውሳኔ', 'ከሆነ', 'ወይስ', 'ቢሆን', 'decision', 'xor', 'if', 'gateway', 'ማጽደቅ?', 'ጥያቄ?', 'አዋጭ?'],
    serviceTask: ['ሲስተም', 'አውቶማቲክ', 'service task', 'system', 'auto', 'gear'],
    dataKeywords: ['ሰነድ', 'ፎርም', 'ማስረጃ', 'document', 'form', 'file', 'ሪፖርት'],
    wrap: ['[wrap]', '[next]']
  };

  const nodeDefs: any[] = [];
  let currentRow = 0;
  let nodesInRow = 0;
  let startTextToMove = "";

  rawLines.forEach((line, index) => {
    const lowerLine = line.toLowerCase();
    
    if (mappings.wrap.some(k => lowerLine.includes(k))) {
      currentRow++;
      nodesInRow = 0;
      return;
    }

    let type = 'userTask';
    let category = 'task';
    let hasDataAssociation = false;

    if (mappings.dataKeywords.some(k => lowerLine.includes(k))) hasDataAssociation = true;
    if (mappings.start.some(k => lowerLine.includes(k))) { type = 'startEvent'; category = 'event'; }
    else if (mappings.end.some(k => lowerLine.includes(k))) { type = 'endEvent'; category = 'event'; }
    else if (mappings.exclusiveGateway.some(k => lowerLine.includes(k))) { type = 'exclusiveGateway'; category = 'gateway'; }
    else if (mappings.serviceTask.some(k => lowerLine.includes(k))) { type = 'serviceTask'; category = 'task'; }

    let pureName = line;
    const allKeywords = Object.values(mappings).flat();
    allKeywords.forEach(k => {
      if (k && k.startsWith('[')) return;
      const regex = new RegExp(`\\b${escapeRegExp(k)}\\b`, 'gi');
      pureName = pureName.replace(regex, '');
    });
    pureName = pureName.replace(/[?፧？]$/, '').replace(/^[\s>->:–—-]+/, '').trim();

    // RULE: Start Event is STRICTLY EMPTY
    if (type === 'startEvent') {
      if (pureName) startTextToMove = pureName;
      pureName = ""; 
    } else if (category === 'task' && startTextToMove) {
      pureName = startTextToMove + (pureName ? " " + pureName : "");
      startTextToMove = "";
    }

    nodeDefs.push({
      id: `Node_${index}`,
      name: pureName,
      type,
      category,
      hasDataAssociation,
      row: currentRow,
      col: nodesInRow++
    });
  });

  const elements: string[] = [];
  const flows: string[] = [];
  const diElements: string[] = [];
  const positions: Record<string, { x: number, y: number, w: number, h: number }> = {};

  const COL_SPACING = 350; 
  const ROW_SPACING = 300;
  const BOX_WIDTH = 120;
  const BOX_HEIGHT = 80;
  const X_OFFSET = 150;
  const Y_OFFSET = 250;

  nodeDefs.forEach((node, i) => {
    const x = X_OFFSET + node.col * COL_SPACING;
    const y = Y_OFFSET + node.row * ROW_SPACING;
    
    let w = BOX_WIDTH, h = BOX_HEIGHT;
    if (node.category === 'event') { w = 36; h = 36; }
    else if (node.category === 'gateway') { w = 50; h = 50; }

    positions[node.id] = { x, y, w, h };
    const escapedName = escapeXml(node.name);

    switch (node.type) {
      case 'startEvent': elements.push(`<bpmn:startEvent id="${node.id}" name="" />`); break;
      case 'endEvent': elements.push(`<bpmn:endEvent id="${node.id}" name="${escapedName}" />`); break;
      case 'exclusiveGateway': elements.push(`<bpmn:exclusiveGateway id="${node.id}" name="${escapedName}" isMarkerVisible="true" />`); break;
      case 'serviceTask': elements.push(`<bpmn:serviceTask id="${node.id}" name="${escapedName}" />`); break;
      default: elements.push(`<bpmn:userTask id="${node.id}" name="${escapedName}" />`);
    }

    diElements.push(`<bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}"><dc:Bounds x="${x - w/2}" y="${y - h/2}" width="${w}" height="${h}" /></bpmndi:BPMNShape>`);

    // SIDE DATA OBJECTS
    if (node.hasDataAssociation) {
      const dataId = `Data_${node.id}`;
      const dataX = x + 120; 
      const dataY = y - 70;
      elements.push(`<bpmn:dataObjectReference id="${dataId}" name="ሰነድ" dataObjectRef="DO_${node.id}" />`);
      elements.push(`<bpmn:dataObject id="DO_${node.id}" />`);
      elements.push(`<bpmn:association id="Assoc_${node.id}" sourceRef="${node.id}" targetRef="${dataId}" />`);
      diElements.push(`
        <bpmndi:BPMNShape id="${dataId}_di" bpmnElement="${dataId}"><dc:Bounds x="${dataX - 18}" y="${dataY - 25}" width="36" height="50" /></bpmndi:BPMNShape>
        <bpmndi:BPMNEdge id="Assoc_${node.id}_di" bpmnElement="Assoc_${node.id}"><di:waypoint x="${x + w/2}" y="${y}" /><di:waypoint x="${dataX - 18}" y="${dataY}" /></bpmndi:BPMNEdge>`);
    }

    // CONNECT NODES
    if (i > 0) {
      const prev = nodeDefs[i-1];
      const s = positions[prev.id];
      const t = positions[node.id];
      const flowId = `Flow_${i}`;
      
      let label = "";
      if (prev.category === 'gateway') {
        label = (node.type === 'endEvent' || node.name.includes('ተመለስ')) ? "ካልጸደቀ" : "ከጸደቀ";
      }

      flows.push(`<bpmn:sequenceFlow id="${flowId}" ${label ? `name="${label}"` : ''} sourceRef="${prev.id}" targetRef="${node.id}" />`);
      
      diElements.push(`
        <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
          <di:waypoint x="${s.x + s.w/2}" y="${s.y}" />
          <di:waypoint x="${t.x - t.w/2}" y="${t.y}" />
          ${label ? `<bpmndi:BPMNLabel><dc:Bounds x="${(s.x + t.x)/2 - 30}" y="${(s.y + t.y)/2 - 20}" width="60" height="14" /></bpmndi:BPMNLabel>` : ''}
        </bpmndi:BPMNEdge>`);
    }
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" targetNamespace="http://bpmn.io/schema/bpmn" exporter="Worku Pro" exporterVersion="1.0">
  <bpmn:process id="Process_1" name="${escapeXml(title)}" isExecutable="true">
${elements.join('\n')}
${flows.join('\n')}
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
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

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
