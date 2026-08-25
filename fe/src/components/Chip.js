import React from 'react';

const styles = {
    chip: {
        padding: '10px 16px',
        borderRadius: '999px',
        border: '1.5px solid #d7ddd7',
        background: '#fff',
        color: '#333',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
    },
    chipSelected: {
        background: '#4caf50',
        borderColor: '#4caf50',
        color: '#fff',
        fontWeight: 'bold',
    },
};

function Chip({ label, selected, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{ ...styles.chip, ...(selected ? styles.chipSelected : {}) }}
        >
            {label}
        </button>
    );
}

export default Chip;
