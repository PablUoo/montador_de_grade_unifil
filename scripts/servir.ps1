param([int]$porta = 8080, [string]$raiz = (Join-Path $PSScriptRoot '..\public'))
# Servidor estatico simples para testar o site localmente (o navegador bloqueia fetch em file://)
$raiz = (Resolve-Path $raiz).Path
$tipos = @{ '.html' = 'text/html; charset=utf-8'; '.json' = 'application/json'; '.js' = 'text/javascript'; '.css' = 'text/css';
  '.xlsx' = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'; '.png' = 'image/png'; '.svg' = 'image/svg+xml' }
$http = New-Object System.Net.HttpListener
$http.Prefixes.Add("http://localhost:$porta/")
$http.Start()
Write-Host "Servindo $raiz em http://localhost:$porta/  (Ctrl+C para parar)"
try {
  while ($http.IsListening) {
    $ctx = $http.GetContext()
    $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
    if (-not $rel) { $rel = 'index.html' }
    $arq = [IO.Path]::GetFullPath((Join-Path $raiz $rel))
    if (Test-Path $arq -PathType Container) { $arq = Join-Path $arq 'index.html' }
    if ($arq.StartsWith($raiz) -and (Test-Path $arq -PathType Leaf)) {
      $bytes = [IO.File]::ReadAllBytes($arq)
      $tipo = $tipos[[IO.Path]::GetExtension($arq).ToLower()]
      if ($tipo) { $ctx.Response.ContentType = $tipo }
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else { $ctx.Response.StatusCode = 404 }
    $ctx.Response.Close()
  }
} finally { $http.Stop() }
