// Payment Integration Logic
// Uses PhonePe sandbox and production APIs

const ENV_CONFIG = {
    sandbox: {
        tokenUrl: 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token',
        payUrl: 'https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay',
        orderStatusUrl: 'https://api-preprod.phonepe.com/apis/pg-sandbox/payments/v2/order',
        refundUrl: 'https://api-preprod.phonepe.com/apis/pg-sandbox/payments/v2/refund',
        client_id: 'MEEPAYUAT_26030518155618',
        client_secret: 'MzYwZTFiMDUtYzZmNS00ZGRlLWJmZWYtYTVmNDEyNjc0NjM2',
        client_version: '1',
    },
    production: {
        tokenUrl: 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token',
        payUrl: 'https://api.phonepe.com/apis/pg/checkout/v2/pay',
        orderStatusUrl: 'https://api.phonepe.com/apis/pg/payments/v2/order',
        refundUrl: 'https://api.phonepe.com/apis/pg/payments/v2/refund',
        client_id: 'SU2407261558245785595105', // TODO: Add production client_id
        client_secret: 'e5ceadd4-d259-400e-a6b8-0de5a89f5674', // TODO: Add production client_secret
        client_version: '1',
    }
};

let currentEnv = 'sandbox';
let accessToken = '';
let lastRedirectUrl = '';

document.querySelectorAll('input[name="env"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        currentEnv = e.target.value;
        accessToken = '';
        document.getElementById('token-status').textContent = '';
    });
});

document.getElementById('fetch-token').onclick = async function() {
    const cfg = ENV_CONFIG[currentEnv];
    const params = new URLSearchParams();
    params.append('client_id', cfg.client_id);
    params.append('client_version', cfg.client_version);
    params.append('client_secret', cfg.client_secret);
    params.append('grant_type', 'client_credentials');
    try {
        const res = await fetch(cfg.tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });
        const data = await res.json();
        if (data.access_token) {
            accessToken = data.access_token;
            document.getElementById('token-status').textContent = 'Token fetched!';
        } else {
            document.getElementById('token-status').textContent = 'Failed to fetch token.';
        }
    } catch (err) {
        document.getElementById('token-status').textContent = 'Error: ' + err;
    }
};

document.getElementById('create-payment').onclick = async function() {
    if (!accessToken) {
        document.getElementById('payment-status').textContent = 'Fetch token first!';
        return;
    }
    const cfg = ENV_CONFIG[currentEnv];
    const merchantOrderId = 'TX' + Date.now();
    const amount = 150; // You can make this dynamic
    const payload = {
        merchantOrderId,
        amount,
        paymentFlow: {
            type: 'PG_CHECKOUT',
            merchantUrls: {
                redirectUrl: 'https://example.com/payment-failure'
            }
        }
    };
    try {
        const res = await fetch(cfg.payUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'O-Bearer ' + accessToken
            },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.redirectUrl) {
            lastRedirectUrl = data.redirectUrl;
            document.getElementById('payment-status').textContent = 'Payment created. Click "Pay in IFrame".';
        } else {
            document.getElementById('payment-status').textContent = JSON.stringify(data);
        }
    } catch (err) {
        document.getElementById('payment-status').textContent = 'Error: ' + err;
    }
document.getElementById('pay-iframe').onclick = function() {
    if (!lastRedirectUrl) {
        document.getElementById('payment-status').textContent = 'Create payment first!';
        return;
    }
    if (window.PhonePeCheckout && window.PhonePeCheckout.transact) {
        window.PhonePeCheckout.transact({
            tokenUrl: lastRedirectUrl,
            type: 'IFRAME',
            callback: function(response) {
                if (response === 'USER_CANCEL') {
                    document.getElementById('payment-status').textContent = 'Payment cancelled by user.';
                } else if (response === 'CONCLUDED') {
                    document.getElementById('payment-status').textContent = 'Payment completed.';
                } else {
                    document.getElementById('payment-status').textContent = 'Payment status: ' + response;
                }
            }
        });
    } else {
        document.getElementById('payment-status').textContent = 'PhonePeCheckout not loaded.';
    }
};
};

document.getElementById('check-order').onclick = async function() {
    if (!accessToken) {
        document.getElementById('order-status').textContent = 'Fetch token first!';
        return;
    }
    const cfg = ENV_CONFIG[currentEnv];
    const orderId = document.getElementById('order-id').value.trim();
    if (!orderId) {
        document.getElementById('order-status').textContent = 'Enter Order ID.';
        return;
    }
    try {
        const res = await fetch(`${cfg.orderStatusUrl}/${orderId}/status`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'O-Bearer ' + accessToken
            }
        });
        const data = await res.json();
        document.getElementById('order-status').textContent = JSON.stringify(data);
    } catch (err) {
        document.getElementById('order-status').textContent = 'Error: ' + err;
    }
};

