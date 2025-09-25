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

const toPdf = async (viewport, nodes, filename = 'reactflow-diagram.pdf') => {
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
 
        await new Promise(resolve => setTimeout(resolve, 100));
 
        if (nodes.length === 0) {
            throw new Error('No nodes found to export');
        }
 
        const nodesBounds = getNodesBounds(nodes);
        const padding = 50;
       
        const totalWidth = nodesBounds.width + (padding * 2);
        const totalHeight = nodesBounds.height + (padding * 2);
 
        const originalStyle = {
            width: reactFlowElement.style.width,
            height: reactFlowElement.style.height,
            overflow: reactFlowElement.style.overflow
        };
 
        reactFlowElement.style.width = `${totalWidth}px`;
        reactFlowElement.style.height = `${totalHeight}px`;
        reactFlowElement.style.overflow = 'visible';
 
        const originalTransform = reactFlowViewport.style.transform;
        reactFlowViewport.style.transform = `translate(${padding - nodesBounds.x}px, ${padding - nodesBounds.y}px) scale(1)`;
 
        await new Promise(resolve => setTimeout(resolve, 200));
 
        const canvas = await window.html2canvas(reactFlowElement, {
            backgroundColor: '#ffffff',
            scale: 1.5,
            useCORS: true,
            allowTaint: true,
            width: totalWidth,
            height: totalHeight,
            scrollX: 0,
            scrollY: 0,
        });
 
        reactFlowElement.style.width = originalStyle.width;
        reactFlowElement.style.height = originalStyle.height;
        reactFlowElement.style.overflow = originalStyle.overflow;
        reactFlowViewport.style.transform = originalTransform;
 
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
    }
};
 
const loadScript = (src) => {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
};
 
const DownloadHelper = ({ nodes, TableName }) => {
    const { getViewport } = useReactFlow();
    const [isDownloading, setIsDownloading] = useState(false);
 
    const handleDownload = async () => {
        setIsDownloading(true);
       
        try {
            const viewport = getViewport();
            const timestamp = new Date().toISOString().split('T')[0];
            const tableName = TableName?.split('.').pop() || 'diagram';
           
            await toPdf(viewport, nodes, `${tableName}-mapping-${timestamp}.pdf`);
        } catch (error) {
            console.error('Download failed:', error);
        } finally {
            setIsDownloading(false);
        }
    };
 
    return (
        <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 py-2 bg-[#8d77ba] text-white rounded-lg hover:bg-[#7f6aa9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
            {isDownloading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
                <Download className="h-4 w-4" />
            )}
        </button>
    );
};

export default DownloadHelper;