'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import 'bpmn-js/dist/assets/bpmn-js.css';

interface BPMNViewerProps {
  xml: string;
  title?: string;
}

export interface BPMNViewerRef {
  exportPNG: () => Promise<void>;
  exportSVG: () => Promise<void>;
  exportXML: () => Promise<void>;
  getXML: () => Promise<string>;
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
      const { xml: resultXml } = await modelerRef.current.saveXML({ format: true });
      return resultXml || '';
    },
    exportXML: async () => {
      if (!modelerRef.current) return;
      const { xml: resultXml } = await modelerRef.current.saveXML({ format: true });
      if (!resultXml) return;
      const blob = new Blob([resultXml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/\s+/g, '-').toLowerCase()}.bpmn`;
      link.click();
      URL.revokeObjectURL(url);
    },
    exportSVG: async () => {
      if (!modelerRef.current) return;
      const { svg } = await modelerRef.current.saveSVG();
      if (!svg) return;
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/\s+/g, '-').toLowerCase()}.svg`;
      link.click();
      URL.revokeObjectURL(url);
    },
    exportPNG: async () => {
      if (!modelerRef.current) return;
      const { svg } = await modelerRef.current.saveSVG();
      if (!svg) return;
      const canvas = document.createElement('canvas');
      const img = new Image();
      const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        canvas.width = img.width * 2;
        canvas.height = img.height * 2;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const pngUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = `${title.replace(/\s+/g, '-').toLowerCase()}.png`;
          downloadLink.click();
        }
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }
  }));

  useEffect(() => {
    if (!containerRef.current) return;
    const modeler = new BpmnModeler({ 
      container: containerRef.current,
      keyboard: {
        bindTo: window
      }
    });
    modelerRef.current = modeler;
    return () => { modeler.destroy(); };
  }, []);

  useEffect(() => {
    if (modelerRef.current && xml) {
      modelerRef.current.importXML(xml).then(() => fitViewport()).catch(err => console.error(err));
    }
  }, [xml]);

  return (
    <div className="absolute inset-0 w-full h-full bg-white overflow-hidden rounded-[3.5rem]">
      <div ref={containerRef} className="w-full h-full bpmn-modeler-container" />
      <style jsx global>{`
        .bpmn-modeler-container {
          height: 100% !important;
          width: 100% !important;
          outline: none !important;
        }
        .bpmn-modeler-container .bjs-powered-by {
          display: none !important;
        }
        .djs-palette {
          top: 40px !important;
          left: 40px !important;
          border-radius: 24px !important;
          border: 1px solid #f1f5f9 !important;
          box-shadow: 0 20px 40px rgba(0,0,0,0.06) !important;
          padding: 16px !important;
          background: white !important;
          height: auto !important;
          max-height: calc(100% - 80px) !important;
          overflow-y: auto !important;
          width: auto !important;
        }
        .djs-palette-entries {
          display: flex !important;
          flex-direction: column !important;
          gap: 16px !important;
        }
        .djs-palette .entry {
          width: 36px !important;
          height: 36px !important;
          line-height: 36px !important;
          font-size: 22px !important;
          color: #64748b !important;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .djs-palette .entry:hover {
          color: #1e3a8a !important;
          transform: scale(1.15);
          background-color: #f8fafc !important;
          border-radius: 12px !important;
        }
        .djs-context-pad {
          border-radius: 16px !important;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1) !important;
          border: 1px solid #f1f5f9 !important;
        }
        .djs-outline {
          stroke: #1e3a8a !important;
          stroke-opacity: 0.1 !important;
        }
      `}</style>
    </div>
  );
});

BPMNViewer.displayName = 'BPMNViewer';