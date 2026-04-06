import { useState } from 'react'
// Aqui estamos "importando" as ferramentas de gráfico que acabamos de instalar
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const dadosIniciais = {};
meses.forEach(mes => {
  dadosIniciais[mes] = { rendas: '', gastos: '', investimentos: '' };
});

function App() {
  const [abaAtual, setAbaAtual] = useState('lancamentos');
  const [valores, setValores] = useState(dadosIniciais);

  const atualizarValor = (mes, categoria, novoValor) => {
    setValores({
      ...valores,
      [mes]: {
        ...valores[mes],
        [categoria]: novoValor
      }
    });
  };

  // --- PREPARANDO DADOS PARA O DASHBOARD ---
  // O gráfico precisa dos dados em formato de lista. Vamos transformar nossa memória para ele entender:
  const dadosGrafico = meses.map(mes => ({
    mes: mes,
    Receitas: Number(valores[mes].rendas) || 0,
    Despesas: Number(valores[mes].gastos) || 0,
    Investimentos: Number(valores[mes].investimentos) || 0,
  }));

  // Calculando os totais do ano para os "Cards" de resumo
  const totalReceitas = dadosGrafico.reduce((acc, item) => acc + item.Receitas, 0);
  const totalDespesas = dadosGrafico.reduce((acc, item) => acc + item.Despesas, 0);
  const totalInvestimentos = dadosGrafico.reduce((acc, item) => acc + item.Investimentos, 0);
  const saldoGeral = totalReceitas - totalDespesas;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <h1>Meu App Financeiro 💰</h1>

      {/* Menu de Navegação */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => setAbaAtual('lancamentos')} 
          style={{ padding: '10px 20px', cursor: 'pointer', border: 'none', borderRadius: '8px', fontWeight: 'bold', backgroundColor: abaAtual === 'lancamentos' ? '#007bff' : '#e9ecef', color: abaAtual === 'lancamentos' ? '#fff' : '#000' }}
        >
          Planilha de Lançamentos
        </button>
        
        <button 
          onClick={() => setAbaAtual('dashboard')}
          style={{ padding: '10px 20px', cursor: 'pointer', border: 'none', borderRadius: '8px', fontWeight: 'bold', backgroundColor: abaAtual === 'dashboard' ? '#007bff' : '#e9ecef', color: abaAtual === 'dashboard' ? '#fff' : '#000' }}
        >
          Dashboard (Gráficos)
        </button>
      </div>
      
      {/* Tela de Lançamentos */}
      {abaAtual === 'lancamentos' ? (
        <div style={{ overflowX: 'auto', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h2>Planilha de Lançamentos 📝</h2>
          
          <table border="1" cellPadding="10" style={{ borderCollapse: 'collapse', width: '100%', textAlign: 'center' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2' }}>
                <th>Categoria</th>
                {meses.map(mes => <th key={mes}>{mes}</th>)}
              </tr>
            </thead>
            <tbody>
              
              <tr>
                <td style={{ backgroundColor: '#d4edda', fontWeight: 'bold' }}>Rendas</td>
                {meses.map(mes => (
                  <td key={`renda-${mes}`}>
                    <input type="number" value={valores[mes].rendas} onChange={(e) => atualizarValor(mes, 'rendas', e.target.value)} placeholder="0" style={{ width: '60px', padding: '5px' }} />
                  </td>
                ))}
              </tr>

              <tr>
                <td style={{ backgroundColor: '#f8d7da', fontWeight: 'bold' }}>Gastos</td>
                {meses.map(mes => (
                  <td key={`gasto-${mes}`}>
                    <input type="number" value={valores[mes].gastos} onChange={(e) => atualizarValor(mes, 'gastos', e.target.value)} placeholder="0" style={{ width: '60px', padding: '5px' }} />
                  </td>
                ))}
              </tr>

              <tr>
                <td style={{ backgroundColor: '#cce5ff', fontWeight: 'bold' }}>Investimentos</td>
                {meses.map(mes => (
                  <td key={`investimento-${mes}`}>
                    <input type="number" value={valores[mes].investimentos} onChange={(e) => atualizarValor(mes, 'investimentos', e.target.value)} placeholder="0" style={{ width: '60px', padding: '5px' }} />
                  </td>
                ))}
              </tr>

              <tr>
                <td style={{ backgroundColor: '#fff3cd', fontWeight: 'bold' }}>Saldo Final</td>
                {meses.map(mes => {
                  const renda = Number(valores[mes].rendas) || 0;
                  const gasto = Number(valores[mes].gastos) || 0;
                  const saldo = renda - gasto;
                  const corDoTexto = saldo < 0 ? 'red' : (saldo > 0 ? 'green' : 'black');

                  return (
                    <td key={`saldo-${mes}`} style={{ fontWeight: 'bold', color: corDoTexto }}>
                      R$ {saldo}
                    </td>
                  );
                })}
              </tr>

            </tbody>
          </table>
        </div>
      ) : (
        /* Tela do Dashboard */
        <div>
          <h2>Dashboard 📊</h2>
          
          {/* Cartões de Resumo (Cards) */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
            <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #28a745', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>RENDAS TOTAIS</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745', margin: '10px 0 0 0' }}>R$ {totalReceitas}</p>
            </div>
            
            <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #dc3545', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>DESPESAS TOTAIS</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545', margin: '10px 0 0 0' }}>R$ {totalDespesas}</p>
            </div>

            <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #007bff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>INVESTIMENTOS TOTAIS</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff', margin: '10px 0 0 0' }}>R$ {totalInvestimentos}</p>
            </div>

            <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #343a40', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>SALDO PREVISTO</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: saldoGeral < 0 ? '#dc3545' : '#28a745', margin: '10px 0 0 0' }}>R$ {saldoGeral}</p>
            </div>
          </div>

          {/* Gráfico de Linhas */}
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', height: '400px' }}>
            <h3 style={{ marginTop: 0 }}>Fluxo Anual</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dadosGrafico}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Receitas" stroke="#28a745" strokeWidth={3} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="Despesas" stroke="#dc3545" strokeWidth={3} />
                <Line type="monotone" dataKey="Investimentos" stroke="#007bff" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>

        </div>
      )}
    </div>
  )
}

export default App