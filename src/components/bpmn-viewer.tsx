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
  const isImporting = useRef<boolean>(false);

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
          const headerHeight = 120;
          
          canvas.width = img.width + padding * 2;
          canvas.height = img.height + padding * 2 + headerHeight;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#1e3a8a'; 
            ctx.font = 'bold 48px "Inter", "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(title, canvas.width / 2, 70);
            
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 2;
            ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);
            
            ctx.drawImage(img, padding, padding + headerHeight);
            
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

    // Ensure we start with a clean container
    containerRef.current.innerHTML = '';

    const viewer = new BpmnViewer({
      container: containerRef.current
    });

    viewerRef.current = viewer;

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const importDiagram = async () => {
      if (viewerRef.current && xml && !isImporting.current) {
        try {
          isImporting.current = true;
          
          // Small delay to ensure the DOM is ready for the engine
          await new Promise(resolve => setTimeout(resolve, 50));
          
          await viewerRef.current.importXML(xml);
          
          const canvas = viewerRef.current?.get('canvas');
          if (canvas) {
            canvas.zoom('fit-viewport');
          }
        } catch (err) {
          console.error('Error rendering BPMN diagram:', err);
        } finally {
          isImporting.current = false;
        }
      }
    };

    importDiagram();
  }, [xml]);

  return (
    <div className="w-full h-full relative group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="absolute top-0 left-0 right-0 z-10 bg-white/90 backdrop-blur-md py-3 px-6 border-b border-slate-100 flex items-center justify-center">
        <h2 className="text-sm font-bold text-primary truncate uppercase tracking-widest">
          {title}
        </h2>
      </div>

      <div 
        ref={containerRef} 
        className="w-full h-full min-h-[500px] pt-14"
      />
      
      <div className="absolute bottom-6 right-6 bg-slate-900/10 text-slate-600 px-4 py-1.5 rounded-full text-[10px] font-bold pointer-events-none opacity-0 group-hover:opacity-100 transition-all">
        Pan: Drag • Zoom: Scroll
      </div>
    </div>
  );
});

BPMNViewer.displayName = 'BPMNViewer';