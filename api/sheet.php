<?
$sql = "SELECT Id, Name, Singer, Type From sheet";
$list = sql_query($sql, "获取曲谱列表", "all");
finish(10001, $list);
?>