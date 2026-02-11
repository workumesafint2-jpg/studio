'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import BpmnViewer from 'bpmn-js/lib/NavigatedViewer';

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
  const viewerRef = useRef<any>(null);
  const isImporting = useRef<boolean>(false);

  useImperativeHandle(ref, () => ({
    exportSVG: async () => {
      if (!viewerRef.current) return;
      try {
        const { svg } = await viewerRef.current.saveSVG();
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
      if (!viewerRef.current) return;

      try {
        const { svg } = await viewerRef.current.saveSVG();
        
        const canvas = document.createElement('canvas');
        const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          // Rule: Use high resolution for PNG (2x scale)
          const scale = 2;
          const padding = 100 * scale;
          
          canvas.width = (img.width * scale) + padding * 2;
          canvas.height = (img.height * scale) + padding * 2;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // High quality background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Scaled image draw for high resolution
            ctx.drawImage(img, padding, padding, img.width * scale, img.height * scale);
            
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
      <div 
        ref={containerRef} 
        className="w-full h-full min-h-[500px]"
      />
      
      <div className="absolute bottom-6 right-6 bg-slate-900/10 text-slate-600 px-4 py-1.5 rounded-full text-[10px] font-bold pointer-events-none opacity-0 group-hover:opacity-100 transition-all">
        Pan: Drag • Zoom: Scroll
      </div>
    </div>
  );
});

BPMNViewer.displayName = 'BPMNViewer';
