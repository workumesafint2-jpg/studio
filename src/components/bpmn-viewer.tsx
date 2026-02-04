
'use client';

import React, { useEffect, useRef } from 'react';
import BpmnViewer from 'bpmn-js/lib/NavigatedViewer';

interface BPMNViewerProps {
  xml: string;
}

export function BPMNViewer({ xml }: BPMNViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize the viewer
    viewerRef.current = new BpmnViewer({
      container: containerRef.current,
      keyboard: {
        bindTo: window
      }
    });

    // Clean up on unmount
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
}
