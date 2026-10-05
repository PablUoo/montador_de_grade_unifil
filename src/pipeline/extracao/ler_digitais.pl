use strict; use warnings; use utf8;
open my $f,'<:encoding(UTF-8)','raw.txt'; local $/; my $all=<$f>;
my @pages=split /\f/,$all; my $hdr='';
open my $o,'>:encoding(UTF-8)','digitais.csv';
print $o "\x{FEFF}\"Página\";\"Grupo (cabeçalho)\";\"Código\";\"Disciplina\";\"Professor\";\"Turma\";\"Curso\"\n";
my $n=0; my %bad;
for my $i (0..$#pages){ my $p=$pages[$i];
  $hdr='(continuação)' if $p=~/Segunda-feira/; $hdr=$1 if $p=~/^(Turma .*?)\s+Entradas:/m;
  my $in=0;
  for my $l (split /\n/,$p){
    if($l=~/^ATIVIDADES DIGITAIS/){$in=1;next}
    next unless $in; last if $l=~/^Dúvidas/;
    if($l=~/^([A-Z]{4}\d{6})\s+(.*)\s+-\s+(.*?)\s+·\s+(.*)$/){
      my($c,$d,$pr,$t)=($1,$2,$3,$4);
      while($t=~/(E\d+\/\d{4})\s+(CC|ES)/g){ print $o join(';',map{qq("$_")} $i+1,$hdr,$c,$d,$pr,$1,$2),"\n"; $n++ }
    } else { $bad{$l}++ }
  }}
print "$n digitais\n"; print "UNPARSED: $_\n" for keys %bad;
