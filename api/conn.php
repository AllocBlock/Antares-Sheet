<?php
require_once("util.php");

$conn = mysqli_connect("localhost", "root", "123456", 'hbtcrcw_mp');

if (!$conn) {
	finish(20002, null, "连接数据库", '连接失败');
}

function sql_query($sql, $msg, $type = 'all'){
	global $conn;
    $query = mysqli_query($conn, $sql);
	if (!$query)
		finish(20002, null, $msg, $sql . " => " . mysqli_error($conn));
    
    switch ($type) {
        case 'insert': // 查询完成后，返回新插入的行自增ID
            return mysqli_insert_id($conn);
        case 'single': // 查询完成后，获取查询结果第一条并返回
            return mysqli_fetch_array($query, MYSQLI_ASSOC);
        case 'all': // 查询完成后，获取查询结果并返回
            return mysqli_fetch_all($query, MYSQLI_ASSOC);
		case 'update': // 查询完成后，返回影响的行数
			return mysqli_affected_rows($conn);
		default:
			finish(20002, null, $msg, $sql . " => 不支持的查询类型 - " . $type);
    }
}

function sql_format($str) {
	global $conn;
	return mysqli_real_escape_string($conn, $str);
}

function sql_begin() {
	global $conn;
	mysqli_begin_transaction($conn);
}

function sql_commit() {
	global $conn;
	mysqli_commit($conn);
}

function sql_rollback() {
	global $conn;
	mysqli_rollback($conn);
}
?>