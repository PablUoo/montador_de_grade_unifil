param([string]$xlsx, [string]$out, [string]$outCh)
# Exporta a 1a aba (pendentes) para TSV e junta codigo + C.H. de todas as abas (pendentes, cursadas, DP) em outro TSV
$xl = New-Object -ComObject Excel.Application; $xl.DisplayAlerts = $false
try {
  $wb = $xl.Workbooks.Open($xlsx, 0, $true)
  $v = $wb.Worksheets.Item(1).UsedRange.Value2
  $lines = for ($i = 1; $i -le $v.GetLength(0); $i++) { (1..$v.GetLength(1) | ForEach-Object { $v[$i, $_] }) -join "`t" }
  [IO.File]::WriteAllLines($out, $lines, [Text.Encoding]::UTF8)
  if ($outCh) {
    $ch = New-Object System.Collections.Generic.List[string]
    foreach ($ws in $wb.Worksheets) {
      $v = $ws.UsedRange.Value2
      $cCod = 0; $cCh = 0
      for ($j = 1; $j -le $v.GetLength(1); $j++) {
        $h = [string]$v[1, $j]
        if ($h -match '^C.digo') { $cCod = $j }
        if ($h -match '^C\.H\.( \(horas\))?$') { $cCh = $j }
      }
      if (-not ($cCod -and $cCh)) { continue }
      for ($i = 2; $i -le $v.GetLength(0); $i++) {
        $c = [string]$v[$i, $cCod]; $n = $v[$i, $cCh]
        if ($c -and $n) { $ch.Add("$c`t$n") }
      }
    }
    [IO.File]::WriteAllLines($outCh, $ch, [Text.Encoding]::UTF8)
  }
  $wb.Close($false)
} finally { $xl.Quit(); [Runtime.InteropServices.Marshal]::ReleaseComObject($xl) | Out-Null }
