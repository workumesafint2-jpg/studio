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
}

export const BPMNViewer = forwardRef<BPMNViewerRef, BPMNViewerProps>(({ xml, title = "Process Diagram" }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
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
          const scale = 2; // High Resolution
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const pngUrl = canvas.toDataURL('image/png');
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
      } catch (err) {}
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
        const canvas = modelerRef.current.get('canvas');
        canvas.zoom('fit-viewport');
      });
    }
  }, [xml]);

  return (
    <div className="w-full h-full relative group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div ref={containerRef} className="w-full h-full min-h-[600px]" />
      <div className="absolute bottom-4 left-4 flex gap-2">
        <div className="bg-slate-900/80 text-white px-3 py-1 rounded-full text-[10px] font-bold">
          MODELER MODE: DRAG & EDIT ENABLED
        </div>
      </div>
    </div>
  );
});

BPMNViewer.displayName = 'BPMNViewer';
