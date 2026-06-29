// ============================================
// CONFIGURATION FILE
// Keep your credentials here, separate from the main app
// ============================================

const BASEROW_CONFIG = {
    // Your Baserow API Token - Get this from Baserow Settings → Tokens
    API_TOKEN: 'zDYPBumjb4JiW8q1Ob2HDRTxbTeJLZ5X',
    
    // Your Bills Table ID
    TABLE_ID: '778899',
    
    // Baserow API Base URL
    BASE_URL: 'https://api.baserow.io',
    
    // Optional: Database ID (for reference only)
    DATABASE_ID: '340870'
};

// Make it available globally
window.BASEROW_CONFIG = BASEROW_CONFIG;