'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import BpmnViewer from 'bpmn-js/lib/NavigatedViewer';

interface BPMNViewerProps {
  xml: string;
}

export interface BPMNViewerRef {
  exportPNG: () => Promise<void>;
}

export const BPMNViewer = forwardRef<BPMNViewerRef, BPMNViewerProps>(({ xml }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    exportPNG: async () => {
      if (!viewerRef.current) return;

      try {
        const { svg } = await viewerRef.current.saveSVG();
        
        // Create a canvas element
        const canvas = document.createElement('canvas');
        const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        const img = new Image();
        img.onload = () => {
          // Add some padding to the exported image
          const padding = 40;
          canvas.width = img.width + padding * 2;
          canvas.height = img.height + padding * 2;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Set white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw the diagram
            ctx.drawImage(img, padding, padding);
            
            // Trigger download
            const pngUrl = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.href = pngUrl;
            downloadLink.download = 'process-diagram.png';
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
      <div 
        ref={containerRef} 
        className="w-full h-full min-h-[500px] bg-white rounded-xl shadow-inner border border-muted"
      />
      <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] text-muted-foreground border border-muted shadow-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        Use mouse wheel to zoom • Drag to pan
      </div>
    </div>
  );
});

BPMNViewer.displayName = 'BPMNViewer';
