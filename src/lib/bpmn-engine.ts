export function generateBPMN(input: string, title: string = "Process Diagram"): string {
  if (!input.trim()) return '';

  const rawLines = input.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  // Advanced BPMN 2.0 Trigger Mapping (Amharic & English)
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

  const flowLabelTriggers = ['ከጸደቀ', 'ካልጸደቀ', 'ውድቅ', 'approve', 'reject'];

  const nodeDefs: any[] = [];
  rawLines.forEach((line, index) => {
    const lowerLine = line.toLowerCase();
    let type = 'userTask'; // Default
    let category = 'task';
    let flowLabel = '';

    // Identify Flow Labels (Directional Labeling)
    for (const trigger of flowLabelTriggers) {
      if (lowerLine.startsWith(trigger)) {
        flowLabel = trigger === 'ውድቅ' ? 'Reject' : trigger;
        break;
      }
    }

    // Identify BPMN Element Type
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

    // AGGRESSIVE COMMAND CLEANUP: Remove ALL keywords from visual label
    let pureName = line;
    
    // Remove directional triggers first
    flowLabelTriggers.forEach(trigger => {
      const regex = new RegExp(`^${trigger}\\s*[:\\-–—\\s]*`, 'i');
      pureName = pureName.replace(regex, '');
    });

    // Remove all BPMN command keywords
    Object.values(mappings).flat().forEach(k => {
      const regex = new RegExp(`^${k}\\s*[:\\-–—\\s]*`, 'i');
      pureName = pureName.replace(regex, '');
    });

    // Remove junk punctuation
    pureName = pureName.replace(/[?፧？]$/, '').trim();

    nodeDefs.push({
      id: `Node_${index}`,
      name: pureName || line,
      type,
      category,
      index,
      flowLabel
    });
  });

  const elements: string[] = [];
  const flows: string[] = [];
  const diElements: string[] = [];

  const MAX_COLS = 5;
  const COL_SPACING = 240;
  const ROW_SPACING = 260;
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
    
    let w = 120, h = 80;
    if (node.category === 'event') { w = 36; h = 36; }
    else if (node.category === 'gateway') { w = 50; h = 50; }
    else if (node.category === 'data') { w = 40; h = 60; }

    positions[node.id] = { x, y, w, h, row, col };

    // XML Element Generation
    switch (node.type) {
      case 'startEvent': elements.push(`<bpmn:startEvent id="${node.id}" name="${escapeXml(node.name)}" />`); break;
      case 'endEvent': elements.push(`<bpmn:endEvent id="${node.id}" name="${escapeXml(node.name)}" />`); break;
      case 'timerEvent': elements.push(`<bpmn:intermediateCatchEvent id="${node.id}" name="${escapeXml(node.name)}"><bpmn:timerEventDefinition id="T_${node.id}" /></bpmn:intermediateCatchEvent>`); break;
      case 'messageEvent': elements.push(`<bpmn:intermediateCatchEvent id="${node.id}" name="${escapeXml(node.name)}"><bpmn:messageEventDefinition id="M_${node.id}" /></bpmn:intermediateCatchEvent>`); break;
      case 'errorEvent': elements.push(`<bpmn:intermediateThrowEvent id="${node.id}" name="${escapeXml(node.name)}"><bpmn:errorEventDefinition id="E_${node.id}" /></bpmn:intermediateThrowEvent>`); break;
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
          <dc:Bounds x="${x - 60}" y="${y + h/2 + 5}" width="120" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>`);

    // Sequence Flows (Snake Logic + Conditional Labels)
    if (lastNodeId) {
      const flowId = `Flow_${lastNodeId}_${node.id}`;
      const flowName = node.flowLabel ? escapeXml(node.flowLabel) : '';
      flows.push(`<bpmn:sequenceFlow id="${flowId}" name="${flowName}" sourceRef="${lastNodeId}" targetRef="${node.id}" />`);
      
      const sPos = positions[lastNodeId];
      const isEvenRow = sPos.row % 2 === 0;

      if (sPos.row === row) {
        // Horizontal Flow
        diElements.push(`
          <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
            <di:waypoint x="${sPos.x + (sPos.w/2 * (isEvenRow ? 1 : -1))}" y="${sPos.y}" />
            <di:waypoint x="${x - (w/2 * (isEvenRow ? 1 : -1))}" y="${y}" />
            <bpmndi:BPMNLabel>
              <dc:Bounds x="${(sPos.x + x) / 2 - 20}" y="${sPos.y - 20}" width="40" height="14" />
            </bpmndi:BPMNLabel>
          </bpmndi:BPMNEdge>`);
      } else {
        // Row Wrap (Vertical Snake)
        diElements.push(`
          <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
            <di:waypoint x="${sPos.x}" y="${sPos.y + sPos.h/2}" />
            <di:waypoint x="${sPos.x}" y="${y - h/2 - 40}" />
            <di:waypoint x="${x}" y="${y - h/2 - 40}" />
            <di:waypoint x="${x}" y="${y - h/2}" />
            <bpmndi:BPMNLabel>
              <dc:Bounds x="${sPos.x + 5}" y="${sPos.y + sPos.h/2 + 10}" width="40" height="14" />
            </bpmndi:BPMNLabel>
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
