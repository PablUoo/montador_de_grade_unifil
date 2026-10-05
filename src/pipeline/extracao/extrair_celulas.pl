use strict; use warnings; use utf8;
binmode STDOUT, ':encoding(UTF-8)';
# Lê uma página da grade (PDF em GRADE_PDF) e grava o texto de cada célula dia×horário em cols_<página>.txt
my $F = $ENV{GRADE_PDF} or die "defina GRADE_PDF";
my ($W, $H) = (841.89, 595.28);
my @DAYS = qw(Segunda-feira Terça-feira Quarta-feira Quinta-feira Sexta-feira Sábado);

sub txt {
  my ($p, %m) = @_;
  my $args = join ' ', map { "-margin$_ $m{$_}" } grep { defined $m{$_} } qw(l r t b);
  my $out = `pdftotext -q -enc UTF-8 -raw -f $p -l $p $args "$F" -`;
  utf8::decode($out);
  return $out;
}
# smallest margin value (side) at which $re disappears
sub edge {
  my ($p, $side, $re, %fixed) = @_;
  my ($lo, $hi) = (0, ($side =~ /[lr]/ ? $W : $H));
  return undef unless txt($p, %fixed) =~ $re;
  while ($hi - $lo > 0.5) {
    my $mid = ($lo + $hi) / 2;
    if (txt($p, %fixed, $side => $mid) =~ $re) { $lo = $mid } else { $hi = $mid }
  }
  return $lo;
}

my @rows; my @dig; my $turmaHdr = '';
my $P = shift; for my $p ($P .. $P) {
  my $full = txt($p);
  last if $full eq '' && $p > 18;
  next unless $full =~ /Segunda-feira/;
  $turmaHdr = "(continuação)"; $turmaHdr = $1 if $full =~ /^(Turma .*?)\s+Entradas:/m;
  $turmaHdr =~ s/\s+$//;

  # day column centers
  my @c;
  for my $d (@DAYS) {
    my $re = qr/\Q$d\E/;
    my $l = edge($p, 'l', $re);
    my $r = $W - edge($p, 'r', $re);
    push @c, ($l + $r) / 2;
  }
  my @b = ($c[0] - ($c[1] - $c[0]) / 2);
  push @b, ($c[$_] + $c[$_ + 1]) / 2 for 0 .. 4;
  push @b, $W;

  # vertical bounds: header row bottom, intervalo, atividades
  my $yHdr = edge($p, 't', qr/Segunda-feira/);           # top of header
  my $yHdrB = $H - edge($p, 'b', qr/Segunda-feira/);     # bottom of header
  my $yInt = edge($p, 't', qr/INTERVALO/);
  my $yIntB = $H - edge($p, 'b', qr/INTERVALO/);
  my $yAt = ($full =~ /ATIVIDADES/) ? edge($p, 't', qr/ATIVIDADES/) : $H - 1;

  my @slots = (['19:00 - 20:30', $yHdrB + 1, $yInt], ['20:45 - 22:15', $yIntB + 1, $yAt]);
  if ($turmaHdr eq '(continuação)' && $full =~ /^FLEX$/m) { $turmaHdr = 'Grade FLEX (optativas)' }
  open my $o, '>:encoding(UTF-8)', "cols_$P.txt" or die;
  for my $s (@slots) {
    my ($hor, $top, $bot) = @$s;
    for my $i (0 .. 5) {
      my $t = txt($p, l => $b[$i], r => $W - $b[$i + 1], t => $top, b => $H - $bot);
      print $o "##CELL\t$p\t$turmaHdr\t$DAYS[$i]\t$hor\n$t\n";
    }
  }
  close $o;
}
