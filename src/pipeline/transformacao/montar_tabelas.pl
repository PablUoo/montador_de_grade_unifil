use strict; use warnings; use utf8;
my %CN = (CC => 'Ciência da Computação', ES => 'Engenharia de Software');
sub rd { open my $f,'<:encoding(UTF-8)',shift; my @r; while(<$f>){ s/^\x{FEFF}//; chomp; s/^"|"$//g; push @r,[split /";"/,$_,-1] } shift @r; @r }
sub wr { my ($fn,@r)=@_; open my $o,'>:encoding(UTF-8)',$fn; print $o join("\t",@$_),"\n" for @r }
my %dord = ('Segunda-feira'=>1,'Terça-feira'=>2,'Quarta-feira'=>3,'Quinta-feira'=>4,'Sexta-feira'=>5,'Sábado'=>6);
my @a = map { my ($pg,$g,$d,$h,$c,$n,$pr,$s,$cl,$t,$cu,$rep,$tp)=@$_;
  if ($g eq '(continuação)' || $g eq 'Grade FLEX (optativas)') { $g='Grade FLEX (optativas)'; if($t eq ''){ $t='FLEX (optativa)'; $cu='CC/ES'; $tp='OPTATIVA' } }
  [$c,$n,$d,$h,$t,$cu,($CN{$cu}//'Ciência da Computação / Engenharia de Software'),$s,$pr,$rep,$tp,$cl,$g,$pg] } rd('aulas.csv');
@a = sort { $a->[13] <=> $b->[13] || $a->[3] cmp $b->[3] || $dord{$a->[2]} <=> $dord{$b->[2]} } @a;
wr('f_aulas.tsv',['Código','Disciplina','Dia','Horário','Turma','Curso (sigla)','Curso','Sala','Professor','Representante','Tipo','Classroom','Grupo (cabeçalho do PDF)','Página'],@a);
my (%cnt,@d);
for (rd('digitais.csv')) { my ($pg,$g,$c,$n,$pr,$t,$cu)=@$_; my $k=join'|',$pg,$c,$t,$cu; push @d,[$c,$n,$t,$cu,$CN{$cu},$pr,$g,$pg] unless $cnt{$k}++; }
$_->[8]=$cnt{join'|',$_->[7],$_->[0],$_->[2],$_->[3]} for @d;
wr('f_dig.tsv',['Código','Disciplina','Turma','Curso (sigla)','Curso','Professor','Grupo (cabeçalho do PDF)','Página','Ocorrências no PDF'],@d);
# resumo de disciplinas
my %r;
for (@a) { my $k=$_->[0]; $r{$k}{n}=$_->[1]; $r{$k}{m}='Presencial' unless $_->[0] eq 'FLEX'; $r{$k}{t}{"$_->[4] $_->[5]"}=1 if $_->[4]; $r{$k}{h}{"$_->[2] $_->[3]"}=1; $r{$k}{s}{$_->[7]}=1 if $_->[7]; $r{$k}{p}{$_->[8]}=1 if $_->[8] }
for (@d) { my $k=$_->[0]; $r{$k}{n}//=$_->[1]; $r{$k}{dg}=1; $r{$k}{t}{"$_->[2] $_->[3]"}=1; $r{$k}{p}{$_->[5]}=1 }
wr('f_res.tsv',['Código','Disciplina','Modalidade','Turmas','Horários','Salas','Professor(es)'],
  map { my $x=$r{$_}; [$_,$x->{n},join(" + ", grep {$_} $x->{m}, $x->{dg} ? "Atividade Digital" : ""), join(', ',sort keys %{$x->{t}||{}}),join(', ',sort { $dord{(split / /,$a)[0]} <=> $dord{(split / /,$b)[0]} || $a cmp $b } keys %{$x->{h}||{}}),join(', ',sort keys %{$x->{s}||{}}),join(', ',sort keys %{$x->{p}||{}})] } sort keys %r);
print scalar(@a)," aulas, ",scalar(@d)," digitais, ",scalar(keys %r)," disciplinas\n";
