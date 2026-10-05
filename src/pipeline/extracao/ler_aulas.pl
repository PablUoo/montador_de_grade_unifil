use strict; use warnings; use utf8;
binmode STDOUT, ':encoding(UTF-8)';
my $CODE = qr/^([A-Z]{3,4}\d{6}|FLEX)$/;
my $SALA = qr/^(\d{3,4}|Lab\s*\d+|Sala.*|Audit.*)$/i;
my $ENTR = qr/(E\d+\/\d{4})\s+(CC|ES)\s*\|\s*(.*?)\s*(?:·\s*([^\s·]+)\s*|(?=E\d+\/\d{4}\s+(?:CC|ES)\s*\|)|$)/;
my @rows;
for my $P (1 .. 19) {
  open my $f, '<:encoding(UTF-8)', "cols_$P.txt" or next; local $/; my $all = <$f>;
  for my $blk (split /^##CELL\t/m, $all) {
    next unless $blk =~ s/^(\d+)\t(.*?)\t(.*?)\t(.*?)\n//;
    my ($p, $hdr, $dia, $hor) = ($1, $2, $3, $4);
    my @L = grep { length && $_ ne "\f" } map { s/^\s+|\s+$//gr } split /\n/, $blk;
    @L = grep { !/^(\d\d:\d\d - \d\d:\d\d|INTERVALO.*|ATIVIDADES DIGITAIS)$/ } @L;
    my @idx = grep { $L[$_] =~ $CODE } 0 .. $#L;
    # start of each cell = line after previous cell's last "terminal" line
    my @start;
    for my $k (0 .. $#idx) {
      if ($k == 0) { push @start, 0; next }
      my $last = $idx[$k - 1] + 1;
      for my $j ($idx[$k - 1] + 1 .. $idx[$k] - 1) {
        $last = $j + 1 if $L[$j] =~ /·|^CORE$|EXTENS|G\.H\.|Classroom|$SALA/ || ($L[$idx[$k-1]] eq 'FLEX' && $L[$j] =~ /\|/);
      }
      push @start, $last;
    }
    for my $k (0 .. $#idx) {
      my $ci = $idx[$k];
      my $end = $k < $#idx ? $start[$k + 1] : scalar @L;
      my $nome = join ' ', @L[$start[$k] .. $ci - 1];
      my @after = @L[$ci + 1 .. $end - 1];
      my ($prof, $sala, $class, $gh) = ('', '', '', '');
      if ($L[$ci] ne 'FLEX') {
        while (@after && $after[0] !~ /$SALA|Classroom|G\.H\.|\|/) { $prof .= ($prof ? ' ' : '') . shift @after }
        $sala = shift @after if @after && $after[0] =~ $SALA;
      } else { $nome = 'FLEX (horário de optativa)' . ($nome ? " $nome" : '') }
      my $ent = join ' ', grep { !/Classroom|G\.H\./ } @after;
      ($class) = map { /Classroom:\s*(\S+)/ ? $1 : () } @after; $class //= '';
      my @t;
      while ($ent =~ /$ENTR/g) { my @m = ($1, $2, $3, $4 // ''); last if !length $m[0]; push @t, \@m }
      warn "LEFTOVER p$p $dia $hor $L[$ci]: [$ent]\n" if !@t && length $ent;
      @t = (['', '', '', '']) unless @t;
      my $cod = $L[$ci] eq 'FLEX' ? 'FLEX' : $L[$ci];
      push @rows, [$p, $hdr, $dia, $hor, $cod, $nome, $prof, $sala, $class, @$_] for @t;
    }
  }
}
sub qq_ { my $v = shift // ''; $v =~ s/"/""/g; qq("$v") }
open my $o, '>:encoding(UTF-8)', 'aulas.csv' or die;
print $o "\x{FEFF}", join(';', map { qq_($_) } 'Página', 'Grupo (cabeçalho)', 'Dia', 'Horário', 'Código', 'Disciplina', 'Professor', 'Sala', 'Classroom', 'Turma', 'Curso', 'Representante', 'Tipo'), "\n";
print $o join(';', map { qq_($_) } @$_), "\n" for @rows;
print scalar(@rows), " rows\n";
