/**
 * @file MathBlock.jsx
 * @description Renders LaTeX/Math expressions using KaTeX.
 * Handles both block-level (displayMode = true) and inline math rendering.
 */

import React from 'react';
import katex from 'katex';

import 'katex/dist/katex.min.css';

export const MathBlock = ({ math, displayMode = true }) => {
    const ref = React.useRef(null);
    React.useEffect(() => {
        if (ref.current) {
            katex.render(math, ref.current, { displayMode, throwOnError: false, output: 'html' });
        }
    }, [math, displayMode]);
    return (
        <div
            ref={ref}
            style={{
                margin: displayMode ? '16px 0' : '0',
                padding: displayMode ? '16px 24px' : '0',
                background: displayMode ? '#FAFAFA' : 'transparent',
                borderRadius: displayMode ? '10px' : '0',
                border: displayMode ? '1px solid #F0F0EF' : 'none',
                overflowX: 'auto',
                display: displayMode ? 'flex' : 'inline-block',
                justifyContent: 'center',
                color: '#1C1C1E',
            }}
        />
    );
};
