<?php
session_start();

// Initialize default values to avoid undefined variable warnings
$environment = '';
$clientId = '';
$clientSecret = '';
$tokenUrl = '';
$paymentUrl = '';

// Determine the environment (UAT or Production) from the POST request
if (isset($_POST['environment'])) {
    $environment = $_POST['environment'] === 'prod' ? 'prod' : 'uat';
}

// Log the selected environment for debugging
error_log("Selected environment: " . $environment);

if ($environment === 'uat') {
    // Log UAT environment selection
    error_log("Using UAT environment");
    // UAT environment
    $tokenUrl = 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token';
    $clientId = 'UATMOBILE_25092411134555';
    $clientSecret = 'ZGE1OTkzMTEtNjVmNS00NDcxLTg4MDMtNjQ0YzIxMWE3MDQx';
    $paymentUrl = 'https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay';
} else {
    // Log Production environment selection
    error_log("Using Production environment");
    // Production environment
    $tokenUrl = 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token';
    $clientId = 'SU2407261558245785595105';
    $clientSecret = 'e5ceadd4-d259-400e-a6b8-0de5a89f5674';
    $paymentUrl = 'https://api.phonepe.com/apis/pg/checkout/v2/pay';
}

// Step 1: Fetch the access token
$tokenData = [
    'client_id' => $clientId,
    'client_version' => '1',
    'client_secret' => $clientSecret,
    'grant_type' => 'client_credentials'
];

$ch = curl_init($tokenUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($tokenData));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$tokenResponse = curl_exec($ch);
if (curl_errno($ch)) {
    die('Error: ' . curl_error($ch));
}
curl_close($ch);

$tokenResponseData = json_decode($tokenResponse, true);
if (isset($tokenResponseData['access_token'])) {
    $_SESSION['access_token'] = $tokenResponseData['access_token'];
} else {
    die('Failed to fetch access token.');
}

// Step 2: Use the access token to make the payment request
$paymentData = [
    'merchantOrderId' => 'TX' . uniqid(),
    'amount' => rand(100, 1000),
    'metaInfo' => [
        'udf1' => 'additional-information-1',
        'udf2' => 'additional-information-2',
        'udf3' => 'additional-information-3',
        'udf4' => 'additional-information-4',
        'udf5' => 'additional-information-5'
    ],
    'paymentFlow' => [
        'type' => 'PG_CHECKOUT',
        'message' => 'Secure payment request',
        'merchantUrls' => [
            'redirectUrl' => 'https://example.com/redirect'
        ]
    ]
];

$ch = curl_init($paymentUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($paymentData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: O-Bearer ' . $_SESSION['access_token']
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$paymentResponse = curl_exec($ch);
if (curl_errno($ch)) {
    die('Error: ' . curl_error($ch));
}
curl_close($ch);

$paymentResponseData = json_decode($paymentResponse, true);
if (isset($paymentResponseData['redirectUrl'])) {
    $redirectUrl = $paymentResponseData['redirectUrl'];
} else {
    die('Failed to initiate payment.');
}

// Display the payment button and include the PhonePe Checkout script
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Page</title>
    <script src="https://mercury.phonepe.com/web/bundle/checkout.js"></script>
    <style>
        body {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            font-family: Arial, sans-serif;
        }
        .payment-button {
            margin-top: 20px;
        }
        button {
            padding: 10px 20px;
            font-size: 16px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="payment-button">
        <form method="POST" onsubmit="startPayment(event)">
            <input type="hidden" name="environment" id="environment" value="uat">
            <button type="submit">Pay Now</button>
        </form>
    </div>

    <script>
        function startPayment(event) {
            event.preventDefault(); // Prevent form submission

            const tokenUrl = "<?php echo isset($redirectUrl) ? $redirectUrl : ''; ?>";
            const selectedEnvironment = document.getElementById('environment').value;
            console.log(`Starting payment in environment: ${selectedEnvironment}`); // Log the environment being used

            if (window && window.PhonePeCheckout && window.PhonePeCheckout.transact) {
                window.PhonePeCheckout.transact({
                    tokenUrl: tokenUrl,
                    type: "IFRAME",
                    callback: function(response) {
                        console.log(`Payment response: ${response}`); // Log the payment response
                        if (response === 'USER_CANCEL') {
                            alert('Payment cancelled by user.');
                        } else if (response === 'CONCLUDED') {
                            alert('Payment completed successfully.');
                        }
                    }
                });
            } else {
                console.error('PhonePe Checkout script not loaded.'); // Log an error if the script is not loaded
                alert('PhonePe Checkout script not loaded.');
            }
        }
    </script>
</body>
</html>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Set Environment</title>
    <style>
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            font-family: Arial, sans-serif;
            background-color: #f4f4f9;
        }
        .form-container {
            background: #ffffff;
            padding: 20px 30px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        .form-container label {
            font-size: 18px;
            margin-bottom: 10px;
            display: block;
            color: #333333;
        }
        .form-container select {
            padding: 10px;
            font-size: 16px;
            border: 1px solid #cccccc;
            border-radius: 4px;
            margin-bottom: 20px;
            width: 100%;
        }
        .form-container button {
            padding: 10px 20px;
            font-size: 16px;
            color: #ffffff;
            background-color: #007bff;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.3s ease;
        }
        .form-container button:hover {
            background-color: #0056b3;
        }
    </style>
</head>
<body>
    <div class="form-container">
        <form method="POST">
            <label for="environment">Select Environment:</label>
            <select name="environment" id="environment">
                <option value="uat">UAT</option>
                <option value="prod">Production</option>
            </select>
            <button type="submit">Set Environment</button>
        </form>
    </div>
</body>
</html>
