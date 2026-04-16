$ErrorActionPreference = "Stop"
function Call-CurlJson {
  param([string]$Method,[string]$Url,[string]$Token,[string]$Body)
  $tmp = [System.IO.Path]::GetTempFileName()
  $args = @("-s","-o",$tmp,"-w","%{http_code}","-X",$Method,$Url)
  if ($Token) { $args += @("-H","Authorization: Bearer $Token") }
  if ($Body) { $args += @("-H","Content-Type: application/json","-d",$Body) }
  $codeText = (& curl.exe @args)
  $content = Get-Content -Path $tmp -Raw
  Remove-Item -Path $tmp -Force
  $json = $null
  try { if ($content) { $json = $content | ConvertFrom-Json } } catch {}
  [pscustomobject]@{ status = $codeText; json = $json }
}
function Pick-Token($obj) {
  if ($obj.token) { return $obj.token }
  if ($obj.jwt) { return $obj.jwt }
  if ($obj.data -and $obj.data.token) { return $obj.data.token }
  if ($obj.data -and $obj.data.jwt) { return $obj.data.jwt }
  return $null
}
$loginBody = '{"email":"admin@example.com","password":"password123"}'
$login5000 = Call-CurlJson "POST" "http://localhost:5000/api/auth/login" $null $loginBody
$usedPort = 5000; $login = $login5000
if ($login5000.status -ne "200") {
  $login3000 = Call-CurlJson "POST" "http://localhost:3000/api/auth/login" $null $loginBody
  if ($login3000.status -eq "200") { $usedPort = 3000; $login = $login3000 }
}
$token = Pick-Token $login.json
$monthly = $null; $summary = $null; $top = $null; $unauth = $null
if ($token) {
  $monthly = Call-CurlJson "GET" "http://localhost:$usedPort/api/reports/monthly-sales?range=12m" $token $null
  $summary = Call-CurlJson "GET" "http://localhost:$usedPort/api/analytics/sales-summary?range=30d" $token $null
  $top = Call-CurlJson "GET" "http://localhost:$usedPort/api/analytics/top-products?range=30d" $token $null
  $unauth = Call-CurlJson "GET" "http://localhost:$usedPort/api/analytics/sales-summary?range=30d" $null $null
}
$monthlyLen = $null; if ($monthly -and $monthly.json) { if ($monthly.json.monthly_sales) { $monthlyLen = @($monthly.json.monthly_sales).Count } elseif ($monthly.json.data) { $monthlyLen = @($monthly.json.data).Count } }
$topLen = $null; if ($top -and $top.json) { if ($top.json.top_products) { $topLen = @($top.json.top_products).Count } elseif ($top.json.data) { $topLen = @($top.json.data).Count } }
$sumObj = $null; if ($summary -and $summary.json) { if ($summary.json.data) { $sumObj = $summary.json.data } else { $sumObj = $summary.json } }
$totals = [ordered]@{}
if ($sumObj) { foreach ($k in @("total_sales","total_revenue","total_orders","sales","revenue","orders")) { if ($sumObj.PSObject.Properties[$k]) { $totals[$k] = $sumObj.$k } } }
$unauthMsg = $null; if ($unauth -and $unauth.json) { if ($unauth.json.message) { $unauthMsg = $unauth.json.message } elseif ($unauth.json.error) { $unauthMsg = $unauth.json.error } }
[pscustomobject]@{
  requested_port = 5000
  used_port = $usedPort
  login_status = $login.status
  token_captured = [bool]($token)
  monthly_sales_status = $(if($monthly){$monthly.status}else{$null})
  monthly_sales_length = $monthlyLen
  sales_summary_status = $(if($summary){$summary.status}else{$null})
  sales_summary_totals = $totals
  top_products_status = $(if($top){$top.status}else{$null})
  top_products_length = $topLen
  unauthorized_status = $(if($unauth){$unauth.status}else{$null})
  unauthorized_message = $unauthMsg
} | ConvertTo-Json -Depth 6
