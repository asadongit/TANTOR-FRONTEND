import { Handle as ReactFlowHandle, Position } from "reactflow";

export function Handle({ type, position }) {
    return (
        <ReactFlowHandle 
            type={type} 
            position={position} 
            style={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                backgroundColor: 'white', 
                border: '1px solid #7E22CE',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        />
    );
}
