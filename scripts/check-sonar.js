const https = require('https');
const SONAR_URL = 'https://sonar.cervus.network';
const TOKEN = 'sqp_5d933e144eaef6334543d2c884ac57758bc6b5dd';
const PROJECT_KEY = 'cervus-class';

const url = `${SONAR_URL}/api/issues/search?componentKeys=${PROJECT_KEY}&types=CODE_SMELL,BUG,VULNERABILITY&resolutions=&ps=100`;

const req = https.get(url, {
    headers: {
        'Authorization': 'Basic ' + Buffer.from(TOKEN + ':').toString('base64')
    }
}, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const result = JSON.parse(data);
            console.log('Total OPEN issues remaining:', result.total);

            const counts = result.issues.reduce((acc, issue) => {
                acc[issue.severity] = (acc[issue.severity] || 0) + 1;
                return acc;
            }, {});
            console.log('Severities in first 100:', counts);

            const missing = result.issues.map(i => i.rule).slice(0, 10);
            console.log('Sample Rules still failing:', missing);
        } catch (e) {
            console.log('Error parsing sonar API:', e.message);
        }
    });
});

req.on('error', (e) => {
    console.error(e);
});
