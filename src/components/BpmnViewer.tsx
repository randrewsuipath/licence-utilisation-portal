import { useEffect, useRef } from 'react';
import BpmnViewer from 'bpmn-js/lib/NavigatedViewer';

interface BpmnViewerProps {
    xml: string;
    className?: string;
}

export function BpmnDiagramViewer({ xml, className = '' }: BpmnViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<BpmnViewer | null>(null);

    useEffect(() => {
        if (!containerRef.current || !xml) return;

        // Create viewer instance
        const viewer = new BpmnViewer({
            container: containerRef.current,
            width: '100%',
            height: '600px',
        });

        viewerRef.current = viewer;

        // Import BPMN XML
        viewer.importXML(xml).then(({ warnings }) => {
            if (warnings.length) {
                console.warn('BPMN import warnings:', warnings);
            }

            // Fit diagram to viewport
            const canvas = viewer.get('canvas') as any;
            canvas.zoom('fit-viewport');
        }).catch((err: Error) => {
            console.error('Failed to import BPMN diagram:', err);
        });

        // Cleanup
        return () => {
            viewer.destroy();
        };
    }, [xml]);

    return (
        <div
            ref={containerRef}
            className={`bpmn-container border rounded-lg bg-white ${className}`}
            style={{ minHeight: '600px' }}
        />
    );
}

