'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';

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
  const modelerRef = useRef<BpmnModeler | null>(null);

  const fitViewport = () => {
    if (modelerRef.current) {
      const canvas: any = modelerRef.current.get('canvas');
      canvas.zoom('fit-viewport');
    }
  };

  useImperativeHandle(ref, () => ({
    fitViewport,
    getXML: async () => {
      if (!modelerRef.current) return '';
      try {
        const { xml: resultXml } = await modelerRef.current.saveXML({ format: true });
        return resultXml || '';
      } catch (err) {
        console.error('Error getting XML:', err);
        return '';
      }
    },
    getSVG: async () => {
      if (!modelerRef.current) return '';
      try {
        const { svg } = await modelerRef.current.saveSVG();
        return svg || '';
      } catch (err) {
        console.error('Error getting SVG:', err);
        return '';
      }
    },
    exportXML: async () => {
      if (!modelerRef.current) return;
      try {
        const { xml: resultXml } = await modelerRef.current.saveXML({ format: true });
        if (!resultXml) return;
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
        if (!svg) return;
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
        if (!svg) return;
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
    
    // In bpmn-js v18+, keyboard binding is now implicit.
    // Explicit binding to window has been removed.
    const modeler = new BpmnModeler({
      container: containerRef.current
    });
    
    modelerRef.current = modeler;
    
    return () => {
      if (modelerRef.current) {
        modelerRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (modelerRef.current && xml) {
      modelerRef.current.importXML(xml).then(() => {
        fitViewport();
      }).catch(err => {
        console.error('Error importing XML:', err);
      });
    }
  }, [xml]);

  return (
    <div className="w-full h-full relative group bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div ref={containerRef} className="w-full h-full min-h-[600px] bpmn-viewer-container" />
      <style jsx global>{`
        .bpmn-viewer-container .bjs-powered-by {
          display: none;
        }
      `}</style>
    </div>
  );
});

BPMNViewer.displayName = 'BPMNViewer';