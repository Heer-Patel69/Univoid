import React from 'react';

export const ErrorTrigger = () => {
    const [shouldError, setShouldError] = React.useState(false);

    React.useEffect(() => {
        // Check for query param to auto-trigger
        const params = new URLSearchParams(window.location.search);
        if (params.get('trigger_error') === 'true') {
            setShouldError(true);
        }
    }, []);

    if (shouldError) {
        throw new Error('This is a test error for verifying the Error Boundary.');
    }

    return (
        <div style={{ padding: 20, textAlign: 'center', zIndex: 99999, position: 'relative' }}>
            <h1>Debug Area</h1>
            <button
                id="trigger-error-btn"
                onClick={() => setShouldError(true)}
                style={{ padding: '10px 20px', background: 'red', color: 'white', borderRadius: 8 }}
            >
                Trigger Crash
            </button>
        </div>
    );
};
