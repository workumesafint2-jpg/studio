'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import BpmnViewer from 'bpmn-js/lib/NavigatedViewer';

interface BPMNViewerProps {
  xml: string;
  title?: string;
}

export interface BPMNViewerRef {
  exportPNG: () => Promise<void>;
}

export const BPMNViewer = forwardRef<BPMNViewerRef, BPMNViewerProps>(({ xml, title = "Process Diagram" }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    exportPNG: async () => {
      if (!viewerRef.current) return;

      try {
        const { svg } = await viewerRef.current.saveSVG();
        
        const canvas = document.createElement('canvas');
        const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          const padding = 100;
          const headerHeight = 100;
          
          canvas.width = img.width + padding * 2;
          canvas.height = img.height + padding * 2 + headerHeight;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw Title Header
            ctx.fillStyle = '#111827'; 
            ctx.font = 'bold 40px "Inter", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(title, canvas.width / 2, 60);
            
            // Subtle Border
            ctx.strokeStyle = '#E5E7EB';
            ctx.lineWidth = 1;
            ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
            
            // Draw Diagram
            ctx.drawImage(img, padding, padding + headerHeight);
            
            // standard PNG encoding
            const pngUrl = canvas.toDataURL('image/png', 1.0);
            const downloadLink = document.createElement('a');
            downloadLink.href = pngUrl;
            downloadLink.download = `${title.replace(/\s+/g, '-').toLowerCase()}-bpmn.png`;
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

    viewerRef.current = new BpmnViewer({
      container: containerRef.current,
      keyboard: {
        bindTo: window
      }
    });

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    const importDiagram = async () => {
      if (viewerRef.current && xml) {
        try {
          await viewerRef.current.importXML(xml);
          const canvas = viewerRef.current.get('canvas');
          canvas.zoom('fit-viewport');
        } catch (err) {
          console.error('Error rendering BPMN diagram:', err);
        }
      }
    };

    importDiagram();
  }, [xml]);

  return (
    <div className="w-full h-full relative group bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="absolute top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-sm py-2 px-4 border-b border-slate-100 flex items-center justify-center">
        <h2 className="text-sm font-semibold text-slate-900 truncate uppercase tracking-tight">
          {title}
        </h2>
      </div>

      <div 
        ref={containerRef} 
        className="w-full h-full min-h-[500px] pt-12"
      />
      
      <div className="absolute bottom-4 right-4 bg-slate-900/5 text-slate-500 px-3 py-1 rounded-full text-[10px] font-medium pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        Scroll to Zoom • Drag to Pan
      </div>
    </div>
  );
});

BPMNViewer.displayName = 'BPMNViewer';
