// ============================================
// CONFIGURATION FILE
// ============================================

const BASEROW_CONFIG = {
    // Your Baserow API Token
    API_TOKEN: 'zDYPBumjb4JiW8q1Ob2HDRTxbTeJLZ5X',
    
    // Your Bills Table ID
    TABLE_ID: '778899',
    
    // Baserow API Base URL
    BASE_URL: 'https://api.baserow.io',
    
    // Optional: Database ID (for reference only)
    DATABASE_ID: '340870',
    
    // Rate limit settings
    RATE_LIMIT: {
        maxRetries: 5,
        retryDelay: 2000,
        maxConcurrent: 2, // Number of parallel requests
        batchDelay: 500 // Delay between batches
    }
};

window.BASEROW_CONFIG = BASEROW_CONFIG;

console.log('✅ Config loaded successfully');
console.log(`📋 Table ID: ${BASEROW_CONFIG.TABLE_ID}`);
console.log(`🔑 Token: ${BASEROW_CONFIG.API_TOKEN ? 'Present ✓' : 'Missing ✗'}`);
console.log(`💰 Currency: MVR (Maldivian Rufiyaa)`);
console.log(`⏱️ Rate Limit: ${BASEROW_CONFIG.RATE_LIMIT.maxRetries} retries, ${BASEROW_CONFIG.RATE_LIMIT.maxConcurrent} concurrent`);
