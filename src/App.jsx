import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function App() {
  const [abaAtual, setAbaAtual] = useState('lancamentos');
  const [filtroPeriodo, setFiltroPeriodo] = useState('mes_atual');
  
  const [categorias, setCategorias] = useState({
    Rendas: ['Salário', 'Freelance', 'Rendimentos'],
    Gastos: ['Aluguel', 'Energia', 'Condomínio', 'Internet', 'Cartão de Crédito'],
    Investimentos: ['Caixinha NuBank', 'Tesouro Direto']
  });
  
  const [novoItemNome, setNovoItemNome] = useState('');
  const [novoItemTipo, setNovoItemTipo] = useState('Gastos');
  
  const [valores, setValores] = useState(() => {
    const iniciais = {};
    meses.forEach(mes => iniciais[mes] = {});
    return iniciais;
  });

  const atualizarValor = (mes, item, novoValor) => {
    const valorLimpo = novoValor.replace(/[^0-9.,]/g, '');
    setValores({ ...valores, [mes]: { ...valores[mes], [item]: valorLimpo } });
  };

  const formatarCampoAoSair = (mes, item, valor) => {
    if (!valor) return;
    const numeroMatematico = parseFloat(valor.toString().replace(/\./g, '').replace(',', '.'));
    
    if (!isNaN(numeroMatematico)) {
      const valorFormatado = numeroMatematico.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      setValores({ ...valores, [mes]: { ...valores[mes], [item]: valorFormatado } });
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
    setCategorias({ 
      ...categorias, 
      [novoItemTipo]: [...categorias[novoItemTipo], nomeLimpo] 
    });
    setNovoItemNome('');
  };

  const removerItem = (tipo, itemParaRemover) => {
    setCategorias({ ...categorias, [tipo]: categorias[tipo].filter(item => item !== itemParaRemover) });
  };

  const calcularTotal = (mes, listaItens) => {
    return listaItens.reduce((total, item) => {
      const valorString = valores[mes]?.[item] || '0';
      const valorDecimal = parseFloat(valorString.toString().replace(/\./g, '').replace(',', '.'));
      return total + (isNaN(valorDecimal) ? 0 : valorDecimal);
    }, 0);
  };

  const formatarMoeda = (valor) => {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const dadosGraficoCompleto = meses.map(mes => ({
    mes: mes,
    Receita: calcularTotal(mes, categorias.Rendas),
    Despesa: calcularTotal(mes, categorias.Gastos),
    Investimento: calcularTotal(mes, categorias.Investimentos),
  }));

  const dadosFiltrados = useMemo(() => {
    const mesAtualIndex = new Date().getMonth(); 

    switch (filtroPeriodo) {
      case 'mes_atual':
        return dadosGraficoCompleto.slice(mesAtualIndex, mesAtualIndex + 1);
      case 'ultimos_3':
        return dadosGraficoCompleto.slice(Math.max(0, mesAtualIndex - 2), mesAtualIndex + 1);
      case 'ultimos_6':
        return dadosGraficoCompleto.slice(Math.max(0, mesAtualIndex - 5), mesAtualIndex + 1);
      case 'ano_todo':
      default:
        return dadosGraficoCompleto;
    }
  }, [valores, categorias, filtroPeriodo]); // eslint-disable-line

  const totalReceitas = dadosFiltrados.reduce((acc, item) => acc + item.Receita, 0);
  const totalDespesas = dadosFiltrados.reduce((acc, item) => acc + item.Despesa, 0);
  const totalInvestimentos = dadosFiltrados.reduce((acc, item) => acc + item.Investimento, 0);
  
  // MATEMÁTICA CORRIGIDA: Investimento agora abate do Saldo
  const saldoGeral = totalReceitas - totalDespesas - totalInvestimentos;

  const renderizarLinhasTabela = (tipo, listaItens, cor) => {
    return listaItens.map(item => (
      <tr key={item} className="table-row">
        <td className="sticky-col">
          <div className="category-cell">
            <div className="category-indicator" style={{ backgroundColor: cor }}></div>
            <span className="item-name" title={item}>{item}</span>
            <button onClick={() => removerItem(tipo, item)} className="delete-btn" title="Excluir item">✕</button>
          </div>
        </td>
        
        {meses.map(mes => (
          <td key={`${item}-${mes}`} className="input-cell">
            <input 
              type="text" 
              value={valores[mes]?.[item] || ''} 
              onChange={(e) => atualizarValor(mes, item, e.target.value)}
              onBlur={(e) => formatarCampoAoSair(mes, item, e.target.value)} 
              placeholder="0,00" 
              className="data-input"
            />
          </td>
        ))}
      </tr>
    ));
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        :root {
          --bg-color: #F0F9FF;
          --surface: #FFFFFF;
          --text-main: #0F172A;
          --text-muted: #64748B;
          --border: #E0F2FE;
          --border-dark: #BAE6FD;
          --brand: #0EA5E9; 
          --brand-light: #E0F2FE;
          --brand-hover: #0284C7;
          
          --green: #10B981;
          --green-bg: #ECFDF5;
          --red: #EF4444;
          --red-bg: #FEF2F2;
          --purple: #8B5CF6; 
          --purple-bg: #F3E8FF;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
        html, body, #root { 
          width: 100%; height: 100%; margin: 0 !important; padding: 0 !important; max-width: none !important; 
          background-color: var(--bg-color); color: var(--text-main); -webkit-font-smoothing: antialiased; 
          overflow: hidden; text-align: left !important;
        }

        /* MÁGICA: Ocultar barras de rolagem nativas sem perder a funcionalidade */
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }

        .app-container { width: 100vw; height: 100vh; display: flex; flex-direction: column; }
        
        .header { 
          display: flex; justify-content: space-between; align-items: center; background: var(--surface);
          padding: 1.25rem 2rem; border-bottom: 1px solid var(--border); box-shadow: 0 4px 20px rgba(14, 165, 233, 0.05); z-index: 50;
        }
        
        .logo { font-size: 1.5rem; font-weight: 800; color: var(--brand); letter-spacing: -0.05em; }
        
        .tabs { display: flex; gap: 0.5rem; background: #E0F2FE; padding: 0.4rem; border-radius: 12px; }
        .tab-btn { padding: 0.5rem 1.5rem; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; transition: all 0.2s; background: transparent; color: #0369A1; font-size: 0.9rem; }
        .tab-btn.active { background: var(--surface); color: var(--brand); box-shadow: 0 2px 4px rgba(14, 165, 233, 0.15); }
        .tab-btn:not(.active):hover { color: var(--brand-hover); }
        
        /* O Container principal agora cuida das margens perfeitamente */
        .content-area { 
          padding: 1.5rem 2rem 2rem 2rem; 
          flex: 1; overflow: hidden; display: flex; flex-direction: column; 
        }

        .controls-card { 
          display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; margin-bottom: 1.5rem; 
          background: var(--surface); padding: 1rem 1.5rem; border-radius: 12px; border: 1px solid var(--border);
          box-shadow: 0 4px 15px rgba(14, 165, 233, 0.03); flex-shrink: 0;
        }
        
        .form-input, .form-select { 
          background: var(--bg-color); border: 1px solid var(--border-dark); padding: 0.65rem 1rem; 
          border-radius: 8px; font-size: 0.85rem; outline: none; transition: all 0.2s; color: var(--text-main); font-weight: 600;
        }
        .form-input:focus, .form-select:focus { border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-light); }
        .btn-primary { 
          background: var(--brand); color: white; border: none; padding: 0.65rem 1.25rem; 
          border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 0.85rem;
        }
        .btn-primary:hover { background: var(--brand-hover); transform: translateY(-1px); box-shadow: 0 4px 10px rgba(14, 165, 233, 0.3); }

        .table-container { 
          width: 100%; flex: 1; overflow: auto; background: var(--bg-color); 
          border-radius: 12px; border: 1px solid var(--border);
          box-shadow: 0 10px 30px rgba(14, 165, 233, 0.05);
        }

        table { width: 100%; border-collapse: separate; border-spacing: 0; min-width: 1200px; }
        
        th, td { border-bottom: 1px solid var(--border); border-right: 1px solid var(--border); background: var(--surface); }
        th:last-child, td:last-child { border-right: none; } 

        thead th { 
          position: sticky; top: 0; z-index: 20; background: var(--surface); 
          padding: 1rem 0.5rem; font-size: 0.65rem; font-weight: 800; color: var(--brand); 
          text-transform: uppercase; text-align: center; letter-spacing: 0.05em;
          border-bottom: 2px solid var(--border-dark); box-shadow: 0 4px 10px rgba(14, 165, 233, 0.05);
        }

        .sticky-col { position: sticky; left: 0; z-index: 10; background-color: var(--surface); border-right: 2px solid var(--border-dark); }
        thead th.sticky-col { z-index: 30; text-align: left; padding-left: 1.5rem; background-color: var(--surface); }
        
        .table-row { transition: background-color 0.15s; }
        .table-row:hover td { background: #F8FAFC; }
        .table-row:hover .sticky-col { background: #F8FAFC; }

        .spacer-row td { height: 1.2rem; background-color: var(--bg-color) !important; border: none !important; }
        .spacer-row td.sticky-col { border-right: none !important; }

        .category-cell { display: flex; align-items: center; padding: 0.5rem 1.5rem 0.5rem 0; }
        .category-indicator { width: 8px; height: 8px; border-radius: 50%; margin-right: 0.75rem; margin-left: 1.5rem; flex-shrink: 0; }
        .item-name { flex: 1; text-align: left; font-size: 0.8rem; font-weight: 600; color: var(--text-main); white-space: normal; }
        
        .delete-btn { opacity: 0; background: transparent; border: none; color: #94A3B8; cursor: pointer; padding: 0.25rem; margin-left: 0.5rem; font-size: 0.85rem; transition: all 0.2s; }
        .table-row:hover .delete-btn { opacity: 1; }
        .delete-btn:hover { color: var(--red) !important; transform: scale(1.1); }

        .input-cell { padding: 0; }
        .data-input { 
          width: 100%; height: 100%; border: 1px solid transparent; background: transparent; 
          text-align: right; padding: 0.85rem 0.5rem; font-size: 0.8rem; font-weight: 500; 
          color: var(--text-main); outline: none; font-variant-numeric: tabular-nums; transition: all 0.2s;
        }
        .data-input:hover { background: rgba(14, 165, 233, 0.05); }
        .data-input:focus { background: var(--surface); border: 2px solid var(--brand); box-shadow: inset 0 0 0 1px var(--brand-light); }
        .data-input::placeholder { color: #CBD5E1; }

        /* TÍTULOS DE CATEGORIA ESTILIZADOS */
        .section-rendas td { background: var(--green-bg) !important; color: var(--green) !important; border-top: 1px solid #D1FAE5; }
        .section-gastos td { background: var(--red-bg) !important; color: var(--red) !important; border-top: 1px solid #FEE2E2; }
        .section-invest td { background: var(--purple-bg) !important; color: var(--purple) !important; border-top: 1px solid #E9D5FF; }

        .section-title td.sticky-col { 
          padding: 1.2rem 0 1.2rem 1.5rem; font-weight: 800; font-size: 0.75rem; 
          text-transform: uppercase; text-align: left; letter-spacing: 0.05em; z-index: 10;
        }
        
        .totals-row td { 
          padding: 1.25rem 0.5rem; font-weight: 800; font-size: 0.85rem; text-align: right; 
          white-space: nowrap; border-top: 2px solid var(--border-dark); background-color: var(--surface);
        }
        .totals-row td.sticky-col { text-align: left; padding-left: 1.5rem; z-index: 10; }

        .dash-container { overflow-y: auto; height: 100%; }
        .dash-header-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        
        .dash-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
        
        .card { 
          background: var(--surface); border-radius: 12px; padding: 1.5rem; border: 1px solid var(--border); 
          box-shadow: 0 4px 15px rgba(14, 165, 233, 0.03); display: flex; flex-direction: column; gap: 0.5rem;
        }
        .card-top { display: flex; justify-content: space-between; align-items: center; }
        .card-label { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        .card-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
        .card-value { font-size: 1.8rem; font-weight: 800; color: var(--text-main); letter-spacing: -0.02em; }

        .chart-card { background: var(--surface); border-radius: 12px; padding: 2rem; border: 1px solid var(--border); height: 400px; box-shadow: 0 4px 15px rgba(14, 165, 233, 0.03); }
      `}</style>

      <div className="app-container">
        <header className="header">
          <div className="logo">Financeiro</div>
          <div className="tabs">
            <button className={`tab-btn ${abaAtual === 'lancamentos' ? 'active' : ''}`} onClick={() => setAbaAtual('lancamentos')}>Planilha Livre</button>
            <button className={`tab-btn ${abaAtual === 'dashboard' ? 'active' : ''}`} onClick={() => setAbaAtual('dashboard')}>Visão Geral</button>
          </div>
        </header>

        <div className="content-area">
          {abaAtual === 'lancamentos' ? (
            <>
              <div className="controls-card">
                <input type="text" className="form-input" placeholder="Nome do item" value={novoItemNome} onChange={(e) => setNovoItemNome(e.target.value)} />
                <select className="form-select" value={novoItemTipo} onChange={(e) => setNovoItemTipo(e.target.value)}>
                  <option value="Rendas">Rendas</option>
                  <option value="Gastos">Despesas</option>
                  <option value="Investimentos">Investimentos</option>
                </select>
                <button className="btn-primary" onClick={adicionarItem}>+ Adicionar Linha</button>
              </div>

              {/* CLASSE hide-scroll ESCONDE A BARRA FEIA! */}
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
                      <td className="sticky-col">
                        <span style={{ marginRight: '8px', fontSize: '1rem' }}>↗</span> Rendas
                      </td>
                      <td colSpan={12} className="filler-cell"></td>
                    </tr>
                    {renderizarLinhasTabela('Rendas', categorias.Rendas, 'var(--green)')}

                    <tr className="spacer-row"><td className="sticky-col"></td><td colSpan={12}></td></tr>

                    <tr className="section-title section-gastos">
                      <td className="sticky-col">
                        <span style={{ marginRight: '8px', fontSize: '1rem' }}>↘</span> Despesas
                      </td>
                      <td colSpan={12} className="filler-cell"></td>
                    </tr>
                    {renderizarLinhasTabela('Gastos', categorias.Gastos, 'var(--red)')}

                    <tr className="spacer-row"><td className="sticky-col"></td><td colSpan={12}></td></tr>

                    <tr className="section-title section-invest">
                      <td className="sticky-col">
                        <span style={{ marginRight: '8px', fontSize: '1rem' }}>❖</span> Investimentos
                      </td>
                      <td colSpan={12} className="filler-cell"></td>
                    </tr>
                    {renderizarLinhasTabela('Investimentos', categorias.Investimentos, 'var(--purple)')}

                    <tr className="spacer-row"><td className="sticky-col"></td><td colSpan={12}></td></tr>

                    <tr className="totals-row">
                      <td className="sticky-col" style={{ color: 'var(--text-main)' }}>Saldo Mensal</td>
                      {meses.map(mes => {
                        // MATEMÁTICA CORRIGIDA: Investimento agora abate da conta final mensal!
                        const saldo = calcularTotal(mes, categorias.Rendas) - calcularTotal(mes, categorias.Gastos) - calcularTotal(mes, categorias.Investimentos);
                        return (
                          <td key={`saldo-${mes}`} style={{ color: saldo < 0 ? 'var(--red)' : (saldo > 0 ? 'var(--brand)' : 'var(--text-muted)') }}>
                            {formatarMoeda(saldo)}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="dash-container hide-scroll">
              <div className="dash-header-bar">
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand)' }}></h2>
                <select 
                  className="form-select" 
                  value={filtroPeriodo} 
                  onChange={(e) => setFiltroPeriodo(e.target.value)}
                  style={{ backgroundColor: 'var(--surface)' }}
                >
                  <option value="mes_atual">Filtrar: Mês Atual</option>
                  <option value="ultimos_3">Filtrar: Últimos 3 Meses</option>
                  <option value="ultimos_6">Filtrar: Últimos 6 Meses</option>
                  <option value="ano_todo">Filtrar: Ano Todo</option>
                </select>
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
                    <span className="card-label">despesas</span>
                    <div className="card-icon" style={{ background: '#F3E8FF', color: 'var(--purple)' }}>❖</div>
                  </div>
                  <span className="card-value">{formatarMoeda(totalInvestimentos)}</span>
                </div>

                <div className="card" style={{ background: 'var(--brand)' }}>
                  <div className="card-top">
                    <span className="card-label" style={{ color: 'var(--brand-light)' }}>Saldo do Período</span>
                    <div className="card-icon" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>💳</div>
                  </div>
                  <span className="card-value" style={{ color: 'white' }}>{formatarMoeda(saldoGeral)}</span>
                </div>
              </div>

              <div className="chart-card">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dadosFiltrados} margin={{ top: 5, right: 20, bottom: 0, left: 0 }}>
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
                    <Line type="monotone" name="Investimentos" dataKey="Investimento" stroke="var(--purple)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} isAnimationActive={false} />
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