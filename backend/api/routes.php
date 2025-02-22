<?php
header("Access-Control-Allow-Origin: *");
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE");
    header("Access-Control-Allow-Headers: Content-Type");
    http_response_code(200);
    exit;
}
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE");
header("Access-Control-Allow-Headers: Content-Type");
http_response_code(200);

require_once "./module/Post.php";
require_once "./module/GET.php";
require_once "./module/Global.php";

require_once "./config/database.php";
require_once __DIR__ . '/bootstrap.php';
require_once "./src/Jwt.php";

$con = new Connection();
$pdo = $con->connect();
$post = new Post($pdo);
$get = new Get($pdo);

if (isset($_REQUEST['request'])) {
    $request = explode('/', $_REQUEST['request']);
} else {
    echo "Not Found";

    http_response_code(404);
    exit();
}

switch ($_SERVER['REQUEST_METHOD']) {
    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        switch ($request[0]) {

            case 'login':
                $data = json_decode(file_get_contents("php://input"), true);

                if (!isset($data['email']) || !isset($data['password'])) {
                    throw new Exception("Missing login credentials", 400);
                }

                $user = $get->getByEmail($data['email']);
                $post->login($data, $user);
                break;

            case 'adduser':
                echo json_encode($post->add_user($data));
                break;

            case 'addproduct':
                echo json_encode($post->addProduct($data));
                break;

            case 'updateproduct':
                echo json_encode($post->updateProduct($data, $request[1]));
                break;

            case 'uploadimage':
                echo json_encode($post->uploadImage($request[1]));
                break;

            case 'addtocart':
                echo json_encode($post->addProductToCart($data));
                break;

            case 'removetocart':
                echo json_encode($post->removeItemFromCart($data));
                break;

            case 'orderitem':
                echo json_encode($post->createOrder($data));
                break;

            case 'buynow':
                echo json_encode($post->buyNow($data));
                break;

            case 'cancelorder':
                echo json_encode($post->cancelOrder($data));
                break;

            default:
                echo "This is forbidden";
                http_response_code(403);
                break;
        }
        break;

    case 'GET':
        switch ($request[0]) {

            case 'products':
                // Extract query parameters (like categoryId) from the URL
                $categoryId = isset($_GET['categoryId']) ? intval($_GET['categoryId']) : null;

                if (isset($request[1])) {
                    echo json_encode($get->getAllProducts($request[1], $categoryId));
                } else {
                    echo json_encode($get->getAllProducts(null, $categoryId));
                }
                break;


            case 'carts':
                if (isset($request[1])) {
                    echo json_encode($get->getCart($request[1]));
                } else {
                    echo json_encode($get->getCart());
                }
                break;

                // case 'cartitems':
                //     if (isset($request[1])) {
                //         echo json_encode($get->getCartItems($request[1]));
                //     } else {
                //         echo ("No id provided");
                //     }
                //     break;

            case 'cartitems':
                if (isset($request[1])) {
                    echo json_encode($get->getUserCartWithItems($request[1]));
                } else {
                    echo ("No id provided");
                }
                break;

            case 'orderitems':
                if (isset($request[1])) {
                    echo json_encode($get->getAllUserOrders($request[1]));
                } else {
                    echo ("No id provided");
                }
                break;

            case 'userorderitems':
                if (isset($request[1])) {
                    echo json_encode($get->getUserOrder($request[1], $request[2]));
                } else {
                    echo ("No id provided");
                }
                break;

            case 'getproductimage':
                if (isset($request[1])) {
                    echo json_encode($get->getProductImage($request[1]));
                } else {
                    echo "ID not provided";
                    http_response_code(400);
                }
                break;

            case 'getcategory':
                echo json_encode($get->getCategories());
                break;

            default:
                echo "This is forbidden";
                http_response_code(403);
                break;
        }
        break;

    case 'DELETE':
        switch ($request[0]) {
            case 'deleteproduct':
                if (isset($request[1])) {
                    echo json_encode($post->deleteProduct($request[1]));
                } else {
                    http_response_code(400);
                    echo json_encode(["message" => "Event ID is required for deletion"]);
                }
                break;
        }
        break;

    default:
        echo "This is forbidden";
        http_response_code(403);
        break;
}
