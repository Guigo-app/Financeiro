import { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const anoAtualRef = new Date().getFullYear();

export default function App() {
  // --- AUTENTICAÇÃO MULTI-USUÁRIO ---
  const [loggedUser, setLoggedUser] = useState(() => localStorage.getItem('fin_user') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('fin_auth') === 'true');
  const [loginInputUser, setLoginInputUser] = useState('');
  const [loginInputPass, setLoginInputPass] = useState('');

  // --- CARREGAMENTO INICIAL BLINDADO CONTRA BUGS ---
  const [categorias, setCategorias] = useState(() => {
    const isAuth = localStorage.getItem('fin_auth') === 'true';
    const user = localStorage.getItem('fin_user');
    if (isAuth && user) {
      const catSalvo = localStorage.getItem(`fin_cat_${user}`);
      return catSalvo ? JSON.parse(catSalvo) : {
        Rendas: ['Salário', 'Freelance', 'Rendimentos'],
        Gastos: ['Aluguel', 'Energia', 'Condomínio', 'Internet', 'Cartão de Crédito'],
        Investimentos: ['Caixinha NuBank', 'Tesouro Direto']
      };
    }
    return { Rendas: [], Gastos: [], Investimentos: [] };
  });

  const [valores, setValores] = useState(() => {
    const isAuth = localStorage.getItem('fin_auth') === 'true';
    const user = localStorage.getItem('fin_user');
    if (isAuth && user) {
      const valSalvo = localStorage.getItem(`fin_val_${user}`);
      return valSalvo ? JSON.parse(valSalvo) : {};
    }
    return {};
  });

  const [notas, setNotas] = useState(() => {
    const isAuth = localStorage.getItem('fin_auth') === 'true';
    const user = localStorage.getItem('fin_user');
    if (isAuth && user) {
      const notaSalvo = localStorage.getItem(`fin_notas_${user}`);
      return notaSalvo ? JSON.parse(notaSalvo) : {};
    }
    return {};
  });

  const [checks, setChecks] = useState(() => {
    const isAuth = localStorage.getItem('fin_auth') === 'true';
    const user = localStorage.getItem('fin_user');
    if (isAuth && user) {
      const checkSalvo = localStorage.getItem(`fin_checks_${user}`);
      return checkSalvo ? JSON.parse(checkSalvo) : {};
    }
    return {};
  });

  const [sharedExpenses, setSharedExpenses] = useState(() => {
    const salvo = localStorage.getItem('fin_shared_expenses');
    return salvo ? JSON.parse(salvo) : [];
  });

  const handleLogin = (e) => {
    e.preventDefault();
    const u = loginInputUser.trim();
    
    if ((u === 'Guigo' && loginInputPass === '01091996') || (u === 'Favu' && loginInputPass === '16091992')) {
      const catSalvo = localStorage.getItem(`fin_cat_${u}`);
      setCategorias(catSalvo ? JSON.parse(catSalvo) : {
        Rendas: ['Salário', 'Freelance', 'Rendimentos'],
        Gastos: ['Aluguel', 'Energia', 'Condomínio', 'Internet', 'Cartão de Crédito'],
        Investimentos: ['Caixinha NuBank', 'Tesouro Direto']
      });

      const valSalvo = localStorage.getItem(`fin_val_${u}`);
      setValores(valSalvo ? JSON.parse(valSalvo) : {});

      const notasSalvo = localStorage.getItem(`fin_notas_${u}`);
      setNotas(notasSalvo ? JSON.parse(notasSalvo) : {});

      const checkSalvo = localStorage.getItem(`fin_checks_${u}`);
      setChecks(checkSalvo ? JSON.parse(checkSalvo) : {});

      setIsAuthenticated(true);
      setLoggedUser(u);
      localStorage.setItem('fin_auth', 'true');
      localStorage.setItem('fin_user', u);
    } else {
      alert('Usuário ou senha incorretos! Lembre-se de usar letras maiúsculas.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoggedUser('');
    localStorage.removeItem('fin_auth');
    localStorage.removeItem('fin_user');
    setLoginInputPass('');
  };

  // --- ESTADOS DA APLICAÇÃO GERAL ---
  const [abaAtual, setAbaAtual] = useState('lancamentos');
  const [anoSelecionado, setAnoSelecionado] = useState(anoAtualRef);
  const [novoItemNome, setNovoItemNome] = useState('');
  const [novoItemTipo, setNovoItemTipo] = useState('Gastos');
  const [draggedItem, setDraggedItem] = useState(null);

  // ESTADO DO MODAL DE NOTAS
  const [noteModal, setNoteModal] = useState({ isOpen: false, mes: '', item: '', text: '' });

  // --- ESTADOS DA ABA COMPARTILHADOS ---
  const [sharedTitle, setSharedTitle] = useState('');
  const [sharedDesc, setSharedDesc] = useState('');
  const [sharedAmount, setSharedAmount] = useState('');
  const [sharedPaidBy, setSharedPaidBy] = useState('');
  const [sharedSplitMode, setSharedSplitMode] = useState('50_50');
  const [editingSharedId, setEditingSharedId] = useState(null);

  useEffect(() => {
    if (isAuthenticated && loggedUser && !sharedPaidBy) {
      setSharedPaidBy(loggedUser); 
    }
  }, [isAuthenticated, loggedUser, sharedPaidBy]);

  const listaAnos = useMemo(() => {
    const anosComDados = Object.keys(valores)
      .map(k => parseInt(k.replace('ano_', '')))
      .filter(y => !isNaN(y));
    
    anosComDados.push(anoAtualRef - 5);
    anosComDados.push(anoAtualRef + 5);
    
    const minAno = Math.min(...anosComDados);
    const maxAno = Math.max(...anosComDados);
    
    return Array.from({ length: maxAno - minAno + 1 }, (_, i) => minAno + i);
  }, [valores]);

  useEffect(() => {
    if (isAuthenticated && loggedUser) {
      localStorage.setItem(`fin_cat_${loggedUser}`, JSON.stringify(categorias));
      localStorage.setItem(`fin_val_${loggedUser}`, JSON.stringify(valores));
      localStorage.setItem(`fin_notas_${loggedUser}`, JSON.stringify(notas));
      localStorage.setItem(`fin_checks_${loggedUser}`, JSON.stringify(checks)); 
    }
  }, [categorias, valores, notas, checks, isAuthenticated, loggedUser]);

  useEffect(() => {
    localStorage.setItem('fin_shared_expenses', JSON.stringify(sharedExpenses));
  }, [sharedExpenses]);

  // --- LÓGICA DE NEGÓCIO (PLANILHA) ---
  const atualizarValor = (mes, item, novoValor) => {
    const valorLimpo = novoValor.replace(/[^0-9.,]/g, '');
    const ano = `ano_${anoSelecionado}`;
    
    setValores(prev => ({
      ...prev,
      [ano]: {
        ...(prev[ano] || {}),
        [mes]: {
          ...(prev[ano]?.[mes] || {}),
          [item]: valorLimpo
        }
      }
    }));
  };

  const handleToggleCheck = (mes, item) => {
    const ano = `ano_${anoSelecionado}`;
    setChecks(prev => {
      const isCurrentlyChecked = prev[ano]?.[mes]?.[item] || false;
      return {
        ...prev,
        [ano]: {
          ...(prev[ano] || {}),
          [mes]: {
            ...(prev[ano]?.[mes] || {}),
            [item]: !isCurrentlyChecked
          }
        }
      };
    });
  };

  const handleRightClickInput = (e, mes, item) => {
    e.preventDefault(); 
    const ano = `ano_${anoSelecionado}`;
    const notaAtual = notas[ano]?.[mes]?.[item] || '';
    setNoteModal({ isOpen: true, mes, item, text: notaAtual });
  };

  const salvarNota = () => {
    const ano = `ano_${anoSelecionado}`;
    setNotas(prev => ({
      ...prev,
      [ano]: {
        ...(prev[ano] || {}),
        [noteModal.mes]: {
          ...(prev[ano]?.[noteModal.mes] || {}),
          [noteModal.item]: noteModal.text.trim()
        }
      }
    }));
    setNoteModal({ isOpen: false, mes: '', item: '', text: '' });
  };

  const formatarCampoAoSair = (mes, item, valor) => {
    if (!valor) return;
    const numeroMatematico = parseFloat(valor.toString().replace(/\./g, '').replace(',', '.'));
    if (!isNaN(numeroMatematico)) {
      const valorFormatado = numeroMatematico.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      atualizarValor(mes, item, valorFormatado);
    }
  };

  const handleKeyDownInput = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.target.blur();
      const currentTd = e.target.closest('td');
      const currentTr = currentTd.closest('tr');
      const cellIndex = Array.from(currentTr.children).indexOf(currentTd);

      let nextTr = currentTr.nextElementSibling;
      while (nextTr) {
        const nextInput = nextTr.children[cellIndex]?.querySelector('input');
        if (nextInput) {
          nextInput.focus();
          break;
        }
        nextTr = nextTr.nextElementSibling;
      }
    }
  };

  const adicionarItem = () => {
    const nomeLimpo = novoItemNome.trim();
    if (nomeLimpo === '') {
      alert('Por favor, digite um nome para a nova linha!');
      return;
    }
    if (categorias[novoItemTipo].includes(nomeLimpo)) {
      alert('Este item já existe nessa categoria!');
      return;
    }
    setCategorias({ ...categorias, [novoItemTipo]: [...categorias[novoItemTipo], nomeLimpo] });
    setNovoItemNome('');
  };

  const removerItem = (tipo, itemParaRemover) => {
    setCategorias({ ...categorias, [tipo]: categorias[tipo].filter(item => item !== itemParaRemover) });
  };

  const renomearItem = (tipo, nomeAntigo, novoNome) => {
    const nomeLimpo = novoNome.trim();
    if (!nomeLimpo || nomeLimpo === nomeAntigo) return;
    
    if (categorias[tipo].includes(nomeLimpo)) {
      alert('Já existe um item com esse nome!');
      setCategorias({...categorias}); 
      return;
    }

    setCategorias(prev => ({
      ...prev,
      [tipo]: prev[tipo].map(item => item === nomeAntigo ? nomeLimpo : item)
    }));

    setValores(prev => {
      const novosValores = JSON.parse(JSON.stringify(prev));
      Object.keys(novosValores).forEach(ano => {
        Object.keys(novosValores[ano]).forEach(mes => {
          if (novosValores[ano][mes][nomeAntigo] !== undefined) {
            novosValores[ano][mes][nomeLimpo] = novosValores[ano][mes][nomeAntigo];
            delete novosValores[ano][mes][nomeAntigo];
          }
        });
      });
      return novosValores;
    });

    setNotas(prev => {
      const novasNotas = JSON.parse(JSON.stringify(prev));
      Object.keys(novasNotas).forEach(ano => {
        Object.keys(novasNotas[ano]).forEach(mes => {
          if (novasNotas[ano][mes][nomeAntigo] !== undefined) {
            novasNotas[ano][mes][nomeLimpo] = novasNotas[ano][mes][nomeAntigo];
            delete novasNotas[ano][mes][nomeAntigo];
          }
        });
      });
      return novasNotas;
    });

    setChecks(prev => {
      const novosChecks = JSON.parse(JSON.stringify(prev));
      Object.keys(novosChecks).forEach(ano => {
        Object.keys(novosChecks[ano]).forEach(mes => {
          if (novosChecks[ano][mes][nomeAntigo] !== undefined) {
            novosChecks[ano][mes][nomeLimpo] = novosChecks[ano][mes][nomeAntigo];
            delete novosChecks[ano][mes][nomeAntigo];
          }
        });
      });
      return novosChecks;
    });
  };

  const calcularTotal = (mes, listaItens) => {
    const ano = `ano_${anoSelecionado}`;
    return listaItens.reduce((total, item) => {
      const valorString = valores[ano]?.[mes]?.[item] || '0';
      const valorDecimal = parseFloat(valorString.toString().replace(/\./g, '').replace(',', '.'));
      return total + (isNaN(valorDecimal) ? 0 : valorDecimal);
    }, 0);
  };

  const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleDragStart = (tipo, index) => setDraggedItem({ tipo, index });
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (tipo, targetIndex) => {
    if (!draggedItem || draggedItem.tipo !== tipo) return;
    const novaLista = [...categorias[tipo]];
    const [removido] = novaLista.splice(draggedItem.index, 1);
    novaLista.splice(targetIndex, 0, removido);
    setCategorias({ ...categorias, [tipo]: novaLista });
    setDraggedItem(null);
  };

  // --- LÓGICA DE NEGÓCIO (COMPARTILHADOS / SPLITWISE) ---
  const handleSaveSharedExpense = () => {
    if (!sharedTitle.trim() || !sharedAmount) return alert('Preencha o nome do item e o valor!');
    const numAmount = parseFloat(sharedAmount.toString().replace(/\./g, '').replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) return alert('Valor inválido!');

    if (editingSharedId) {
      setSharedExpenses(prev => prev.map(exp => 
        exp.id === editingSharedId 
          ? { ...exp, title: sharedTitle.trim(), desc: sharedDesc.trim(), amount: numAmount, paidBy: sharedPaidBy, splitMode: sharedSplitMode } 
          : exp
      ));
      setEditingSharedId(null);
    } else {
      const newExpense = {
        id: Date.now(),
        date: new Date().toLocaleDateString('pt-BR'),
        title: sharedTitle.trim(),
        desc: sharedDesc.trim(),
        amount: numAmount,
        paidBy: sharedPaidBy,
        splitMode: sharedSplitMode,
        isSettled: false
      };
      setSharedExpenses([newExpense, ...sharedExpenses]);
    }
    
    setSharedTitle('');
    setSharedDesc('');
    setSharedAmount('');
  };

  const handleEditShared = (exp) => {
    setEditingSharedId(exp.id);
    setSharedTitle(exp.title || exp.desc); 
    setSharedDesc(exp.title && exp.desc !== exp.title ? exp.desc : '');
    setSharedAmount(exp.amount.toString());
    setSharedPaidBy(exp.paidBy);
    setSharedSplitMode(exp.splitMode);
  };

  const handleCancelEdit = () => {
    setEditingSharedId(null);
    setSharedTitle('');
    setSharedDesc('');
    setSharedAmount('');
  };

  const handleDeleteSharedExpense = (id) => {
    if(window.confirm("Deseja realmente excluir essa conta?")) {
      setSharedExpenses(sharedExpenses.filter(exp => exp.id !== id));
    }
  };

  const splitwiseData = useMemo(() => {
    let myPaidTotal = 0;
    let partnerPaidTotal = 0;
    let myBalance = 0;

    const partnerName = loggedUser === 'Guigo' ? 'Favu' : 'Guigo';

    sharedExpenses.forEach(exp => {
      const isMePaying = exp.paidBy === loggedUser;
      
      if (isMePaying) myPaidTotal += exp.amount;
      else partnerPaidTotal += exp.amount;

      if (!exp.isSettled) {
        let myShare = 0;
        if (exp.splitMode === '50_50') {
          myShare = exp.amount / 2;
        } else if (exp.splitMode === `100_${loggedUser.toLowerCase()}`) {
          myShare = exp.amount;
        }

        if (isMePaying) {
          myBalance += (exp.amount - myShare); 
        } else {
          myBalance -= myShare; 
        }
      }
    });

    return { myBalance, myPaidTotal, partnerPaidTotal, partnerName };
  }, [sharedExpenses, loggedUser]);

  const handleSettleDebt = () => {
    if (splitwiseData.myBalance >= 0) return; 
    
    const confirmacao = window.confirm(`Deseja lançar um pagamento automático de ${formatarMoeda(Math.abs(splitwiseData.myBalance))} para ${splitwiseData.partnerName} e zerar sua dívida?`);
    
    if (confirmacao) {
      const newExpense = {
        id: Date.now(),
        date: new Date().toLocaleDateString('pt-BR'),
        title: 'Acerto de Contas',
        desc: 'Pagamento de dívida pendente',
        amount: Math.abs(splitwiseData.myBalance),
        paidBy: loggedUser,
        splitMode: `100_${splitwiseData.partnerName.toLowerCase()}`,
        isSettled: false
      };
      setSharedExpenses([newExpense, ...sharedExpenses]);
    }
  };

  // --- DADOS DO DASHBOARD ---
  const dadosGraficoCompleto = useMemo(() => {
    return meses.map(mes => ({
      mes: mes,
      Receita: calcularTotal(mes, categorias.Rendas),
      Despesa: calcularTotal(mes, categorias.Gastos),
      Investimento: calcularTotal(mes, categorias.Investimentos),
    }));
  }, [valores, categorias, anoSelecionado]); // eslint-disable-line

  const totalReceitas = dadosGraficoCompleto.reduce((acc, item) => acc + item.Receita, 0);
  const totalDespesas = dadosGraficoCompleto.reduce((acc, item) => acc + item.Despesa, 0);
  const totalInvestimentos = dadosGraficoCompleto.reduce((acc, item) => acc + item.Investimento, 0);
  const saldoGeral = totalReceitas - totalDespesas - totalInvestimentos;

  const renderizarLinhasTabela = (tipo, listaItens, cor) => {
    const ano = `ano_${anoSelecionado}`;
    return listaItens.map((item, index) => (
      <tr key={item} className="table-row">
        <td className="sticky-col">
          <div 
            className="category-cell"
            draggable
            onDragStart={() => handleDragStart(tipo, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => { e.preventDefault(); handleDrop(tipo, index); }}
            style={{ cursor: 'grab' }}
          >
            <div className="drag-handle" title="Arraste para reordenar" style={{ color: '#94A3B8', paddingRight: '8px', userSelect: 'none' }}>⋮⋮</div>
            <div className="category-indicator" style={{ backgroundColor: cor }}></div>
            
            <input 
              type="text"
              className="item-name-input"
              defaultValue={item}
              title="Clique para renomear"
              onBlur={(e) => renomearItem(tipo, item, e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
            />

            <button onClick={() => removerItem(tipo, item)} className="delete-btn" title="Excluir item">✕</button>
          </div>
        </td>
        
        {meses.map(mes => {
          const temNota = notas[ano]?.[mes]?.[item] && notas[ano]?.[mes]?.[item].trim() !== '';
          const textoNota = notas[ano]?.[mes]?.[item] || '';
          const isChecked = checks[ano]?.[mes]?.[item] || false;

          return (
            <td key={`${item}-${mes}`} className="input-cell">
              <div className={`input-wrapper ${temNota ? 'has-note' : ''} ${isChecked ? 'is-checked' : ''}`}>
                
                <button 
                  className={`check-btn ${isChecked ? 'checked' : ''}`}
                  onClick={() => handleToggleCheck(mes, item)}
                  title={isChecked ? "Desmarcar" : "Marcar como Validado/Pago"}
                >
                  {isChecked ? '✓' : ''}
                </button>

                <input 
                  type="text" 
                  value={valores[ano]?.[mes]?.[item] || ''} 
                  onChange={(e) => atualizarValor(mes, item, e.target.value)}
                  onBlur={(e) => formatarCampoAoSair(mes, item, e.target.value)}
                  onKeyDown={handleKeyDownInput}
                  onContextMenu={(e) => handleRightClickInput(e, mes, item)}
                  placeholder="0,00" 
                  className="data-input"
                />
                
                {temNota && <div className="note-indicator"></div>}
                
                {temNota && (
                  <div className="custom-tooltip">
                    {textoNota}
                  </div>
                )}
              </div>
            </td>
          );
        })}
      </tr>
    ));
  };

  const GuigoIcon = () => (
    <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="95" fill="#F0F9FF"></circle>
      <circle cx="100" cy="100" r="90" stroke="#0EA5E9" strokeWidth="4" strokeDasharray="8 6"></circle>
      <circle cx="100" cy="95" r="50" fill="#4B2C20"></circle>
      <circle cx="65" cy="100" r="30" fill="#4B2C20"></circle>
      <circle cx="135" cy="100" r="30" fill="#4B2C20"></circle>
      <circle cx="100" cy="60" r="35" fill="#4B2C20"></circle>
      <circle cx="70" cy="70" r="28" fill="#4B2C20"></circle>
      <circle cx="130" cy="70" r="28" fill="#4B2C20"></circle>
      <path d="M100 165C130 165 150 140 150 105C150 75 130 55 100 55C70 55 50 75 50 105C50 140 70 165 100 165Z" fill="#FFDFC4"></path>
      <circle cx="100" cy="58" r="15" fill="#4B2C20"></circle>
      <circle cx="80" cy="65" r="12" fill="#4B2C20"></circle>
      <circle cx="120" cy="65" r="12" fill="#4B2C20"></circle>
      <circle cx="75" cy="110" r="18" stroke="#0EA5E9" strokeWidth="4" fill="rgba(255,255,255,0.3)"></circle>
      <circle cx="125" cy="110" r="18" stroke="#0EA5E9" strokeWidth="4" fill="rgba(255,255,255,0.3)"></circle>
      <line x1="93" y1="110" x2="107" y2="110" stroke="#0EA5E9" strokeWidth="4"></line>
      <line x1="57" y1="110" x2="45" y2="105" stroke="#0EA5E9" strokeWidth="3"></line>
      <line x1="143" y1="110" x2="155" y2="105" stroke="#0EA5E9" strokeWidth="3"></line>
      <circle cx="75" cy="110" r="3" fill="#1E293B"></circle>
      <circle cx="125" cy="110" r="3" fill="#1E293B"></circle>
      <path d="M85 140C90 145 110 145 115 140" stroke="#9A3412" strokeWidth="3" strokeLinecap="round"></path>
    </svg>
  );

  // --- TELA DE LOGIN ---
  if (!isAuthenticated) {
    return (
      <div className="login-wrapper">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
          html, body, #root { width: 100vw; height: 100vh; background-color: #0EA5E9; margin: 0; overflow: hidden; }
          .login-wrapper { width: 100%; height: 100%; background-color: #0EA5E9; display: flex; flex-direction: column; align-items: center; justify-content: center; }
          .login-icon-box { margin-bottom: 1.5rem; background-color: transparent; border-radius: 9999px; display: inline-block; width: 120px; height: 120px; }
          .login-form { background-color: white; width: 90%; max-width: 400px; border-radius: 40px; padding: 2.5rem 2.5rem; display: flex; flex-direction: column; gap: 1rem; align-items: center; border: none; box-shadow: none; }
          .login-title { font-size: 1.5rem; font-weight: 800; color: #374151; margin-bottom: 0.5rem; text-align: center; width: 100%; }
          .login-input { width: 100%; padding: 1.1rem; background-color: #F3F4F6; border-radius: 1rem; outline: none; border: none; font-family: inherit; font-size: 1rem; color: #111827;}
          .login-input:focus { box-shadow: 0 0 0 2px #0EA5E9; }
          .login-btn { width: 100%; padding: 1.1rem; background-color: #0EA5E9; color: white; font-weight: 900; border-radius: 1rem; border: none; cursor: pointer; transition: 0.2s; font-size: 1.1rem; margin-top: 0.5rem; }
          .login-btn:hover { background-color: #0284C7; }
        `}</style>
        
        <div className="login-icon-box"><GuigoIcon /></div>
        
        <form className="login-form" onSubmit={handleLogin}>
          <h2 className="login-title">Entrar</h2>
          <input type="text" placeholder="Usuário (Guigo ou Favu)" className="login-input" required value={loginInputUser} onChange={(e) => setLoginInputUser(e.target.value)} />
          <input type="password" placeholder="Senha" className="login-input" required value={loginInputPass} onChange={(e) => setLoginInputPass(e.target.value)} />
          <button type="submit" className="login-btn">Entrar</button>
        </form>
      </div>
    );
  }

  // --- TELA PRINCIPAL DA APLICAÇÃO ---
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        :root {
          --bg-color: #F0F9FF; --surface: #FFFFFF; --text-main: #0F172A; --text-muted: #64748B;
          --border: #E0F2FE; --border-dark: #BAE6FD; --brand: #0EA5E9; --brand-light: #E0F2FE; --brand-hover: #0284C7;
          --green: #10B981; --green-bg: #ECFDF5; --red: #EF4444; --red-bg: #FEF2F2; --blue: #3B82F6; --blue-bg: #EFF6FF;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
        html, body, #root { width: 100vw; height: 100vh; margin: 0 !important; padding: 0 !important; max-width: none !important; background-color: var(--bg-color); color: var(--text-main); -webkit-font-smoothing: antialiased; overflow: hidden; text-align: left !important; }

        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }

        .app-container { width: 100vw; height: 100vh; display: flex; flex-direction: column; }
        
        .header { display: flex; justify-content: space-between; align-items: center; background: var(--surface); padding: 1.25rem 2rem; border-bottom: 1px solid var(--border); box-shadow: 0 4px 20px rgba(14, 165, 233, 0.05); z-index: 50; }
        
        .logo { font-size: 1.5rem; font-weight: 800; color: var(--brand); letter-spacing: -0.05em; display: flex; align-items: center; gap: 10px; }
        .logo-svg-wrapper { width: 36px; height: 36px; }
        .user-badge { font-size: 0.75rem; background: var(--brand-light); color: var(--brand); padding: 0.2rem 0.6rem; border-radius: 20px; font-weight: 700; margin-left: 8px;}
        .btn-sair { background: none; border: none; color: var(--red); font-weight: 700; cursor: pointer; font-size: 0.8rem; margin-left: 10px; text-transform: uppercase; }
        .btn-sair:hover { text-decoration: underline; }
        
        .tabs { display: flex; gap: 0.5rem; background: #E0F2FE; padding: 0.4rem; border-radius: 12px; }
        .tab-btn { padding: 0.5rem 1rem; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; transition: all 0.2s; background: transparent; color: #0369A1; font-size: 0.76rem; }
        .tab-btn.active { background: var(--surface); color: var(--brand); box-shadow: 0 2px 4px rgba(14, 165, 233, 0.15); }
        .tab-btn:not(.active):hover { color: var(--brand-hover); }
        
        .content-area { padding: 1.5rem 2rem 2rem 2rem; flex: 1; overflow: hidden; display: flex; flex-direction: column; position: relative;}

        .controls-card { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; margin-bottom: 1.5rem; background: var(--surface); padding: 1rem 1.5rem; border-radius: 12px; border: 1px solid var(--border); box-shadow: 0 4px 15px rgba(14, 165, 233, 0.03); flex-shrink: 0; }
        
        .form-input, .form-select { background: var(--bg-color); border: 1px solid var(--border-dark); padding: 0.65rem 1rem; border-radius: 8px; font-size: 0.85rem; outline: none; transition: all 0.2s; color: var(--text-main); font-weight: 600; }
        .form-input:focus, .form-select:focus { border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-light); }
        .btn-primary { background: var(--brand); color: white; border: none; padding: 0.65rem 1.25rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 0.85rem; }
        .btn-primary:hover { background: var(--brand-hover); transform: translateY(-1px); box-shadow: 0 4px 10px rgba(14, 165, 233, 0.3); }
        .btn-secondary { background: #E2E8F0; color: #475569; border: none; padding: 0.65rem 1.25rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 0.85rem; }
        .btn-secondary:hover { background: #CBD5E1; }

        .table-container { width: 100%; flex: 1; overflow: auto; background: var(--bg-color); border-radius: 12px; border: 1px solid var(--border); box-shadow: 0 10px 30px rgba(14, 165, 233, 0.05); }
        table { width: 100%; border-collapse: separate; border-spacing: 0; min-width: 1200px; }
        
        th, td { border-bottom: 1px solid var(--border); border-right: 1px solid var(--border); background: var(--surface); }
        th:last-child, td:last-child { border-right: none; } 

        thead th { position: sticky; top: 0; z-index: 20; background: var(--surface); padding: 1rem 0.5rem; font-size: 0.65rem; font-weight: 800; color: var(--brand); text-transform: uppercase; text-align: center; letter-spacing: 0.05em; border-bottom: 2px solid var(--border-dark); box-shadow: 0 4px 10px rgba(14, 165, 233, 0.05); }
        .sticky-col { position: sticky; left: 0; z-index: 10; background-color: var(--surface); border-right: 2px solid var(--border-dark); }
        thead th.sticky-col { z-index: 30; text-align: left; padding-left: 1.5rem; background-color: var(--surface); }
        
        .table-row { transition: background-color 0.15s; }
        .table-row:hover td { background: #F8FAFC; }
        .table-row:hover .sticky-col { background: #F8FAFC; }

        .spacer-row td { height: 1.2rem; background-color: var(--bg-color) !important; border: none !important; }
        .spacer-row td.sticky-col { border-right: none !important; }

        .category-cell { display: flex; align-items: center; padding: 0.25rem 1.5rem 0.25rem 0.5rem; }
        .category-indicator { width: 8px; height: 8px; border-radius: 50%; margin-right: 0.75rem; flex-shrink: 0; }
        
        .item-name-input { flex: 1; font-size: 0.8rem; font-weight: 600; color: var(--text-main); background: transparent; border: 1px solid transparent; border-radius: 6px; padding: 0.35rem 0.5rem; outline: none; transition: 0.2s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .item-name-input:hover { border-color: var(--border); }
        .item-name-input:focus { border-color: var(--brand); background: var(--surface); box-shadow: 0 0 0 2px var(--brand-light); }
        
        .delete-btn { opacity: 0; background: transparent; border: none; color: #94A3B8; cursor: pointer; padding: 0.25rem; margin-left: 0.5rem; font-size: 0.85rem; transition: all 0.2s; }
        .table-row:hover .delete-btn { opacity: 1; }
        .delete-btn:hover { color: var(--red) !important; transform: scale(1.1); }

        .input-cell { padding: 0; position: relative; }
        
        .input-wrapper { width: 100%; height: 100%; position: relative; }
        
        .check-btn {
          position: absolute; left: 8px; top: 50%; transform: translateY(-50%);
          width: 14px; height: 14px; border: 1.5px solid #CBD5E1; border-radius: 4px;
          background: transparent; cursor: pointer; transition: 0.2s;
          display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: transparent; z-index: 5;
        }
        .check-btn:hover { border-color: var(--brand); }
        .check-btn.checked { background: var(--green); border-color: var(--green); color: white; }

        .data-input { 
          width: 100%; height: 100%; border: 1px solid transparent; background: transparent; text-align: right; 
          padding: 0.85rem 0.5rem 0.85rem 28px; 
          font-size: 0.8rem; font-weight: 500; color: var(--text-main); outline: none; font-variant-numeric: tabular-nums; transition: all 0.2s; 
        }
        .data-input:hover { background: rgba(14, 165, 233, 0.05); }
        .data-input:focus { background: var(--surface); border: 2px solid var(--brand); box-shadow: inset 0 0 0 1px var(--brand-light); }
        .data-input::placeholder { color: #CBD5E1; }
        
        .is-checked .data-input { color: var(--green); font-weight: 600; opacity: 0.9; }

        .note-indicator { position: absolute; top: 0; right: 0; width: 0; height: 0; border-style: solid; border-width: 0 10px 10px 0; border-color: transparent #F59E0B transparent transparent; pointer-events: none;}
        .has-note .data-input { background-color: rgba(245, 158, 11, 0.03); }

        .custom-tooltip {
          display: none; position: absolute; top: 100%; right: 0; margin-top: 4px;
          background-color: #FFFFFF; color: #0F172A; font-size: 0.8rem; font-weight: 500;
          padding: 0.75rem; border-radius: 6px; border: 1px solid #E2E8F0;
          box-shadow: 0 10px 25px rgba(0,0,0,0.15); z-index: 999;
          width: max-content; min-width: 150px; max-width: 250px; max-height: 120px; overflow-y: auto;
          text-align: left; white-space: pre-wrap; word-wrap: break-word; line-height: 1.4;
        }
        .input-wrapper:hover .custom-tooltip { display: block; }

        .modal-overlay {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(15, 23, 42, 0.6); display: flex; justify-content: center; align-items: center;
          z-index: 1000; backdrop-filter: blur(2px);
        }
        .note-modal {
          background: var(--surface); padding: 1.5rem; border-radius: 16px; width: 90%; max-width: 420px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2); display: flex; flex-direction: column; gap: 1rem;
        }
        .note-modal h3 { font-size: 1.1rem; color: var(--text-main); margin-bottom: 0.5rem;}
        .note-textarea {
          width: 100%; min-height: 120px; padding: 1rem; border: 1px solid var(--border-dark);
          border-radius: 8px; font-family: inherit; font-size: 0.9rem; color: var(--text-main);
          outline: none; resize: vertical; line-height: 1.5; background: var(--bg-color);
        }
        .note-textarea:focus { border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-light); background: var(--surface);}
        .modal-actions { display: flex; justify-content: flex-end; gap: 0.8rem; margin-top: 0.5rem; }

        .section-rendas td { background: var(--green-bg) !important; color: var(--green) !important; border-top: 1px solid #D1FAE5; }
        .section-gastos td { background: var(--red-bg) !important; color: var(--red) !important; border-top: 1px solid #FEE2E2; }
        .section-invest td { background: var(--blue-bg) !important; color: var(--blue) !important; border-top: 1px solid #BFDBFE; }

        .section-title td.sticky-col { padding: 1.2rem 0 1.2rem 1.5rem; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; text-align: left; letter-spacing: 0.05em; z-index: 10; }
        
        .totals-row td { position: sticky; bottom: 0; z-index: 40; padding: 1.25rem 0.5rem; font-weight: 800; font-size: 0.85rem; text-align: right; white-space: nowrap; border-top: 2px solid var(--border-dark); background-color: var(--surface); box-shadow: 0 -4px 10px rgba(14, 165, 233, 0.05); }
        .totals-row td.sticky-col { text-align: left; padding-left: 1.5rem; z-index: 50; }

        /* DASHBOARD E COMPARTILHADOS */
        .dash-container { overflow-y: auto; height: 100%; display: flex; flex-direction: column; }
        .dash-header-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        
        .dash-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
        .card { background: var(--surface); border-radius: 12px; padding: 1rem 1.2rem; border: 1px solid var(--border); box-shadow: 0 4px 15px rgba(14, 165, 233, 0.03); display: flex; flex-direction: column; gap: 0.2rem; }
        .card-top { display: flex; justify-content: space-between; align-items: center; }
        .card-label { font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        .card-icon { width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; }
        .card-value { font-size: 1.25rem; font-weight: 800; color: var(--text-main); letter-spacing: -0.02em; }

        .chart-card { background: var(--surface); border-radius: 12px; padding: 1.5rem; border: 1px solid var(--border); flex: 1; min-height: 300px; box-shadow: 0 4px 15px rgba(14, 165, 233, 0.03); }
        
        /* ESTILOS ESPECÍFICOS COMPARTILHADOS */
        .shared-form-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 1rem; width: 100%; margin-bottom: 1rem;}
        .shared-form-row { display: flex; gap: 1rem; width: 100%; align-items: center; }
        
        .shared-table { width: 100%; border-collapse: separate; border-spacing: 0; min-width: 900px;}
        .shared-table th, .shared-table td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid var(--border); background: var(--surface); }
        .shared-table th { color: var(--brand); font-weight: 800; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.05em; position: sticky; top: 0; border-bottom: 2px solid var(--border-dark); z-index: 20; box-shadow: 0 4px 10px rgba(14, 165, 233, 0.05); }
        .shared-table tr:hover td { background-color: #F8FAFC; }
        .shared-table tr.settled td { opacity: 0.5; text-decoration: line-through; }
        .shared-table tr.settled td.action-cell { opacity: 1; text-decoration: none; }
        
        .badge { padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.7rem; font-weight: 700; display: inline-block; }
        .badge-guigo { background: #E0E7FF; color: #4F46E5; }
        .badge-favu { background: #FCE7F3; color: #DB2777; }
        .badge-split { background: #FEF3C7; color: #D97706; }

        .action-btn { background: transparent; border: none; cursor: pointer; padding: 0.35rem 0.5rem; border-radius: 6px; font-weight: 700; font-size: 0.7rem; transition: 0.2s; margin-right: 0.4rem;}
        .action-btn:hover { background: rgba(0,0,0,0.05); transform: translateY(-1px); }
        .edit-btn { color: var(--brand); background: var(--brand-light); }
        .del-btn { color: var(--red); font-size: 1rem; padding: 0.2rem 0.4rem; }
        .del-btn:hover { background: var(--red-bg); }

        .debt-card { transition: all 0.2s; }
        .debt-card.clickable { cursor: pointer; }
        .debt-card.clickable:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4); }
      `}</style>

      {/* MODAL DE NOTAS */}
      {noteModal.isOpen && (
        <div className="modal-overlay" onClick={() => setNoteModal({ isOpen: false, mes: '', item: '', text: '' })}>
          <div className="note-modal" onClick={e => e.stopPropagation()}>
            <h3>Nota para {noteModal.item} ({noteModal.mes})</h3>
            <textarea 
              className="note-textarea"
              placeholder="Digite os detalhes deste gasto aqui..."
              value={noteModal.text}
              onChange={e => setNoteModal({...noteModal, text: e.target.value})}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setNoteModal({ isOpen: false, mes: '', item: '', text: '' })}>Cancelar</button>
              <button className="btn-primary" onClick={salvarNota}>Salvar Nota</button>
            </div>
          </div>
        </div>
      )}

      <div className="app-container">
        <header className="header">
          <div className="logo">
            <div className="logo-svg-wrapper">
              <GuigoIcon />
            </div>
            Financeiro
            <span className="user-badge">{loggedUser}</span>
            <button className="btn-sair" onClick={handleLogout}>Sair</button>
          </div>
          <div className="tabs">
            <button className={`tab-btn ${abaAtual === 'lancamentos' ? 'active' : ''}`} onClick={() => setAbaAtual('lancamentos')}>Planilha</button>
            <button className={`tab-btn ${abaAtual === 'compartilhados' ? 'active' : ''}`} onClick={() => setAbaAtual('compartilhados')}>Compartilhados</button>
            <button className={`tab-btn ${abaAtual === 'dashboard' ? 'active' : ''}`} onClick={() => setAbaAtual('dashboard')}>Visão Geral</button>
          </div>
        </header>

        <div className="content-area">
          {/* ========================================================= */}
          {/* TELA: LANÇAMENTOS (PLANILHA LIVRE)                        */}
          {/* ========================================================= */}
          {abaAtual === 'lancamentos' && (
            <>
              <div className="controls-card">
                <select 
                  className="form-select" 
                  style={{ marginRight: '1rem', fontWeight: 800, color: 'var(--brand)' }}
                  value={anoSelecionado} 
                  onChange={(e) => setAnoSelecionado(Number(e.target.value))}
                >
                  {listaAnos.map(ano => <option key={ano} value={ano}>Ano: {ano}</option>)}
                </select>

                <input type="text" className="form-input" placeholder="Nome do item" value={novoItemNome} onChange={(e) => setNovoItemNome(e.target.value)} />
                <select className="form-select" value={novoItemTipo} onChange={(e) => setNovoItemTipo(e.target.value)}>
                  <option value="Rendas">Rendas</option>
                  <option value="Gastos">Despesas</option>
                  <option value="Investimentos">Investimentos</option>
                </select>
                <button className="btn-primary" onClick={adicionarItem}>+ Adicionar Linha</button>
              </div>

              <div className="table-container hide-scroll">
                <table>
                  <colgroup>
                    <col style={{ width: '16%', minWidth: '220px' }} />
                    {meses.map(mes => <col key={`col-${mes}`} style={{ width: '7%', minWidth: '100px' }} />)}
                  </colgroup>
                  
                  <thead>
                    <tr>
                      <th className="sticky-col">Categorias</th>
                      {meses.map(mes => <th key={mes}>{mes}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="section-title section-rendas">
                      <td className="sticky-col"><span style={{ marginRight: '8px', fontSize: '1rem' }}>↗</span> Rendas</td>
                      <td colSpan={12} className="filler-cell"></td>
                    </tr>
                    {renderizarLinhasTabela('Rendas', categorias.Rendas, 'var(--green)')}
                    <tr className="spacer-row"><td className="sticky-col"></td><td colSpan={12}></td></tr>

                    <tr className="section-title section-gastos">
                      <td className="sticky-col"><span style={{ marginRight: '8px', fontSize: '1rem' }}>↘</span> Despesas</td>
                      <td colSpan={12} className="filler-cell"></td>
                    </tr>
                    {renderizarLinhasTabela('Gastos', categorias.Gastos, 'var(--red)')}
                    <tr className="spacer-row"><td className="sticky-col"></td><td colSpan={12}></td></tr>

                    <tr className="section-title section-invest">
                      <td className="sticky-col"><span style={{ marginRight: '8px', fontSize: '1rem' }}>❖</span> Investimentos</td>
                      <td colSpan={12} className="filler-cell"></td>
                    </tr>
                    {renderizarLinhasTabela('Investimentos', categorias.Investimentos, 'var(--blue)')}
                    <tr className="spacer-row"><td className="sticky-col"></td><td colSpan={12}></td></tr>

                    <tr className="totals-row">
                      <td className="sticky-col" style={{ color: 'var(--text-main)' }}>Saldo Mensal</td>
                      {meses.map(mes => {
                        const saldo = calcularTotal(mes, categorias.Rendas) - calcularTotal(mes, categorias.Gastos) - calcularTotal(mes, categorias.Investimentos);
                        return (
                          <td key={`saldo-${mes}`} style={{ color: saldo < 0 ? 'var(--red)' : (saldo > 0 ? 'var(--green)' : 'var(--text-muted)') }}>
                            {formatarMoeda(saldo)}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ========================================================= */}
          {/* TELA: COMPARTILHADOS (SPLITWISE)                          */}
          {/* ========================================================= */}
          {abaAtual === 'compartilhados' && (
            <div className="dash-container hide-scroll">
              <div className="dash-header-bar">
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand)' }}>Divisão de Despesas</h2>
              </div>

              <div className="dash-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <div className="card">
                  <div className="card-top">
                    <span className="card-label">Você Pagou</span>
                  </div>
                  <span className="card-value">{formatarMoeda(splitwiseData.myPaidTotal)}</span>
                </div>
                
                <div 
                  className={`card debt-card ${splitwiseData.myBalance < 0 ? 'clickable' : ''}`} 
                  style={{ 
                    background: splitwiseData.myBalance > 0 ? 'var(--green)' : (splitwiseData.myBalance < 0 ? 'var(--red)' : 'var(--surface)'),
                    color: splitwiseData.myBalance !== 0 ? 'white' : 'var(--text-main)'
                  }}
                  onClick={handleSettleDebt}
                  title={splitwiseData.myBalance < 0 ? "Clique para liquidar dívida" : ""}
                >
                  <div className="card-top">
                    <span className="card-label" style={{ color: splitwiseData.myBalance !== 0 ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}>
                      {splitwiseData.myBalance > 0 ? `${splitwiseData.partnerName} te deve` : 
                      (splitwiseData.myBalance < 0 ? `Você deve a ${splitwiseData.partnerName} (Clique para pagar)` : 'Tudo Quite')}
                    </span>
                  </div>
                  <span className="card-value" style={{ color: splitwiseData.myBalance !== 0 ? 'white' : 'var(--text-main)' }}>
                    {formatarMoeda(Math.abs(splitwiseData.myBalance))}
                  </span>
                </div>
              </div>

              <div className="controls-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.8rem' }}>
                <div style={{ display: 'flex', gap: '1rem', width: '100%', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Nome do Item" 
                    value={sharedTitle} 
                    onChange={(e) => setSharedTitle(e.target.value)} 
                    style={{ flex: 2, minWidth: '200px' }}
                  />
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="R$ 0,00" 
                    style={{ width: '120px' }}
                    value={sharedAmount} 
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.,]/g, '');
                      setSharedAmount(val);
                    }} 
                  />
                  <select className="form-select" value={sharedPaidBy} onChange={(e) => setSharedPaidBy(e.target.value)}>
                    <option value="Guigo">Guigo pagou</option>
                    <option value="Favu">Favu pagou</option>
                  </select>
                  <select className="form-select" value={sharedSplitMode} onChange={(e) => setSharedSplitMode(e.target.value)}>
                    <option value="50_50">Dividir 50% / 50%</option>
                    <option value="100_guigo">100% para Guigo</option>
                    <option value="100_favu">100% para Favu</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '1rem', width: '100%', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Descrição do item" 
                    value={sharedDesc} 
                    onChange={(e) => setSharedDesc(e.target.value)} 
                    style={{ flex: 1, minWidth: '200px' }}
                  />
                  <button className="btn-primary" onClick={handleSaveSharedExpense}>
                    {editingSharedId ? 'Salvar Alterações' : 'Adicionar'}
                  </button>
                  {editingSharedId && (
                    <button className="btn-secondary" onClick={handleCancelEdit}>Cancelar</button>
                  )}
                </div>
              </div>

              <div className="table-container hide-scroll">
                <table className="shared-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Item</th>
                      <th>Descrição</th>
                      <th>Quem Pagou?</th>
                      <th>Divisão</th>
                      <th>Valor (R$)</th>
                      <th style={{textAlign: 'center'}}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sharedExpenses.length === 0 ? (
                      <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Nenhuma despesa compartilhada ainda.</td></tr>
                    ) : (
                      sharedExpenses.map(exp => (
                        <tr key={exp.id}>
                          <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{exp.date}</td>
                          <td style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>{exp.title || exp.desc}</td>
                          <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{exp.title ? exp.desc : ''}</td>
                          <td>
                            <span className={`badge ${exp.paidBy === 'Guigo' ? 'badge-guigo' : 'badge-favu'}`}>
                              {exp.paidBy}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-split">
                              {exp.splitMode === '50_50' ? '50%' : '100%'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--brand)' }}>{formatarMoeda(exp.amount)}</td>
                          <td className="action-cell" style={{textAlign: 'center', whiteSpace: 'nowrap'}}>
                            <button className="action-btn edit-btn" onClick={() => handleEditShared(exp)} title="Editar">✎ Editar</button>
                            <button className="action-btn del-btn" onClick={() => handleDeleteSharedExpense(exp.id)} title="Excluir">🗑️</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TELA: VISÃO GERAL (DASHBOARD)                             */}
          {/* ========================================================= */}
          {abaAtual === 'dashboard' && (
            <div className="dash-container hide-scroll">
              <div className="dash-header-bar">
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand)' }}></h2>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <select 
                    className="form-select" 
                    value={anoSelecionado} 
                    onChange={(e) => setAnoSelecionado(Number(e.target.value))}
                    style={{ backgroundColor: 'var(--surface)', fontWeight: 800, color: 'var(--brand)' }}
                  >
                    {listaAnos.map(ano => <option key={ano} value={ano}>Ano: {ano}</option>)}
                  </select>
                </div>
              </div>

              <div className="dash-grid">
                <div className="card">
                  <div className="card-top">
                    <span className="card-label">Rendas</span>
                    <div className="card-icon" style={{ background: '#ECFDF5', color: 'var(--green)' }}>↗</div>
                  </div>
                  <span className="card-value">{formatarMoeda(totalReceitas)}</span>
                </div>

                <div className="card">
                  <div className="card-top">
                    <span className="card-label">Despesas</span>
                    <div className="card-icon" style={{ background: '#FEF2F2', color: 'var(--red)' }}>↘</div>
                  </div>
                  <span className="card-value">{formatarMoeda(totalDespesas)}</span>
                </div>

                <div className="card">
                  <div className="card-top">
                    <span className="card-label">Investimentos</span>
                    <div className="card-icon" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>❖</div>
                  </div>
                  <span className="card-value">{formatarMoeda(totalInvestimentos)}</span>
                </div>

                <div className="card" style={{ background: saldoGeral >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  <div className="card-top">
                    <span className="card-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Saldo do Período</span>
                    <div className="card-icon" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>💳</div>
                  </div>
                  <span className="card-value" style={{ color: 'white' }}>{formatarMoeda(saldoGeral)}</span>
                </div>
              </div>

              <div className="chart-card">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dadosGraficoCompleto} margin={{ top: 5, right: 20, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontWeight: 600, fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontWeight: 600, fontSize: 12 }} tickFormatter={(val) => `R$ ${val}`} dx={-10} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(14, 165, 233, 0.1)', fontWeight: 600 }}
                      formatter={(value) => [formatarMoeda(value), '']}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px', fontWeight: 600 }} iconType="circle" />
                    
                    <Line type="monotone" name="Rendas" dataKey="Receita" stroke="var(--green)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} isAnimationActive={false} />
                    <Line type="monotone" name="Despesas" dataKey="Despesa" stroke="var(--red)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} isAnimationActive={false} />
                    <Line type="monotone" name="Investimentos" dataKey="Investimento" stroke="var(--blue)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}