document.getElementById('initiate-refund').onclick = async function() {
    if (!accessToken) {
        document.getElementById('refund-status').textContent = 'Fetch token first!';
        return;
    }
    const cfg = ENV_CONFIG[currentEnv];
    const originalMerchantOrderId = document.getElementById('refund-order-id').value.trim();
    if (!originalMerchantOrderId) {
        document.getElementById('refund-status').textContent = 'Enter Order ID.';
        return;
    }
    const merchantRefundId = 'TX' + Math.floor(Math.random() * 1000000);
    const amount = 1804; // You can make this dynamic
    const payload = {
        merchantRefundId,
        originalMerchantOrderId,
        amount
    };
    try {
        const res = await fetch(cfg.refundUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'O-Bearer ' + accessToken
            },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        document.getElementById('refund-status').textContent = JSON.stringify(data);
    } catch (err) {
        document.getElementById('refund-status').textContent = 'Error: ' + err;
    }
};













/*
this is for fetch auth token in sandbox environment

curl --location 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'client_id=MEEPAYUAT_26030518155618' \
--data-urlencode 'client_version=1' \
--data-urlencode 'client_secret=MzYwZTFiMDUtYzZmNS00ZGRlLWJmZWYtYTVmNDEyNjc0NjM2' \
--data-urlencode 'grant_type=client_credentials'

its Response

{
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHBpcmVzT24iOjE3NzI3MzEzMTI1NzEsIm1lcmNoYW50SWQiOiJNRUVQQVlVQVQifQ.Gu2h5vVeFSfQSBzlNxXu5wcRDiyqgEuWYlF8vNp9jwM",
    "encrypted_access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHBpcmVzT24iOjE3NzI3MzEzMTI1NzEsIm1lcmNoYW50SWQiOiJNRUVQQVlVQVQifQ.Gu2h5vVeFSfQSBzlNxXu5wcRDiyqgEuWYlF8vNp9jwM",
    "expires_in": 3600,
    "issued_at": 1772727712,
    "expires_at": 1772731312,
    "session_expires_at": 1772731312,
    "token_type": "O-Bearer"
}

create payment api
curl --location 'https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay' \
--header 'Content-Type: application/json' \
--header 'Authorization: O-Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHBpcmVzT24iOjE3NzI3MzEzMTI1NzEsIm1lcmNoYW50SWQiOiJNRUVQQVlVQVQifQ.Gu2h5vVeFSfQSBzlNxXu5wcRDiyqgEuWYlF8vNp9jwM' \
--data '{
    "merchantOrderId": "TX590480", this should be unique for every transaction, you can generate it as per your requirement
    "amount": 1804, // make this variable as per your requirement

    "paymentFlow": {
        "type": "PG_CHECKOUT",
        "merchantUrls": {
            "redirectUrl": "https://example.com/payment-failure"
        }
    }
}
'
Response
{
    "orderId": "OMO2603052153142598596938",
    "state": "PENDING",
    "expireAt": 1772900594260,
    "redirectUrl": "https://mercury-uat.phonepe.com/transact/uat_v3?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHBpcmVzT24iOjE3NzI3NTExOTQyNTksIm1lcmNoYW50SWQiOiJNRUVQQVlVQVQiLCJtZXJjaGFudE9yZGVySWQiOiJUWDU5MDQ4MCJ9.etkb5WQC7BxA_2_prKpFkUtpbGSFUqt_hpOBpSrZY_s&routingKey=W" // you can redirect your customer to this url for payment after clicking pay button on index.html page
}

check order status api   
curl --location 'https://api-preprod.phonepe.com/apis/pg-sandbox/payments/v2/order/TX590480/status' \
--header 'Content-Type: application/json' \
--header 'Authorization: O-Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHBpcmVzT24iOjE3NzI3MzEzMTI1NzEsIm1lcmNoYW50SWQiOiJNRUVQQVlVQVQifQ.Gu2h5vVeFSfQSBzlNxXu5wcRDiyqgEuWYlF8vNp9jwM'


print the response over ui 



initiate refund api
curl --location 'https://api-preprod.phonepe.com/apis/pg-sandbox/payments/v2/refund' \
--header 'Content-Type: application/json' \
--header 'Authorization: O-Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHBpcmVzT24iOjE3NzI3MzEzMTI1NzEsIm1lcmNoYW50SWQiOiJNRUVQQVlVQVQifQ.Gu2h5vVeFSfQSBzlNxXu5wcRDiyqgEuWYlF8vNp9jwM' \
--data '{
    "merchantRefundId": "TX507261", // this should be unique for every refund transaction, you can generate it as per your requirement
    "originalMerchantOrderId": "TX590480", // this should be same as merchantOrderId used in create payment api
    "amount": 1804 // make this variable as per your requirement
}'

below are the production APIs urls for payment, order status and refund, you can use these APIs in your application as per your requirement.

https://api.phonepe.com/apis/identity-manager/v1/oauth/token
https://api.phonepe.com/apis/pg/checkout/v2/pay
https://api.phonepe.com/apis/pg/payments/v2/order/{merchantOrderId}/status
https://api.phonepe.com/apis/pg/payments/v2/refund

*/
