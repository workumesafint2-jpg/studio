
'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import BpmnModeler from 'bpmn-js/lib/Modeler';

interface BPMNViewerProps {
  xml: string;
  title?: string;
}

export interface BPMNViewerRef {
  exportPNG: () => Promise<void>;
  exportSVG: () => Promise<void>;
  exportXML: () => Promise<void>;
  getXML: () => Promise<string>;
  getSVG: () => Promise<string>;
  fitViewport: () => void;
}

export const BPMNViewer = forwardRef<BPMNViewerRef, BPMNViewerProps>(({ xml, title = "Process Diagram" }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<any>(null);

  const fitViewport = () => {
    if (modelerRef.current) {
      const canvas = modelerRef.current.get('canvas');
      canvas.zoom('fit-viewport');
    }
  };

  useImperativeHandle(ref, () => ({
    fitViewport,
    getXML: async () => {
      if (!modelerRef.current) return '';
      try {
        const { xml: resultXml } = await modelerRef.current.saveXML({ format: true });
        return resultXml;
      } catch (err) {
        console.error('Error getting XML:', err);
        return '';
      }
    },
    getSVG: async () => {
      if (!modelerRef.current) return '';
      try {
        const { svg } = await modelerRef.current.saveSVG();
        return svg;
      } catch (err) {
        console.error('Error getting SVG:', err);
        return '';
      }
    },
    exportXML: async () => {
      if (!modelerRef.current) return;
      try {
        const { xml: resultXml } = await modelerRef.current.saveXML({ format: true });
        const blob = new Blob([resultXml], { type: 'application/xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${title.replace(/\s+/g, '-').toLowerCase()}.bpmn`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Error exporting BPMN XML:', err);
      }
    },
    exportSVG: async () => {
      if (!modelerRef.current) return;
      try {
        const { svg } = await modelerRef.current.saveSVG();
        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${title.replace(/\s+/g, '-').toLowerCase()}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Error exporting SVG:', err);
      }
    },
    exportPNG: async () => {
      if (!modelerRef.current) return;
      try {
        const { svg } = await modelerRef.current.saveSVG();
        const canvas = document.createElement('canvas');
        const img = new Image();
        const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = () => {
          const scale = 3; 
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const pngUrl = canvas.toDataURL('image/png', 1.0);
            const downloadLink = document.createElement('a');
            downloadLink.href = pngUrl;
            downloadLink.download = `${title.replace(/\s+/g, '-').toLowerCase()}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
          }
          URL.revokeObjectURL(url);
        };
        img.src = url;
      } catch (err) {
        console.error('Error exporting PNG:', err);
      }
    }
  }));

  useEffect(() => {
    if (!containerRef.current) return;
    const modeler = new BpmnModeler({
      container: containerRef.current,
      keyboard: { bindTo: window }
    });
    modelerRef.current = modeler;
    return () => modeler.destroy();
  }, []);

  useEffect(() => {
    if (modelerRef.current && xml) {
      modelerRef.current.importXML(xml).then(() => {
        fitViewport();
      });
    }
  }, [xml]);

  return (
    <div className="w-full h-full relative group bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div ref={containerRef} className="w-full h-full min-h-[600px]" />
      <div className="absolute bottom-4 left-4 flex gap-2">
        <Button variant="secondary" size="sm" className="h-7 text-[8px] font-bold uppercase shadow-sm bg-white/80 backdrop-blur-sm" onClick={fitViewport}>
          Auto-Fit View
        </Button>
      </div>
    </div>
  );
});

BPMNViewer.displayName = 'BPMNViewer';
