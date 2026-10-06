#!/usr/bin/env perl
# Testes de fumaça do pipeline e do site. Uso: perl tests/verificar_saidas.pl <raiz-do-projeto>
use strict; use warnings; use utf8;
use IO::Uncompress::Unzip qw(unzip $UnzipError);
use JSON::PP;
use Encode ();
binmode STDOUT, ':encoding(UTF-8)';
my $raiz = shift // '.';
my $I = "$raiz/data/interim";
my ($ok, $falhas) = (0, 0);
sub teste { my ($nome, $cond, $det) = @_; if ($cond) { $ok++; print "  ok   $nome\n" } else { $falhas++; print "  FALHA $nome", ($det ? " ($det)" : ''), "\n" } }
sub ler { my $f = shift; open my $h, '<:encoding(UTF-8)', $f or return ''; local $/; my $t = <$h>; $t =~ s/^\x{FEFF}//; $t }

if (-f "$I/aulas.csv") {
  print "Extração (data/interim)\n";
  my @aulas = map { s/^"|"$//gr } grep { length } split /\n/, ler("$I/aulas.csv");
  shift @aulas;
  my @campos = map { [split /";"/, $_, -1] } @aulas;
  teste('existem aulas extraídas', @campos > 0, scalar @campos);
  my %dias = map { $_ => 1 } ('Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado');
  teste('todo dia é de segunda a sábado', !grep { !$dias{$_->[2]} } @campos);
  teste('todo horário é 19:00-20:30 ou 20:45-22:15', !grep { $_->[3] !~ /^(19:00 - 20:30|20:45 - 22:15)$/ } @campos);
  my @maus = grep { $_->[4] !~ /^([A-Z]{3,4}\d{6}|FLEX)$/ } @campos;
  teste('todo código tem formato AAAA000000', !@maus);
  teste('curso é CC ou ES quando há turma', !grep { $_->[9] ne '' && $_->[10] !~ /^(CC|ES)$/ } @campos);
  my $raw = ler("$I/raw.txt");
  my ($noPdf, $titulosFlex) = (0, 0);
  for my $pg (split /\f/, $raw) {
    $pg =~ s/ATIVIDADES DIGITAIS.*//s;
    $noPdf += () = $pg =~ /^([A-Z]{3,4}\d{6}|FLEX)\r?$/mg;
    $titulosFlex += () = $pg =~ /^Horário gerado com NPI Nexus\r?\nFLEX\r?$/mg;
  }
  my %celulas = map { join('|', @{$_}[0, 2, 3, 4, 5]) => 1 } @campos;
  teste('nº de células = nº de códigos no PDF', keys(%celulas) == $noPdf - $titulosFlex, scalar(keys %celulas) . ' vs ' . ($noPdf - $titulosFlex));
  my ($cabA) = split /\n/, ler("$I/o_aulas.tsv");
  teste('oferta pública tem só as colunas permitidas', ($cabA // '') eq join("\t", 'Código', 'Disciplina', 'Dia', 'Horário', 'Turma', 'Curso', 'Sala', 'Professor', 'Tipo', 'C.H.', 'Classroom'), $cabA);
} else { print "Extração: data/interim vazio (rode scripts/build-dados.sh para testar o pipeline)\n" }

print "Ofertas publicadas (public/jobs/ofertas)\n";
my $idx = eval { decode_json(do { open my $h, '<:raw', "$raiz/public/jobs/ofertas/index.json" or die; local $/; <$h> }) };
teste('index.json é JSON válido', $idx && ref $idx->{bimestres} eq 'ARRAY' && ref $idx->{disponiveis} eq 'ARRAY');
for my $b (@{ $idx->{disponiveis} || [] }) {
  my $x = "$raiz/public/jobs/ofertas/$b.xlsx";
  teste("$b.xlsx existe", -f $x);
  my $xml = '';
  unzip($x => \$xml, Name => 'xl/sharedStrings.xml') or $xml = '';
  utf8::decode($xml);
  teste("$b.xlsx tem as colunas esperadas", $xml =~ /Código/ && $xml =~ /Horário/ && $xml =~ /Professor/);
  teste("$b.xlsx não tem representantes de turma", $xml !~ /Representante|Turma [A-ZÁ-Ú][a-zá-ú]+ .* - E\d/);
}

print "Site (public/)\n";
my $html = ler("$raiz/public/index.html");
teste('index.html existe e começa com <!doctype html>', $html =~ /^<!doctype html>/i);
teste('marcadores do template substituídos', $html !~ /@@(ESTILOS|SCRIPTS)@@/);
teste('tem os módulos de ofertas, pendências e bimestre', $html =~ /function lerPlanilhaOfertas/ && $html =~ /function lerPlanilhaPendencias/ && $html =~ /function iniciarBimestres/);
teste('nenhuma pendência embutida (vêm por importação)', $html !~ /const PENDENTES=\[\{/ && $html !~ /const CH_MAP=/);

# termos pessoais listados localmente em assets/dados-pessoais.txt (fora do Git): não podem aparecer em nada que vai para o repositório
if (open my $t, '<:encoding(UTF-8)', "$raiz/assets/dados-pessoais.txt") {
  my @termos = grep { length } map { s/^\s+|\s+$//gr } <$t>;
  my @arqs = grep { length && $_ ne 'LICENSE' } split /\n/, `git -C "$raiz" ls-files -co --exclude-standard`;
  my %achados;
  for my $f (@arqs) {
    my $c = '';
    if ($f =~ /\.xlsx$/i) { unzip("$raiz/$f" => \$c, Name => 'xl/sharedStrings.xml') or $c = '' }
    else { open my $h, '<:raw', "$raiz/$f" or next; local $/; $c = <$h> // '' }
    $c = lc(Encode::decode('UTF-8', $c, Encode::FB_QUIET()) // '');
    for (@termos) { $achados{$f} = 1 if index($c, lc $_) >= 0 }
  }
  teste('nenhum termo de assets/dados-pessoais.txt nos arquivos que vão para o Git', !%achados, join(', ', sort keys %achados));
}
my ($abre, $fecha) = (scalar(() = $html =~ /<script\b/g), scalar(() = $html =~ /<\/script>/g));
teste('tags <script> balanceadas', $abre == $fecha, "$abre/$fecha");
teste('.nojekyll presente', -f "$raiz/public/.nojekyll");
my @proibidos = grep { -e } map { "$raiz/public/$_" } qw(Pendentes.xlsx jobs/dados jobs/exports);
teste('nada pessoal em public/', !@proibidos, "@proibidos");

print "\n$ok ok, $falhas falha(s)\n";
exit($falhas ? 1 : 0);
