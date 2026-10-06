# f_aulas.tsv + f_dig.tsv (+ C.H.) -> o_aulas.tsv e o_dig.tsv: oferta pública do bimestre
# Fica de fora o que identifica alunos (representante e cabeçalho do PDF). O código do Classroom vai junto, por decisão do projeto.
# Uso: perl montar_oferta_publica.pl <carga_horaria.csv> [ch.tsv extra]
use strict; use warnings; use utf8;
my %ch;
for my $f (@ARGV) {
  open my $h, '<:encoding(UTF-8)', $f or next;
  while (<$h>) { s/^\x{FEFF}//; s/\r?\n//; my ($c, $v) = split /[;\t]/; $ch{$c} = $v + 0 if $c && $v && $v =~ /^\d+$/ }
}
sub ler { open my $h, '<:encoding(UTF-8)', shift or die $!; my $cab = <$h>; my @r; while (<$h>) { s/\r?\n//; push @r, [split /\t/, $_, -1] } @r }
sub gravar { my ($f, @r) = @_; open my $o, '>:encoding(UTF-8)', $f or die $!; print $o join("\t", @$_), "\n" for @r }

my @a = (['Código', 'Disciplina', 'Dia', 'Horário', 'Turma', 'Curso', 'Sala', 'Professor', 'Tipo', 'C.H.', 'Classroom']);
my $n = 0;
for (ler('f_aulas.tsv')) {
  my ($c, $nm, $d, $hr, $t, $cu, undef, $s, $p, undef, $tp, $cls) = @$_;
  next if $c eq 'FLEX';
  push @a, [$c, $nm, $d, $hr, $t, $cu, $s, $p, $tp, $ch{$c} // '', $cls // '']; $n++;
}
my (%vis, @d) = ();
@d = (['Código', 'Disciplina', 'Turma', 'Curso', 'Professor', 'C.H.']);
for (ler('f_dig.tsv')) {
  my ($c, $nm, $t, $cu, undef, $p) = @$_;
  next if $vis{"$c|$t|$cu|$p"}++;
  push @d, [$c, $nm, $t, $cu, $p, $ch{$c} // ''];
}
gravar('o_aulas.tsv', @a);
gravar('o_dig.tsv', @d);
print "$n aulas e ", scalar(@d) - 1, " atividades digitais na oferta pública\n";
