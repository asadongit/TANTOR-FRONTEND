import React, { useState, useEffect, useCallback } from 'react';
import { Table, ChevronLeft, Code, Map, AlertCircle, Download, Camera, FileText } from 'lucide-react';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    MarkerType,
    Handle,
    Position,
    useReactFlow,
    ReactFlowProvider,
    getNodesBounds,
    getViewportForBounds,
} from 'reactflow';
import 'reactflow/dist/style.css';

const toPdf = async (viewport, nodes, edges, filename = 'reactflow-diagram.pdf') => {
    try {
        const reactFlowElement = document.querySelector('.react-flow');
        const reactFlowViewport = document.querySelector('.react-flow__viewport');
       
        if (!reactFlowElement || !reactFlowViewport) {
            throw new Error('ReactFlow element not found');
        }
 
        if (!window.html2canvas) {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
        }
       
        if (!window.jspdf) {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        }
 
        if (nodes.length === 0) {
            throw new Error('No nodes found to export');
        }

        const originalViewport = { ...viewport };
        const originalStyle = {
            width: reactFlowElement.style.width,
            height: reactFlowElement.style.height,
            overflow: reactFlowElement.style.overflow,
            position: reactFlowElement.style.position
        };
        const originalTransform = reactFlowViewport.style.transform;
        
        const nodesBounds = getNodesBounds(nodes);
        
        const padding = 100;
        const totalWidth = nodesBounds.width + (padding * 2);
        const totalHeight = nodesBounds.height + (padding * 2);

        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.top = '-9999px';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = `${totalWidth}px`;
        tempContainer.style.height = `${totalHeight}px`;
        tempContainer.style.overflow = 'visible';
        tempContainer.style.backgroundColor = '#ffffff';
        tempContainer.className = 'react-flow temp-export-container';
        
        const clonedViewport = reactFlowViewport.cloneNode(true);
        clonedViewport.style.transform = `translate(${padding - nodesBounds.x}px, ${padding - nodesBounds.y}px) scale(1)`;
        tempContainer.appendChild(clonedViewport);
        
        document.body.appendChild(tempContainer);

        await new Promise(resolve => setTimeout(resolve, 300));

        const svgElements = tempContainer.querySelectorAll('svg');
        svgElements.forEach(svg => {
            svg.style.overflow = 'visible';
        });

        const edgeElements = tempContainer.querySelectorAll('.react-flow__edge');
        edgeElements.forEach(edge => {
            edge.style.visibility = 'visible';
            edge.style.display = 'block';
        });

        await new Promise(resolve => setTimeout(resolve, 100));
 
        const canvas = await window.html2canvas(tempContainer, {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true,
            allowTaint: true,
            width: totalWidth,
            height: totalHeight,
            scrollX: 0,
            scrollY: 0,
            ignoreElements: (element) => {
                // Ignore controls and other UI elements
                return element.classList.contains('react-flow__controls') ||
                       element.classList.contains('react-flow__minimap') ||
                       element.classList.contains('react-flow__attribution');
            }
        });

        document.body.removeChild(tempContainer);
 
        const imgData = canvas.toDataURL('image/png');
        let jsPDF;
       
        if (window.jspdf && window.jspdf.jsPDF) {
            jsPDF = window.jspdf.jsPDF;
        } else if (window.jsPDF) {
            jsPDF = window.jsPDF;
        } else if (window.jspdf) {
            jsPDF = window.jspdf;
        } else {
            throw new Error('jsPDF library not found');
        }
 
        const aspectRatio = canvas.width / canvas.height;
        const isLandscape = aspectRatio > 1.4;
       
        let pdfWidth, pdfHeight, imgWidth, imgHeight;
       
        if (isLandscape) {
            pdfWidth = 297;
            pdfHeight = 210;
            imgWidth = pdfWidth - 20;
            imgHeight = (canvas.height * imgWidth) / canvas.width;
        } else {
            pdfWidth = 210;
            pdfHeight = 297;
            imgWidth = pdfWidth - 20;
            imgHeight = (canvas.height * imgWidth) / canvas.width;
        }
 
        const pdf = new jsPDF(isLandscape ? 'l' : 'p', 'mm', 'a4');
        let position = 10;
        let heightLeft = imgHeight;
 
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);
 
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight + 10;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= (pdfHeight - 20);
        }
 
        pdf.save(filename);
       
    } catch (error) {
        console.error('PDF generation failed:', error);
        throw error;
    }
};
 
const loadScript = (src) => {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
};
 
const DownloadHelper = ({ nodes, edges, TableName }) => {
    const { getViewport } = useReactFlow();
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState(null);
 
    const handleDownload = async () => {
        if (isDownloading) return;
        
        setIsDownloading(true);
        setDownloadError(null);
       
        try {
            const viewport = getViewport();
            const timestamp = new Date().toISOString().split('T')[0];
            const tableName = TableName?.split('.').pop() || 'diagram';
           
            await toPdf(viewport, nodes, edges, `${tableName}-mapping-${timestamp}.pdf`);
        } catch (error) {
            console.error('Download failed:', error);
            setDownloadError('Failed to generate PDF. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    useEffect(() => {
        if (downloadError) {
            const timer = setTimeout(() => setDownloadError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [downloadError]);
 
    return (
        <div className="relative">
            <button
                onClick={handleDownload}
                disabled={isDownloading || !nodes.length}
                className="flex items-center gap-2 px-4 py-2 bg-[#8d77ba] text-white rounded-lg hover:bg-[#7f6aa9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                title={!nodes.length ? 'No nodes to export' : 'Export diagram as PDF'}
            >
                {isDownloading ? (
                    <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Exporting...</span>
                    </>
                ) : (
                    <>
                        <Download className="h-4 w-4" />
                        <span>Export PDF</span>
                    </>
                )}
            </button>
            
            {downloadError && (
                <div className="absolute top-full left-0 mt-2 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-xs whitespace-nowrap z-10">
                    {downloadError}
                </div>
            )}
        </div>
    );
};

export default DownloadHelper;