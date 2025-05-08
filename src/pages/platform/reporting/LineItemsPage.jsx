import React, { useEffect, useState, useRef } from 'react'
import LineItemConfigModal from './components/LineItemConfigModal';

function LineItemsPage() {
    const tempVars = {reportName: "remittance"}

    const [lineItemsHtml, setLineItemsHtml] = useState("");
    const contentRef = useRef(null);
    const [showLineItemConfigModal, setShowLineItemConfigModal] = useState(false);
    const [currentLineItemId, setCurrentLineItemId] = useState("");

    useEffect(() => {
        const fetchLineItems = async () => {
            try{
                const response = await fetch(`http://localhost:8080/templates/parse?report-name=${tempVars.reportName}`);
                if(response.ok){
                    const data = await response.text();
                    setLineItemsHtml(data);
                }
            }catch(error){
                alert("Error occured when trying to fetch line items html.");
            }

        }
        fetchLineItems();
    },[tempVars.reportName])

    useEffect(() => {
        if(!contentRef.current || !lineItemsHtml) return;

        const handleClick = (event) => {
            const lineItem = event.target.closest('.line-item');
            if(lineItem){
                const elementName = lineItem.getAttribute('name');
                setCurrentLineItemId(elementName);
                setShowLineItemConfigModal(true);

                console.log("set show to true")
            }
        }

        contentRef.current.addEventListener('click', handleClick);
        return () => contentRef.current?.removeEventListener('click', handleClick);
    }, [lineItemsHtml]);

    // COMPONENTS
    const LineItemsHtmlComponent = () => {
        return(
            <div ref={contentRef} dangerouslySetInnerHTML={{__html: lineItemsHtml}} />
        )
    };
    
  return (
    <>
        {!showLineItemConfigModal && <LineItemsHtmlComponent />}
        {showLineItemConfigModal && <LineItemConfigModal setShowModal={setShowLineItemConfigModal} lineItemId={currentLineItemId}/>}
    </>
  )
}

export default LineItemsPage