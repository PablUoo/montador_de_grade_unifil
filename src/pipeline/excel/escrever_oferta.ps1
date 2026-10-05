param([string]$dir, [string]$out, [string]$abas = "o_aulas.tsv=Aulas;o_dig.tsv=Digitais")
# grava cada TSV (UTF-8) como uma aba de tabela no Excel; $abas = "arquivo.tsv=Nome da aba;..."
$sheets = @($abas -split ";" | Where-Object { $_ } | ForEach-Object { $p = $_ -split "=", 2; @{ file = $p[0]; name = $p[1] } })
$xl = New-Object -ComObject Excel.Application
$xl.Visible = $false; $xl.DisplayAlerts = $false
$wb = $xl.Workbooks.Add()
while ($wb.Worksheets.Count -lt $sheets.Count) { [void]$wb.Worksheets.Add([Type]::Missing, $wb.Worksheets.Item($wb.Worksheets.Count)) }
for ($s = 0; $s -lt $sheets.Count; $s++) {
  $lines = [System.IO.File]::ReadAllLines((Join-Path $dir $sheets[$s].file), [System.Text.Encoding]::UTF8)
  $cols = ($lines[0] -split "`t").Count
  $data = New-Object 'object[,]' $lines.Count, $cols
  for ($i = 0; $i -lt $lines.Count; $i++) {
    $f = $lines[$i] -split "`t"
    for ($j = 0; $j -lt $cols; $j++) { $data[$i, $j] = if ($j -lt $f.Count) { $f[$j] } else { '' } }
  }
  $ws = $wb.Worksheets.Item($s + 1)
  $ws.Name = $sheets[$s].name
  $ws.Cells.NumberFormat = '@'
  $rng = $ws.Range($ws.Cells(1, 1), $ws.Cells($lines.Count, $cols))
  $rng.Value2 = $data
  $lo = $ws.ListObjects.Add(1, $rng, $null, 1)
  $lo.TableStyle = 'TableStyleMedium2'
  $ws.Columns.AutoFit() | Out-Null
  for ($j = 1; $j -le $cols; $j++) { if ($ws.Columns($j).ColumnWidth -gt 60) { $ws.Columns($j).ColumnWidth = 60 } }
  $ws.Activate(); $xl.ActiveWindow.SplitRow = 1; $xl.ActiveWindow.FreezePanes = $true
}
$wb.Worksheets.Item(1).Activate()
$wb.SaveAs($out, 51)
$wb.Close($false); $xl.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($xl) | Out-Null
"saved $out"
