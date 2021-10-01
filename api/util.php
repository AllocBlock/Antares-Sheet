<?php
header('Access-Control-Allow-Origin:http://localhost:8080');
header('Access-Control-Allow-Headers:*');

function finish($code = 10001, $data = null, $msg = null, $error = null, $extra = null) {
    $result = array();
    if (!is_null($code)) $result['code'] = $code;
    if (!is_null($data)) $result['data'] = $data;
    if (!is_null($msg)) $result['msg'] = $msg;
    if (!is_null($error)) $result['error'] = $error;
    if (!is_null($extra)) $result['extra'] = $extra;
    exit(json_encode($result));
}

function randomString($len = 32) {
    $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    $maxIndex = strlen($chars) - 1;
    
    $str = '';
    for($i = 0; $i < $len; $i++){
        $str .= $chars[mt_rand(0, $maxIndex)];    //随机取出一位
    }
    return $str;
}
?>