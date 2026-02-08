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

  // Directional Flow Triggers
  const flowDirectionTriggers = {
    forward: ['ከጸደቀ', 'approve', 'yes', 'ok'],
    loop: ['ካልጸደቀ', 'correction', 'fix', 'edit'],
    reject: ['ውድቅ', 'reject', 'no', 'cancel']
  };

  const nodeDefs: any[] = [];
  rawLines.forEach((line, index) => {
    const lowerLine = line.toLowerCase();
    let type = 'userTask'; // Default type
    let category = 'task';
    let flowLabel = '';
    let direction: 'forward' | 'loop' | 'reject' = 'forward';

    // Identify Flow Labels and Direction
    for (const [dir, triggers] of Object.entries(flowDirectionTriggers)) {
      for (const trigger of triggers) {
        if (lowerLine.includes(trigger)) {
          direction = dir as any;
          if (dir === 'forward') flowLabel = 'ከጸደቀ';
          if (dir === 'loop') flowLabel = 'ካልጸደቀ';
          if (dir === 'reject') flowLabel = 'Reject';
          break;
        }
      }
    }

    // Map Element Types
    if (mappings.start.some(k => lowerLine.includes(k))) { type = 'startEvent'; category = 'event'; }
    else if (mappings.end.some(k => lowerLine.includes(k))) { type = 'endEvent'; category = 'event'; }
    else if (mappings.timer.some(k => lowerLine.includes(k))) { type = 'timerEvent'; category = 'event'; }
    else if (mappings.exclusiveGateway.some(k => lowerLine.includes(k))) { type = 'exclusiveGateway'; category = 'gateway'; }
    else if (mappings.dataObject.some(k => lowerLine.includes(k))) { type = 'dataObject'; category = 'data'; }
    else if (mappings.parallelGateway.some(k => lowerLine.includes(k))) { type = 'parallelGateway'; category = 'gateway'; }
    else if (mappings.serviceTask.some(k => lowerLine.includes(k))) { type = 'serviceTask'; category = 'task'; }
    else if (mappings.manualTask.some(k => lowerLine.includes(k))) { type = 'manualTask'; category = 'task'; }

    // CLEANUP: Hide trigger keywords from the visible label
    let pureName = line;
    
    // Remove element type keywords
    Object.values(mappings).flat().forEach(k => {
      const regex = new RegExp(`^${k}\\s*[:\\-–—\\s]*|\\s*\\(${k}\\)`, 'gi');
      pureName = pureName.replace(regex, '');
    });

    // Remove direction triggers
    Object.values(flowDirectionTriggers).flat().forEach(k => {
      const regex = new RegExp(`^${k}\\s*[:\\-–—\\s]*`, 'gi');
      pureName = pureName.replace(regex, '');
    });

    // Remove junk/status text
    pureName = pureName.replace(/success|failed|done|ተሳክቷል/gi, '').replace(/[?፧？]$/, '').trim();

    nodeDefs.push({
      id: `Node_${index}`,
      name: pureName || line,
      type,
      category,
      index,
      flowLabel,
      direction
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

    // DI Shape
    diElements.push(`
      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}" ${node.type === 'exclusiveGateway' ? 'isMarkerVisible="true"' : ''}>
        <dc:Bounds x="${x - w/2}" y="${y - h/2}" width="${w}" height="${h}" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="${x - 60}" y="${y + h/2 + 5}" width="120" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>`);

    // Sequence Flow and Directional DI (Forward/Loop/Reject)
    if (lastNodeId) {
      const flowId = `Flow_${lastNodeId}_${node.id}`;
      const flowName = node.flowLabel ? escapeXml(node.flowLabel) : '';
      flows.push(`<bpmn:sequenceFlow id="${flowId}" name="${flowName}" sourceRef="${lastNodeId}" targetRef="${node.id}" />`);
      
      const sPos = positions[lastNodeId];
      const sEven = sPos.row % 2 === 0;

      if (sPos.row === row) {
        // Horizontal logic
        let waypoints = '';
        if (node.direction === 'loop') {
          // Upward loop visual
          waypoints = `
            <di:waypoint x="${sPos.x + (sPos.w/2 * (sEven ? 1 : -1))}" y="${sPos.y}" />
            <di:waypoint x="${sPos.x + (sPos.w/2 * (sEven ? 1 : -1))}" y="${sPos.y - 60}" />
            <di:waypoint x="${x - (w/2 * (sEven ? 1 : -1))}" y="${y - 60}" />
            <di:waypoint x="${x - (w/2 * (sEven ? 1 : -1))}" y="${y}" />`;
        } else if (node.direction === 'reject') {
          // Downward visual
          waypoints = `
            <di:waypoint x="${sPos.x + (sPos.w/2 * (sEven ? 1 : -1))}" y="${sPos.y}" />
            <di:waypoint x="${sPos.x + (sPos.w/2 * (sEven ? 1 : -1))}" y="${sPos.y + 60}" />
            <di:waypoint x="${x - (w/2 * (sEven ? 1 : -1))}" y="${y + 60}" />
            <di:waypoint x="${x - (w/2 * (sEven ? 1 : -1))}" y="${y}" />`;
        } else {
          // Straight Forward
          waypoints = `
            <di:waypoint x="${sPos.x + (sPos.w/2 * (sEven ? 1 : -1))}" y="${sPos.y}" />
            <di:waypoint x="${x - (w/2 * (sEven ? 1 : -1))}" y="${y}" />`;
        }

        diElements.push(`
          <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
            ${waypoints}
            <bpmndi:BPMNLabel>
              <dc:Bounds x="${(sPos.x + x) / 2 - 25}" y="${node.direction === 'loop' ? y - 75 : (node.direction === 'reject' ? y + 65 : y - 20)}" width="50" height="14" />
            </bpmndi:BPMNLabel>
          </bpmndi:BPMNEdge>`);
      } else {
        // Snake Wrap logic
        const verticalOffset = node.direction === 'loop' ? -40 : (node.direction === 'reject' ? 40 : 0);
        diElements.push(`
          <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
            <di:waypoint x="${sPos.x}" y="${sPos.y + (sPos.h/2 * (verticalOffset >= 0 ? 1 : -1))}" />
            <di:waypoint x="${sPos.x}" y="${y - (h/2 + verticalOffset)}" />
            <di:waypoint x="${x}" y="${y - (h/2 + verticalOffset)}" />
            <di:waypoint x="${x}" y="${y - h/2}" />
            <bpmndi:BPMNLabel>
              <dc:Bounds x="${(sPos.x + x) / 2 - 25}" y="${y - (h/2 + verticalOffset + 15)}" width="50" height="14" />
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
