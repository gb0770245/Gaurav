<?php
// legacy_code.php
// This is the PHP version of the code requested by the user.
// Note: This environment cannot execute PHP files directly.
// You can copy this code to a standard PHP server (Apache/Nginx + PHP).

session_start();

// Dummy Database (In a real app, use MySQL/PostgreSQL)
if (!isset($_SESSION['users'])) {
    $_SESSION['users'] = [
        ['name' => 'Aman Kumar', 'mobile' => '9876543210', 'password' => '123', 'addresses' => []]
    ];
}
if (!isset($_SESSION['orders'])) {
    $_SESSION['orders'] = [
        ['id' => 'ORD9021', 'restaurantId' => 1, 'items' => [['name' => 'Crispy Veggie Burger', 'qty' => 2, 'price' => 120]], 'total' => 240, 'status' => 'Pending', 'time' => '1:20 PM']
    ];
}

// Handle API Requests (Simulated)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    
    if ($action === 'login') {
        $mobile = $_POST['mobile'];
        $pass = $_POST['password'];
        foreach ($_SESSION['users'] as $user) {
            if ($user['mobile'] === $mobile && $user['password'] === $pass) {
                echo json_encode(['status' => 'success', 'user' => $user]);
                exit;
            }
        }
        echo json_encode(['status' => 'error', 'message' => 'Invalid credentials']);
        exit;
    }
    
    if ($action === 'signup') {
        $name = $_POST['name'];
        $mobile = $_POST['mobile'];
        $pass = $_POST['password'];
        
        foreach ($_SESSION['users'] as $user) {
            if ($user['mobile'] === $mobile) {
                echo json_encode(['status' => 'error', 'message' => 'User already exists']);
                exit;
            }
        }
        
        $newUser = ['name' => $name, 'mobile' => $mobile, 'password' => $pass, 'addresses' => []];
        $_SESSION['users'][] = $newUser;
        echo json_encode(['status' => 'success', 'user' => $newUser]);
        exit;
    }
    
    // ... Add more PHP logic for orders, etc.
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zayka Food Delivery (PHP Version)</title>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- FontAwesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-gray-100 flex items-center justify-center h-screen">
    <div class="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
        <h1 class="text-2xl font-bold text-orange-500 mb-4">PHP Version</h1>
        <p class="text-gray-600 mb-6">
            This file contains the PHP structure. However, this preview environment only supports Node.js/React.
            <br><br>
            Please use the <strong>React version</strong> currently running in the preview window for the full experience.
        </p>
        <div class="bg-gray-50 p-4 rounded text-left text-xs font-mono overflow-auto h-32 border border-gray-200">
            &lt;?php
            // Copy the PHP code from the source file
            session_start();
            // ...
            ?&gt;
        </div>
    </div>
</body>
</html>
