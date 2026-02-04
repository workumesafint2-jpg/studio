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
        img.onload = () => {
          const padding = 60;
          const headerHeight = 80;
          
          canvas.width = img.width + padding * 2;
          canvas.height = img.height + padding * 2 + headerHeight;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw Title Header
            ctx.fillStyle = '#1a365d'; // Professional Navy
            ctx.font = 'bold 32px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(title, canvas.width / 2, 50);
            
            // Draw a subtle line under title
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(padding, 70);
            ctx.lineTo(canvas.width - padding, 70);
            ctx.stroke();
            
            // Draw Diagram
            ctx.drawImage(img, padding, padding + headerHeight);
            
            const pngUrl = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.href = pngUrl;
            downloadLink.download = `${title.replace(/\s+/g, '-').toLowerCase()}-diagram.png`;
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
      container: containerRef.current
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
    <div className="w-full h-full relative group">
      {/* Title Overlay in Viewer */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white/90 backdrop-blur-md py-3 px-6 border-b border-muted flex items-center justify-center">
        <h2 className="text-xl font-bold text-primary truncate">
          {title}
        </h2>
      </div>

      <div 
        ref={containerRef} 
        className="w-full h-full min-h-[500px] bg-white rounded-xl shadow-inner border border-muted pt-14"
      />
      
      <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] text-muted-foreground border border-muted shadow-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        Use mouse wheel to zoom • Drag to pan
      </div>
    </div>
  );
});

BPMNViewer.displayName = 'BPMNViewer';
