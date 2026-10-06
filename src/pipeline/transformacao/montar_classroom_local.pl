# f_aulas.tsv -> classroom.tsv: códigos do Google Classroom por aula e turma (arquivo LOCAL, nunca vai para o site)
# Quem tem o código entra na turma, por isso ele fica fora da oferta pública e vai para assets/ (ignorado pelo Git).
use strict; use warnings; use utf8;
open my $h, '<:encoding(UTF-8)', 'f_aulas.tsv' or die $!;
<$h>;
my (%vis, @r);
while (<$h>) {
  s/\r?\n//;
  my ($c, undef, $d, $hr, $t, $cu, undef, $s, $p, undef, undef, $cls) = split /\t/, $_, -1;
  next if !$cls || $c eq 'FLEX' || $vis{"$c|$d|$hr|$s|$p|$t|$cu|$cls"}++;
  push @r, [$c, $d, $hr, $s, $p, $t, $cu, $cls];
}
open my $o, '>:encoding(UTF-8)', 'classroom.tsv' or die $!;
print $o join("\t", 'Código', 'Dia', 'Horário', 'Sala', 'Professor', 'Turma', 'Curso', 'Classroom'), "\n";
print $o join("\t", @$_), "\n" for @r;
print scalar(@r), " códigos de Classroom (arquivo local)\n";
