// Agenda geral de sex, 16/10/2026 (dados de exemplo usados nas telas 06 e 07)
// Cada agendamento tem um serviço. Status: agendado, concluido, cancelado, faltou.
(function () {
  var INICIO = 9 * 60;
  var FIM = 19 * 60;
  var PX_HORA = 64;
  var AGORA = '15:12';

  var barbeiros = [
    {
      nome: 'Rafael Moura', iniciais: 'RM', resumo: '12 agendamentos',
      itens: [
        ['09:00', '09:30', 'Vinícius Barros', 'Corte', 'concluido', 'Clube'],
        ['09:30', '09:50', 'Henrique Matos', 'Barba', 'concluido'],
        ['10:00', '10:30', 'Leonardo Pires', 'Pigmentação', 'concluido'],
        ['10:30', '11:00', 'Otávio Reis', 'Corte infantil', 'concluido'],
        ['11:00', '11:30', 'Eduardo Campos', 'Corte', 'concluido'],
        ['12:00', '13:00', 'Almoço', '', 'bloqueio'],
        ['13:30', '14:00', 'Marcelo Antunes', 'Corte', 'concluido'],
        ['14:30', '14:50', 'Igor Fontana', 'Barba', 'concluido'],
        ['15:00', '15:30', 'Rodrigo Teixeira', 'Corte', 'agendado'],
        ['16:00', '16:30', 'Daniel Freitas', 'Corte', 'agendado'],
        ['16:30', '16:50', 'Gustavo Moraes', 'Barba', 'agendado'],
        ['17:30', '18:00', 'Fábio Siqueira', 'Corte', 'agendado'],
        ['18:30', '19:00', 'Renato Galvão', 'Corte', 'agendado']
      ]
    },
    {
      nome: 'Diego Santana', iniciais: 'DS', resumo: '9 agendamentos',
      itens: [
        ['09:00', '09:30', 'Matheus Oliveira', 'Corte', 'concluido'],
        ['09:30', '10:00', 'Gabriel Rocha', 'Corte', 'faltou'],
        ['10:00', '10:20', 'João Batista Silva', 'Barba', 'concluido'],
        ['11:00', '11:30', 'Bruno Carvalho', 'Corte', 'cancelado'],
        ['11:30', '12:00', 'Ricardo Tavares', 'Pigmentação', 'concluido'],
        ['12:30', '13:30', 'Almoço', '', 'bloqueio'],
        ['14:00', '14:30', 'Pedro Henrique Costa', 'Corte', 'concluido'],
        ['15:00', '15:30', 'Lucas Almeida', 'Corte', 'agendado', 'Clube'],
        ['16:00', '16:20', 'Felipe Nunes', 'Barba', 'agendado'],
        ['17:30', '18:00', 'André Luiz Prado', 'Corte', 'agendado']
      ]
    },
    {
      nome: 'Thiago Lemos', iniciais: 'TL', resumo: '13 agendamentos',
      itens: [
        ['09:00', '09:30', 'Renan Vieira', 'Corte', 'concluido', 'Clube'],
        ['09:30', '10:00', 'Murilo Castro', 'Corte', 'concluido'],
        ['10:00', '10:20', 'Paulo Sérgio Lima', 'Barba', 'concluido'],
        ['10:30', '11:00', 'Samuel Duarte', 'Corte', 'concluido'],
        ['11:00', '11:20', 'Wagner Dias', 'Barba', 'concluido'],
        ['11:30', '12:00', 'Alexandre Prado', 'Corte', 'concluido'],
        ['12:00', '12:30', 'Leandro Souza', 'Corte', 'concluido'],
        ['13:00', '14:00', 'Almoço', '', 'bloqueio'],
        ['14:00', '14:30', 'Vitor Hugo Ramos', 'Corte', 'concluido'],
        ['14:30', '15:00', 'Caíque Moreira', 'Corte infantil', 'concluido'],
        ['15:00', '15:30', 'Nicolas Batista', 'Corte', 'agendado'],
        ['16:00', '16:20', 'Thales Mendes', 'Barba', 'agendado'],
        ['17:00', '17:30', 'Júlio César Faria', 'Pigmentação', 'agendado'],
        ['18:00', '18:30', 'Davi Nogueira', 'Corte', 'agendado']
      ]
    },
    {
      nome: 'Caio Ferreira', iniciais: 'CF', resumo: '6 agendamentos · folga à tarde',
      itens: [
        ['09:00', '09:30', 'Enzo Martins', 'Corte infantil', 'concluido'],
        ['09:30', '10:00', 'Lorenzo Cardoso', 'Corte', 'concluido'],
        ['10:00', '10:20', 'Heitor Vasconcelos', 'Barba', 'concluido'],
        ['10:30', '11:00', 'Arthur Ribeiro', 'Corte', 'concluido', 'Clube'],
        ['11:30', '12:00', 'Miguel Fonseca', 'Corte', 'cancelado'],
        ['12:00', '12:30', 'Vicente Lopes', 'Corte', 'concluido'],
        ['13:00', '19:00', 'Folga', 'Tarde livre, combinada com o Rafael', 'folga']
      ]
    }
  ];

  var STATUS = {
    'agendado': { nome: 'Agendado', icone: 'clock' },
    'concluido': { nome: 'Concluído', icone: 'check' },
    'cancelado': { nome: 'Cancelado', icone: 'x' },
    'faltou': { nome: 'Faltou', icone: 'user-x' }
  };

  function minutos(h) { var p = h.split(':'); return +p[0] * 60 + +p[1]; }
  function px(min) { return (min - INICIO) * PX_HORA / 60; }

  function bloco(item) {
    var ini = minutos(item[0]), fim = minutos(item[1]);
    var dur = fim - ini;
    var topo = px(ini) + 1;
    var altura = dur * PX_HORA / 60 - 2;
    var status = item[4];
    var estilo = 'top:' + topo + 'px;height:' + altura + 'px';

    if (status === 'bloqueio' || status === 'folga') {
      return '<div class="bloco bloco--' + status + ' hachurado" style="' + estilo + '">' +
        '<span class="bloco__bloqueio"><i data-lucide="' + (status === 'folga' ? 'calendar-off' : 'utensils') + '"></i>' + item[2] +
        ' <span class="num">' + item[0] + ' às ' + item[1] + '</span></span>' +
        (item[3] ? '<span class="bloco__nota">' + item[3] + '</span>' : '') +
        '</div>';
    }

    var s = STATUS[status];
    var tag = item[5] ? '<span class="bloco__tag" title="Assinante do clube">' + item[5] + '</span>' : '';
    var icone = '<i data-lucide="' + s.icone + '" class="bloco__icone"></i>';
    var conteudo = '<span class="bloco__linha"><span class="bloco__texto"><span class="num bloco__hora">' + item[0] + '</span> ' +
      '<span class="bloco__cliente">' + item[2] + '</span> <span class="bloco__meta">· ' + item[3] + '</span></span>' + tag + icone + '</span>';
    return '<div class="bloco bloco--' + status + '" style="' + estilo + '" title="' + s.nome + '">' + conteudo + '</div>';
  }

  function render(alvo) {
    var altura = (FIM - INICIO) * PX_HORA / 60;
    var cab = '<div class="agenda__cab"><div class="agenda__canto"></div>';
    var cols = '';
    barbeiros.forEach(function (b) {
      cab += '<div class="agenda__barbeiro"><span class="avatar avatar--sm">' + b.iniciais + '</span>' +
        '<div><div class="agenda__nome">' + b.nome + '</div><div class="agenda__resumo">' + b.resumo + '</div></div></div>';
      cols += '<div class="agenda__coluna">' + b.itens.map(bloco).join('') + '</div>';
    });
    cab += '</div>';

    var horas = '';
    var agoraMin = minutos(AGORA);
    for (var h = INICIO; h <= FIM; h += 60) {
      if (Math.abs(h - agoraMin) < 20) continue;
      horas += '<span class="agenda__hora num" style="top:' + px(h) + 'px">' + String(h / 60).padStart(2, '0') + ':00</span>';
    }
    var linhaAgora = '<div class="agenda__agora" style="top:' + px(agoraMin) + 'px"><span class="num">' + AGORA + '</span></div>';

    alvo.innerHTML = cab +
      '<div class="agenda__corpo" style="height:' + altura + 'px">' +
      '<div class="agenda__horas">' + horas + '</div>' +
      '<div class="agenda__colunas">' + cols + '</div>' + linhaAgora +
      '</div>';
  }

  document.querySelectorAll('[data-agenda]').forEach(render);
})();
