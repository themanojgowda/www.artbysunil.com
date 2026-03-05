const axios = require('axios');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    try {
        // 1. Get Token (UAT Credentials)
        const tokenParams = new URLSearchParams({
            client_id: 'UATMOBILE_25092411134555',
            client_version: '1',
            client_secret: 'ZGE1OTkzMTEtNjVmNS00NDcxLTg4MDMtNjQ0YzIxMWE3MDQx',
            grant_type: 'client_credentials'
        });

        const tokenRes = await axios.post('https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token', tokenParams);
        const token = tokenRes.data.access_token;

        // 2. Create Payment Request
        const paymentData = {
            merchantOrderId: 'TXN' + Date.now(),
            amount: 100, // Amount in Rupees
            paymentFlow: {
                type: 'PG_CHECKOUT',
                merchantUrls: { redirectUrl: 'https://your-site.com/success' }
            }
        };

        const payRes = await axios.post('https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay', paymentData, {
            headers: { 'Authorization': `O-Bearer ${token}`, 'Content-Type': 'application/json' }
        });

        // 3. Return the Redirect URL to the frontend
        res.status(200).json({ url: payRes.data.redirectUrl });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
