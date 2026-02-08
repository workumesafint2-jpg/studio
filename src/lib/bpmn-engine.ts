export function generateBPMN(input: string, title: string = "Process Diagram"): string {
  if (!input.trim()) return '';

  const rawLines = input.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  // Amharic & English Keywords for BPMN 2.0 Mapping
  const mappings = {
    start: ['ጀምር', 'መጀመሪያ', 'start', 'begin'],
    end: ['ጨርስ', 'መጨረሻ', 'ተጠናቀቀ', 'end', 'finish'],
    timer: ['ቆይታ', 'ሰዓት', 'ቀን', 'timer', 'wait'],
    message: ['መልዕክት', 'ደብዳቤ', 'message', 'mail'],
    error: ['ስህተት', 'ተቋረጠ', 'ውድቅ', 'error', 'fault'],
    signal: ['ምልክት', 'ሲግናል', 'signal', 'alert'],
    compensate: ['ማካካሻ', 'compensate'],
    terminate: ['ማቋረጫ', 'terminate', 'kill'],
    userTask: ['ተግባር', 'ይከናወናል', 'ይደረጋል', 'approve', 'review', 'verify', 'user'],
    serviceTask: ['በሲስተም', 'አውቶማቲክ', 'ስክሪፕት', 'service', 'script', 'system', 'auto'],
    manualTask: ['በእጅ', 'ፊዚካል', 'manual', 'physical'],
    callActivity: ['ጥሪ', 'ሌላ ሂደት', 'call', 'external'],
    exclusiveGateway: ['ውሳኔ', 'ከሆነ', 'ወይስ', 'ቢሆን', 'decision', 'xor', 'if'],
    parallelGateway: ['በአንድ ጊዜ', 'እና', 'ትይዩ', 'parallel', 'and', 'simultaneous'],
    inclusiveGateway: ['አንድ ወይም ከዚያ በላይ', 'inclusive', 'or'],
    complexGateway: ['ውስብስብ ውሳኔ', 'complex'],
    eventGateway: ['በሁኔታ ላይ የተመሰረተ', 'event-based'],
    dataObject: ['ሰነድ', 'ፎርም', 'ማስረጃ', 'ደረሰኝ', 'document', 'form'],
    dataStore: ['መዝገብ', 'መረጃ ቋት', 'ዳታቤዝ', 'database', 'store', 'record']
  };

  const nodeDefs: any[] = [];
  rawLines.forEach((line, index) => {
    const lowerLine = line.toLowerCase();
    let type = 'userTask'; // Default
    let category = 'task';

    // Identify Type
    if (mappings.start.some(k => lowerLine.includes(k))) { type = 'startEvent'; category = 'event'; }
    else if (mappings.end.some(k => lowerLine.includes(k))) { type = 'endEvent'; category = 'event'; }
    else if (mappings.timer.some(k => lowerLine.includes(k))) { type = 'timerEvent'; category = 'event'; }
    else if (mappings.message.some(k => lowerLine.includes(k))) { type = 'messageEvent'; category = 'event'; }
    else if (mappings.error.some(k => lowerLine.includes(k))) { type = 'errorEvent'; category = 'event'; }
    else if (mappings.signal.some(k => lowerLine.includes(k))) { type = 'signalEvent'; category = 'event'; }
    else if (mappings.terminate.some(k => lowerLine.includes(k))) { type = 'terminateEvent'; category = 'event'; }
    else if (mappings.exclusiveGateway.some(k => lowerLine.includes(k))) { type = 'exclusiveGateway'; category = 'gateway'; }
    else if (mappings.parallelGateway.some(k => lowerLine.includes(k))) { type = 'parallelGateway'; category = 'gateway'; }
    else if (mappings.inclusiveGateway.some(k => lowerLine.includes(k))) { type = 'inclusiveGateway'; category = 'gateway'; }
    else if (mappings.serviceTask.some(k => lowerLine.includes(k))) { type = 'serviceTask'; category = 'task'; }
    else if (mappings.manualTask.some(k => lowerLine.includes(k))) { type = 'manualTask'; category = 'task'; }
    else if (mappings.callActivity.some(k => lowerLine.includes(k))) { type = 'callActivity'; category = 'task'; }
    else if (mappings.dataObject.some(k => lowerLine.includes(k))) { type = 'dataObject'; category = 'data'; }
    else if (mappings.dataStore.some(k => lowerLine.includes(k))) { type = 'dataStore'; category = 'data'; }

    // Pure Name Cleanup (Remove all keywords)
    let pureName = line;
    Object.values(mappings).flat().forEach(k => {
      const regex = new RegExp(`^${k}\\s*[:\\-–—\\s]*`, 'i');
      pureName = pureName.replace(regex, '');
    });
    pureName = pureName.replace(/[?፧？]$/, '').trim();

    nodeDefs.push({
      id: `Node_${index}`,
      name: pureName || line,
      type,
      category,
      index
    });
  });

  const elements: string[] = [];
  const flows: string[] = [];
  const diElements: string[] = [];

  const MAX_COLS = 5;
  const COL_SPACING = 220;
  const ROW_SPACING = 240;
  const X_START = 150;
  const Y_START = 200;

  const positions: Record<string, { x: number, y: number, w: number, h: number, row: number, col: number }> = {};
  let lastNodeId: string | null = null;

  nodeDefs.forEach((node, i) => {
    const row = Math.floor(i / MAX_COLS);
    const rawCol = i % MAX_COLS;
    const isEvenRow = row % 2 === 0;
    const col = isEvenRow ? rawCol : (MAX_COLS - 1 - rawCol);

    const x = X_START + col * COL_SPACING;
    const y = Y_START + row * ROW_SPACING;
    
    let w = 120, h = 80; // Default Task size
    if (node.category === 'event') { w = 36; h = 36; }
    else if (node.category === 'gateway') { w = 50; h = 50; }
    else if (node.category === 'data') { w = 40; h = 60; }

    positions[node.id] = { x, y, w, h, row, col };

    // Generate XML Elements
    switch (node.type) {
      case 'startEvent': elements.push(`<bpmn:startEvent id="${node.id}" name="${escapeXml(node.name)}" />`); break;
      case 'endEvent': elements.push(`<bpmn:endEvent id="${node.id}" name="${escapeXml(node.name)}" />`); break;
      case 'timerEvent': elements.push(`<bpmn:intermediateCatchEvent id="${node.id}" name="${escapeXml(node.name)}"><bpmn:timerEventDefinition id="T_${node.id}" /></bpmn:intermediateCatchEvent>`); break;
      case 'messageEvent': elements.push(`<bpmn:intermediateCatchEvent id="${node.id}" name="${escapeXml(node.name)}"><bpmn:messageEventDefinition id="M_${node.id}" /></bpmn:intermediateCatchEvent>`); break;
      case 'terminateEvent': elements.push(`<bpmn:endEvent id="${node.id}" name="${escapeXml(node.name)}"><bpmn:terminateEventDefinition id="Term_${node.id}" /></bpmn:endEvent>`); break;
      case 'exclusiveGateway': elements.push(`<bpmn:exclusiveGateway id="${node.id}" name="${escapeXml(node.name)}" isMarkerVisible="true" />`); break;
      case 'parallelGateway': elements.push(`<bpmn:parallelGateway id="${node.id}" name="${escapeXml(node.name)}" />`); break;
      case 'inclusiveGateway': elements.push(`<bpmn:inclusiveGateway id="${node.id}" name="${escapeXml(node.name)}" />`); break;
      case 'serviceTask': elements.push(`<bpmn:serviceTask id="${node.id}" name="${escapeXml(node.name)}" />`); break;
      case 'manualTask': elements.push(`<bpmn:manualTask id="${node.id}" name="${escapeXml(node.name)}" />`); break;
      case 'callActivity': elements.push(`<bpmn:callActivity id="${node.id}" name="${escapeXml(node.name)}" />`); break;
      case 'dataObject': elements.push(`<bpmn:dataObjectReference id="${node.id}" name="${escapeXml(node.name)}" dataObjectRef="DO_${node.id}" /><bpmn:dataObject id="DO_${node.id}" />`); break;
      case 'dataStore': elements.push(`<bpmn:dataStoreReference id="${node.id}" name="${escapeXml(node.name)}" />`); break;
      default: elements.push(`<bpmn:userTask id="${node.id}" name="${escapeXml(node.name)}" />`);
    }

    // DI Shape
    diElements.push(`
      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}" ${node.type === 'exclusiveGateway' ? 'isMarkerVisible="true"' : ''}>
        <dc:Bounds x="${x - w/2}" y="${y - h/2}" width="${w}" height="${h}" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${x - 40}" y="${y + h/2 + 5}" width="80" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>`);

    // Sequence Flows (Snake Logic)
    if (lastNodeId) {
      const flowId = `Flow_${lastNodeId}_${node.id}`;
      flows.push(`<bpmn:sequenceFlow id="${flowId}" sourceRef="${lastNodeId}" targetRef="${node.id}" />`);
      
      const sPos = positions[lastNodeId];
      if (sPos.row === row) {
        // Horizontal
        diElements.push(`
          <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
            <di:waypoint x="${sPos.x + (sPos.w/2 * (isEvenRow ? 1 : -1))}" y="${sPos.y}" />
            <di:waypoint x="${x - (w/2 * (isEvenRow ? 1 : -1))}" y="${y}" />
          </bpmndi:BPMNEdge>`);
      } else {
        // Row Wrap (Vertical drop)
        diElements.push(`
          <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
            <di:waypoint x="${sPos.x}" y="${sPos.y + sPos.h/2}" />
            <di:waypoint x="${sPos.x}" y="${y - h/2 - 40}" />
            <di:waypoint x="${x}" y="${y - h/2 - 40}" />
            <di:waypoint x="${x}" y="${y - h/2}" />
          </bpmndi:BPMNEdge>`);
      }
    }
    lastNodeId = node.id;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                  id="Definitions_Worku"
                  targetNamespace="http://bpmn.io/schema/bpmn"
                  exporter="Worku (ወርቁ) Pro Architect" 
                  exporterVersion="8.0">
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
