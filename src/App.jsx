import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- CONFIGURAÇÃO SUPABASE ---
const SUPABASE_URL = 'https://ufeocwgdamkdswdgxcrn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZW9jd2dkYW1rZHN3ZGd4Y3JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDY0NDYsImV4cCI6MjA4NjIyMjQ0Nn0.2vihknorsdk7y-nyar3JfLW662XJnk-u2VZBwDOO5Lw';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const mesesNum = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const anoAtualRef = new Date().getFullYear();

// Paleta de 9 cores para as subclasses e categorias
const PALETA_CORES = ['#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6', '#D946EF'];

// Temas do App
const TEMAS_APP = [
  { id: 'azul-guigo', cor: '#0EA5E9', nome: 'Azul Guigo' },
  { id: 'azul-favu', cor: '#1E40AF', nome: 'Azul Favu' },
  { id: 'verde-vida', cor: '#059669', nome: 'Verde Vida' },
  { id: 'roxo-galaxy', cor: '#7C3AED', nome: 'Roxo Galaxy' },
  { id: 'rosa-pop', cor: '#F43F5E', nome: 'Rosa Pop' },
  { id: 'laranja-solar', cor: '#F97316', nome: 'Laranja Solar' },
  { id: 'amarelo-mel', cor: '#EAB308', nome: 'Amarelo Mel' },
  { id: 'ciano-aqua', cor: '#06B6D4', nome: 'Ciano Aqua' },
  { id: 'dark', cor: '#1F2937', nome: 'Modo Noturno' }
];

export default function App() {
  // --- ESTADOS DE TELA E RESPONSIVIDADE ---
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- ESTADOS DE AUTENTICAÇÃO E CARREGAMENTO ---
  const [loggedUser, setLoggedUser] = useState(() => localStorage.getItem('fin_user') || '');
  const [loggedName, setLoggedName] = useState(() => localStorage.getItem('fin_name') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('fin_auth') === 'true');
  
  const [loginInputUser, setLoginInputUser] = useState('');
  const [loginInputPass, setLoginInputPass] = useState('');
  
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [signupName, setSignupName] = useState('');
  const [signupUser, setSignupUser] = useState('');
  const [signupPass, setSignupPass] = useState('');
  
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isInitialMount = useRef(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const tableContainerRef = useRef(null); 

  // --- ESTADOS DE DADOS ---
  const [categorias, setCategorias] = useState({ Rendas: [], Gastos: [], Investimentos: [] });
  const [categoryConfigs, setCategoryConfigs] = useState({}); 
  const [valores, setValores] = useState({});
  const [notas, setNotas] = useState({});
  const [checks, setChecks] = useState({});
  const [itemColors, setItemColors] = useState({ Rendas: {}, Gastos: {}, Investimentos: {} });
  const [itemGroups, setItemGroups] = useState({ Rendas: {}, Gastos: {}, Investimentos: {} });
  
  // Compartilhados e Usuários Cadastrados
  const [sharedExpenses, setSharedExpenses] = useState([]);
  const [appUsers, setAppUsers] = useState([]); // Lista dinâmica de usuários do banco
  
  // TEMA E EDIÇÃO DE PERFIL
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [themeConfig, setThemeConfig] = useState('azul-guigo');
  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false);
  const [editProfileName, setEditProfileName] = useState('');
  const [editProfileUser, setEditProfileUser] = useState('');
  const [editProfilePass, setEditProfilePass] = useState('');

  // --- BUSCA DE DADOS DO SUPABASE ---
  const fetchUserData = async (username) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('user_data').select('*').eq('username', username).single();
      
      if (data) {
        setCategorias(data.categorias || { Rendas: [], Gastos: [], Investimentos: [] });
        setCategoryConfigs(data.custom_categories || {});
        setValores(data.valores || {});
        setNotas(data.notas || {});
        setChecks(data.checks || {});
        setItemColors(data.item_colors || { Rendas: {}, Gastos: {}, Investimentos: {} });
        setItemGroups(data.item_groups || { Rendas: {}, Gastos: {}, Investimentos: {} });
        setThemeConfig(data.theme || 'azul-guigo');
      } else {
        const defaultCat = { Rendas: [], Gastos: [], Investimentos: [] };
        setCategorias(defaultCat);
        setCategoryConfigs({});
        await supabase.from('user_data').insert([{ username: username, categorias: defaultCat }]);
      }
    } catch (e) {
      console.error('Erro ao buscar dados:', e);
    }
    setIsDataLoaded(true);
    setIsLoading(false);
  };

  const fetchSharedExpenses = async () => {
    const { data, error } = await supabase.from('shared_expenses').select('*').order('id', { ascending: false });
    if (data) setSharedExpenses(data);
  };

  const fetchAppUsers = async () => {
    try {
      const { data, error } = await supabase.from('app_users').select('username, name');
      if (data) setAppUsers(data);
    } catch (e) {
      console.error('Erro ao buscar usuários:', e);
    }
  };

  useEffect(() => {
    if (isAuthenticated && loggedUser) {
      fetchUserData(loggedUser);
      fetchSharedExpenses();
      fetchAppUsers(); // Busca todos os usuários pro Select de Compartilhados
    }
  }, [isAuthenticated, loggedUser]);

  // --- AUTO-SAVE PARA O SUPABASE ---
  useEffect(() => {
    if (!isAuthenticated || !loggedUser || !isDataLoaded) return;
    
    const timer = setTimeout(async () => {
      setIsLoading(true);
      await supabase.from('user_data').upsert({
        username: loggedUser,
        categorias,
        valores,
        notas,
        checks,
        item_colors: itemColors,
        item_groups: itemGroups,
        theme: themeConfig,
        custom_categories: categoryConfigs
      }, { onConflict: 'username' }); 
      setIsLoading(false);
    }, 1000); 
    
    return () => clearTimeout(timer);
    
  }, [categorias, valores, notas, checks, itemColors, itemGroups, themeConfig, categoryConfigs, isAuthenticated, loggedUser, isDataLoaded]);

  // --- FUNÇÕES DE AUTENTICAÇÃO ---
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (isSignupMode) {
       const uName = signupName.trim();
       const uUser = signupUser.trim().toLowerCase(); 
       const p = signupPass;
       if (!uName || !uUser || !p) return alert("Preencha todos os campos!");
       
       setIsLoading(true);
       const { error } = await supabase.from('app_users').insert([{ 
         name: uName, 
         username: uUser, 
         password: p 
       }]);
       
       if (error) {
           console.error(error);
           alert(`Erro: O nome de usuário "@${uUser}" já está em uso! Tente outro.`);
       } else {
           alert("Usuário criado com sucesso! Faça seu login.");
           setIsSignupMode(false);
           setSignupName('');
           setSignupUser('');
           setSignupPass('');
       }
       setIsLoading(false);
       return;
    }

    const uUser = loginInputUser.trim().toLowerCase();
    const p = loginInputPass;
    setIsLoading(true);
    
    const { data, error } = await supabase.from('app_users').select('*').eq('username', uUser).eq('password', p).single();

    if (data || (loginInputUser.trim() === 'Guigo' && p === '01091996') || (loginInputUser.trim() === 'Favu' && p === '16091992')) {
      const dbUser = data ? data.username : loginInputUser.trim();
      const dbName = data ? data.name : loginInputUser.trim();
      
      setIsAuthenticated(true);
      setLoggedUser(dbUser);
      setLoggedName(dbName);
      localStorage.setItem('fin_auth', 'true');
      localStorage.setItem('fin_user', dbUser);
      localStorage.setItem('fin_name', dbName);
    } else {
      alert('Usuário ou senha incorretos!');
    }
    setIsLoading(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoggedUser('');
    setLoggedName('');
    setIsProfileMenuOpen(false);
    setIsDataLoaded(false);
    localStorage.removeItem('fin_auth');
    localStorage.removeItem('fin_user');
    localStorage.removeItem('fin_name');
    setLoginInputPass('');
    setCategorias({ Rendas: [], Gastos: [], Investimentos: [] });
    setCategoryConfigs({});
    setValores({});
  };

  const salvarEdicaoPerfil = async () => {
    const newName = editProfileName.trim();
    const newUser = editProfileUser.trim().toLowerCase();
    if (!newName || !newUser || !editProfilePass.trim()) return alert('Preencha os campos de nome de exibição, usuário e senha!');
    
    setIsLoading(true);

    if (newUser !== loggedUser) {
        const { data: existingUser } = await supabase.from('app_users').select('username').eq('username', newUser).single();
        if (existingUser) {
            setIsLoading(false);
            return alert('Este @usuário já está em uso por outra pessoa. Escolha outro!');
        }
    }

    const { error } = await supabase.from('app_users').update({ name: newName, username: newUser, password: editProfilePass }).eq('username', loggedUser);
    
    if (error) {
        alert("Erro ao alterar dados no banco.");
    } else {
        if (newUser !== loggedUser) {
            await supabase.from('user_data').update({ username: newUser }).eq('username', loggedUser);
            await supabase.from('shared_expenses').update({ paid_by: newUser }).eq('paid_by', loggedUser);
            setLoggedUser(newUser);
            localStorage.setItem('fin_user', newUser);
        }

        setLoggedName(newName);
        localStorage.setItem('fin_name', newName);
        fetchAppUsers(); // Atualiza a lista na tela após alterar nome
        alert("Perfil atualizado com sucesso!");
        setIsProfileEditModalOpen(false);
        setIsProfileMenuOpen(false);
    }
    setIsLoading(false);
  };

  // --- ESTADOS DA APLICAÇÃO GERAL ---
  const [abaAtual, setAbaAtual] = useState('lancamentos');
  const [anoSelecionado, setAnoSelecionado] = useState(anoAtualRef);
  
  const [novoItemNome, setNovoItemNome] = useState('');
  const [novoItemTipo, setNovoItemTipo] = useState('Gastos');
  const [novoItemCor, setNovoItemCor] = useState(''); 
  const [draggedItem, setDraggedItem] = useState(null);

  // Estados Nova Categoria
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [novaCatNome, setNovaCatNome] = useState('');
  const [novaCatOp, setNovaCatOp] = useState('subtracao');
  const [novaCatCor, setNovaCatCor] = useState('#8B5CF6');

  // SELEÇÃO MÚLTIPLA E MODAIS
  const [selectionMode, setSelectionMode] = useState(null); 
  const [selectedItems, setSelectedItems] = useState([]);
  
  const [noteModal, setNoteModal] = useState({ isOpen: false, mes: '', item: '', text: '' });
  const [colorPicker, setColorPicker] = useState({ isOpen: false, tipo: '', item: null });
  
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isAddSharedModalOpen, setIsAddSharedModalOpen] = useState(false);

  // Estados de Gavetas (Drawers)
  const [showFaltaReceber, setShowFaltaReceber] = useState(false);
  const [showFaltaPagar, setShowFaltaPagar] = useState(false);
  const [showFaltaInvestir, setShowFaltaInvestir] = useState(false);
  const [showSaldoConfirmado, setShowSaldoConfirmado] = useState(false);
  const [showFaltaCustom, setShowFaltaCustom] = useState({});
  const toggleFaltaCustom = (cat) => {
    setShowFaltaCustom(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // --- ESTADOS DA ABA COMPARTILHADOS ---
  const [sharedTitle, setSharedTitle] = useState('');
  const [sharedDescription, setSharedDescription] = useState('');
  const [sharedAmount, setSharedAmount] = useState('');
  const [sharedPaidBy, setSharedPaidBy] = useState('');
  const [sharedSplitMode, setSharedSplitMode] = useState('50_50');
  
  const [filterMesShared, setFilterMesShared] = useState('Todos');
  const [filterAnoShared, setFilterAnoShared] = useState(anoAtualRef.toString());
  
  const [settleModalOpen, setSettleModalOpen] = useState(false); 

  useEffect(() => {
    if (isAuthenticated && loggedUser && !sharedPaidBy) {
      setSharedPaidBy(loggedUser); 
    }
  }, [isAuthenticated, loggedUser, sharedPaidBy]);

  // AUTO-SCROLL (MOBILE) COM SNAP NA PLANILHA
  useEffect(() => {
      if (abaAtual === 'lancamentos' && tableContainerRef.current && window.innerWidth <= 768) {
          setTimeout(() => {
              if (tableContainerRef.current) {
                  const currentMonthIndex = new Date().getMonth();
                  const scrollPos = currentMonthIndex * 90; // 90px é a largura da coluna de mês no CSS
                  tableContainerRef.current.scrollTo({ left: Math.max(0, scrollPos), behavior: 'smooth' });
              }
          }, 300);
      }
  }, [abaAtual, anoSelecionado]);

  const listaAnos = useMemo(() => {
    const anosComDados = Object.keys(valores).map(k => parseInt(k.replace('ano_', ''))).filter(y => !isNaN(y));
    anosComDados.push(anoAtualRef - 5, anoAtualRef + 5);
    const minAno = Math.min(...anosComDados);
    const maxAno = Math.max(...anosComDados);
    return Array.from({ length: maxAno - minAno + 1 }, (_, i) => minAno + i);
  }, [valores]);

  // CSS Variáveis Dinâmicas do Tema
  const themeStyles = useMemo(() => {
    let brand = '#0EA5E9', brandLight = '#E0F2FE', brandHover = '#0284C7';
    let bg = '#F0F9FF', surface = '#FFFFFF', textMain = '#0F172A', textMuted = '#64748B';
    let border = '#E0F2FE', borderDark = '#BAE6FD';
    let headerBg = '#0EA5E9', headerText = '#FFFFFF';
    let highlightBg = '#F8FAFC'; 
    
    if (themeConfig === 'dark') {
       bg = '#030712'; surface = '#111827'; textMain = '#F3F4F6'; textMuted = '#94A3B8';
       border = '#1F2937'; borderDark = '#374151'; brand = '#38BDF8'; brandLight = '#0C4A6E'; brandHover = '#7DD3FC';
       headerBg = '#1F2937'; headerText = '#FFFFFF';
       highlightBg = '#1F2937'; 
    } else {
       const selectedTheme = TEMAS_APP.find(t => t.id === themeConfig);
       if (selectedTheme) {
         headerBg = selectedTheme.cor;
         brand = selectedTheme.cor;
       }
       if (themeConfig === 'azul-favu') { brandLight = '#DBEAFE'; brandHover = '#1E3A8A'; border = '#DBEAFE'; borderDark = '#BFDBFE'; bg = '#EFF6FF'; highlightBg = '#F1F5F9'; }
       if (themeConfig === 'verde-vida') { brandLight = '#D1FAE5'; brandHover = '#047857'; border = '#D1FAE5'; borderDark = '#A7F3D0'; bg = '#ECFDF5'; highlightBg = '#F1F5F9'; }
       if (themeConfig === 'roxo-galaxy') { brandLight = '#EDE9FE'; brandHover = '#6D28D9'; border = '#EDE9FE'; borderDark = '#DDD6FE'; bg = '#F5F3FF'; highlightBg = '#F1F5F9'; }
       if (themeConfig === 'rosa-pop') { brandLight = '#FFE4E6'; brandHover = '#E11D48'; border = '#FFE4E6'; borderDark = '#FECDD3'; bg = '#FFF1F2'; highlightBg = '#F1F5F9'; }
       if (themeConfig === 'laranja-solar') { brandLight = '#FFEDD5'; brandHover = '#EA580C'; border = '#FFEDD5'; borderDark = '#FED7AA'; bg = '#FFF7ED'; highlightBg = '#F1F5F9'; }
       if (themeConfig === 'amarelo-mel') { brandLight = '#FEF08A'; brandHover = '#CA8A04'; border = '#FEF08A'; borderDark = '#FDE047'; bg = '#FEFCE8'; highlightBg = '#FEF9C3'; }
       if (themeConfig === 'ciano-aqua') { brandLight = '#CFFAFE'; brandHover = '#0891B2'; border = '#CFFAFE'; borderDark = '#A5F3FC'; bg = '#ECFEFF'; highlightBg = '#E0F2FE'; }
    }
    
    return `
      :root {
        --bg-color: ${bg}; --surface: ${surface}; --text-main: ${textMain}; --text-muted: ${textMuted};
        --border: ${border}; --border-dark: ${borderDark}; 
        --brand: ${brand}; --brand-light: ${brandLight}; --brand-hover: ${brandHover};
        --header-bg: ${headerBg}; --header-text: ${headerText};
        --highlight-bg: ${highlightBg};
        --green: #10B981; --green-bg: ${themeConfig === 'dark' ? 'rgba(16,185,129,0.1)' : '#ECFDF5'}; 
        --red: #EF4444; --red-bg: ${themeConfig === 'dark' ? 'rgba(239,68,68,0.1)' : '#FEF2F2'}; 
        --blue: #3B82F6; --blue-bg: ${themeConfig === 'dark' ? 'rgba(59,130,246,0.1)' : '#EFF6FF'};
      }
    `;
  }, [themeConfig]);

  // --- LÓGICA DE NEGÓCIO ---
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
      alert('Por favor, digite um nome para o novo item!');
      return;
    }
    if (categorias[novoItemTipo] && categorias[novoItemTipo].includes(nomeLimpo)) {
      alert('Este item já existe nessa categoria!');
      return;
    }
    
    setCategorias(prev => ({ ...prev, [novoItemTipo]: [...(prev[novoItemTipo] || []), nomeLimpo] }));
    
    if (novoItemCor) {
       setItemColors(prev => {
          const novo = { ...prev };
          if (!novo[novoItemTipo]) novo[novoItemTipo] = {};
          novo[novoItemTipo][nomeLimpo] = novoItemCor;
          return novo;
       });
    }
    
    setNovoItemNome('');
    setNovoItemCor('');
    setIsAddItemModalOpen(false);
  };

  const adicionarCategoria = () => {
    const nomeLimpo = novaCatNome.trim();
    if (!nomeLimpo) return alert("Digite o nome da categoria!");
    if (categorias[nomeLimpo] || ['Rendas', 'Gastos', 'Investimentos'].includes(nomeLimpo)) {
      return alert("Essa categoria já existe!");
    }

    setCategoryConfigs(prev => ({
       ...prev,
       [nomeLimpo]: { operacao: novaCatOp, cor: novaCatCor }
    }));
    setCategorias(prev => ({...prev, [nomeLimpo]: []}));
    setNovaCatNome('');
    setIsAddCategoryModalOpen(false);
  };

  const removerItem = (tipo, itemParaRemover) => {
    setCategorias(prev => ({ ...prev, [tipo]: prev[tipo].filter(item => item !== itemParaRemover) }));
  };

  const agruparSelecionados = (tipo) => {
    if (selectedItems.length === 0) return;
    const groupId = 'grupo_' + Date.now();
    
    setCategorias(prev => {
      const novo = { ...prev };
      const firstIndex = novo[tipo].findIndex(i => selectedItems.includes(i));
      const filterOut = novo[tipo].filter(i => !selectedItems.includes(i));
      filterOut.splice(firstIndex !== -1 ? firstIndex : filterOut.length, 0, ...selectedItems);
      novo[tipo] = filterOut;
      return novo;
    });

    setItemGroups(prev => {
      const novo = { ...prev };
      if (!novo[tipo]) novo[tipo] = {};
      selectedItems.forEach(item => { novo[tipo][item] = groupId; });
      return novo;
    });
    
    setSelectionMode(null);
    setSelectedItems([]);
  };

  const desagruparSelecionados = (tipo) => {
    if (selectedItems.length === 0) return;
    setItemGroups(prev => {
      const novo = { ...prev };
      if (novo[tipo]) {
        selectedItems.forEach(item => { delete novo[tipo][item]; });
      }
      return novo;
    });
    setSelectionMode(null);
    setSelectedItems([]);
  };

  const deleteSelected = (tipo) => {
    if(selectedItems.length === 0) return;
    if(window.confirm('Apagar itens selecionados?')) {
      setCategorias(prev => ({
        ...prev,
        [tipo]: prev[tipo].filter(i => !selectedItems.includes(i))
      }));
      setSelectionMode(null);
      setSelectedItems([]);
    }
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

    const moverDado = (prev) => {
      const novos = JSON.parse(JSON.stringify(prev));
      Object.keys(novos).forEach(ano => {
        Object.keys(novos[ano]).forEach(mes => {
          if (novos[ano][mes][nomeAntigo] !== undefined) {
            novos[ano][mes][nomeLimpo] = novos[ano][mes][nomeAntigo];
            delete novos[ano][mes][nomeAntigo];
          }
        });
      });
      return novos;
    };

    setValores(moverDado); setNotas(moverDado); setChecks(moverDado);

    setItemColors(prev => {
      const novasCores = JSON.parse(JSON.stringify(prev));
      if (novasCores[tipo] && novasCores[tipo][nomeAntigo] !== undefined) {
        novasCores[tipo][nomeLimpo] = novasCores[tipo][nomeAntigo];
        delete novasCores[tipo][nomeAntigo];
      }
      return novasCores;
    });

    setItemGroups(prev => {
      const novosGrupos = JSON.parse(JSON.stringify(prev));
      if (novosGrupos[tipo] && novosGrupos[tipo][nomeAntigo] !== undefined) {
        novosGrupos[tipo][nomeLimpo] = novosGrupos[tipo][nomeAntigo];
        delete novosGrupos[tipo][nomeAntigo];
      }
      return novosGrupos;
    });
  };

  const calcularTotal = (mes, listaItens, filtro = 'todos') => {
    const ano = `ano_${anoSelecionado}`;
    if (!listaItens || listaItens.length === 0) return 0;
    
    return listaItens.reduce((total, item) => {
      const isChecked = checks[ano]?.[mes]?.[item] || false;
      
      if (filtro === 'validados' || filtro === true) {
        if (!isChecked) return total;
      }
      if (filtro === 'pendentes') {
        if (isChecked) return total;
      }
      
      const valorString = valores[ano]?.[mes]?.[item] || '0';
      const valorDecimal = parseFloat(valorString.toString().replace(/\./g, '').replace(',', '.'));
      return total + (isNaN(valorDecimal) ? 0 : valorDecimal);
    }, 0);
  };

  const calcularSaldoMensal = (mes, filtro = 'todos') => {
      let saldo = calcularTotal(mes, categorias.Rendas, filtro) - calcularTotal(mes, categorias.Gastos, filtro) - calcularTotal(mes, categorias.Investimentos, filtro);
      
      Object.keys(categoryConfigs).forEach(cat => {
          const val = calcularTotal(mes, categorias[cat], filtro);
          if (categoryConfigs[cat].operacao === 'soma') saldo += val;
          else saldo -= val;
      });
      
      return saldo;
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

  const handleSaveSharedExpense = async () => {
    if (!sharedTitle.trim() || !sharedAmount) return alert('Preencha o nome do item e o valor!');
    const numAmount = parseFloat(sharedAmount.toString().replace(/\./g, '').replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) return alert('Valor inválido!');

    const newExpense = {
      id: Date.now(),
      date: new Date().toLocaleDateString('pt-BR'),
      title: sharedTitle.trim(),
      description: sharedDescription.trim(),
      amount: numAmount,
      paid_by: sharedPaidBy,
      split_mode: sharedSplitMode,
      is_settled: false
    };
    
    setSharedExpenses([newExpense, ...sharedExpenses]);
    setSharedTitle('');
    setSharedDescription('');
    setSharedAmount('');
    setIsAddSharedModalOpen(false); 
    
    await supabase.from('shared_expenses').insert([newExpense]);
  };

  const updateSharedField = async (id, field, value) => {
    setSharedExpenses(prev => prev.map(exp => exp.id === id ? { ...exp, [field]: value } : exp));
    await supabase.from('shared_expenses').update({ [field]: value }).eq('id', id);
  };

  const handleDeleteSharedExpense = async (id) => {
    if(window.confirm("Deseja realmente excluir essa conta?")) {
      setSharedExpenses(prev => prev.filter(exp => exp.id !== id));
      await supabase.from('shared_expenses').delete().eq('id', id);
    }
  };

  const filteredSharedExpenses = useMemo(() => {
    return sharedExpenses.filter(exp => {
       const parts = exp.date.split('/'); 
       if (parts.length !== 3) return true;
       const [, m, y] = parts;
       const passMes = filterMesShared === 'Todos' || m === filterMesShared;
       const passAno = filterAnoShared === 'Todos' || y === filterAnoShared;
       return passMes && passAno;
    });
  }, [sharedExpenses, filterMesShared, filterAnoShared]);

  const splitwiseData = useMemo(() => {
    let myPaidTotal = 0;
    let partnerPaidTotal = 0;
    let myBalance = 0;

    let partnerName = 'Grupo';
    const others = appUsers.filter(u => u.username !== loggedUser);
    if (others.length === 1) {
      partnerName = others[0].name;
    } else if (others.length > 1) {
      const otherUserInExpenses = filteredSharedExpenses.find(e => e.paid_by !== loggedUser)?.paid_by;
      if (otherUserInExpenses) {
           partnerName = appUsers.find(u => u.username === otherUserInExpenses)?.name || 'Parceiro';
      }
    }

    filteredSharedExpenses.forEach(exp => {
      const isMePaying = exp.paid_by === loggedUser;
      
      if (isMePaying) myPaidTotal += exp.amount;
      else partnerPaidTotal += exp.amount;

      if (!exp.is_settled) {
        let myShare = 0;
        if (exp.split_mode === '50_50') {
          myShare = exp.amount / 2;
        } else if (exp.split_mode === `100_${loggedUser.toLowerCase()}`) {
          myShare = exp.amount;
        } else if (exp.split_mode === '100') {
          myShare = 0;
        }

        if (isMePaying) {
          myBalance += (exp.amount - myShare); 
        } else {
          myBalance -= myShare; 
        }
      }
    });

    return { myBalance, myPaidTotal, partnerPaidTotal, partnerName };
  }, [filteredSharedExpenses, loggedUser, appUsers]);

  const renderizarLinhasTabela = (tipo, listaItens, corPadrao) => {
    const ano = `ano_${anoSelecionado}`;
    let corTextoValor = corPadrao;
    if (tipo === 'Rendas') corTextoValor = 'var(--green)';
    else if (tipo === 'Gastos') corTextoValor = 'var(--red)';
    else if (tipo === 'Investimentos') corTextoValor = 'var(--blue)';

    if (!listaItens || listaItens.length === 0) return null;

    return listaItens.map((item, index) => {
      const corDaSubclasse = itemColors[tipo]?.[item];
      const bolinhaCor = corDaSubclasse || corPadrao;
      
      const groupId = itemGroups[tipo]?.[item];
      const isGrouped = !!groupId;
      const cellBgColor = corDaSubclasse ? `${corDaSubclasse}22` : (isGrouped ? `rgba(0,0,0,0.03)` : 'transparent');
      
      const isSelected = selectedItems.includes(item);

      const prevItem = index > 0 ? listaItens[index - 1] : null;
      const prevGroupId = prevItem ? itemGroups[tipo]?.[prevItem] : null;
      const isNewGroup = index > 0 && groupId !== prevGroupId;

      return (
        <React.Fragment key={item}>
          {isNewGroup && <tr className="mini-spacer-row"><td colSpan={13} style={{height: '6px', background: 'var(--bg-color)', border: 'none'}}></td></tr>}
          
          <tr className="table-row">
            <td className="sticky-col">
              <div 
                className="category-cell"
                draggable
                onDragStart={() => handleDragStart(tipo, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => { e.preventDefault(); handleDrop(tipo, index); }}
                style={{ cursor: 'grab', backgroundColor: cellBgColor, borderRadius: '8px', margin: '2px 4px', transition: '0.2s' }}
              >
                <div className="drag-handle" title="Arraste para reordenar" style={{ color: '#94A3B8', paddingRight: '8px', userSelect: 'none' }}>⋮⋮</div>
                
                {selectionMode === tipo ? (
                  <input 
                    type="checkbox" 
                    checked={isSelected} 
                    onChange={(e) => {
                      if(e.target.checked) setSelectedItems([...selectedItems, item]);
                      else setSelectedItems(selectedItems.filter(i => i !== item));
                    }} 
                    style={{marginRight: '8px', cursor: 'pointer', transform: 'scale(1.2)'}}
                  />
                ) : (
                  <div 
                    className="category-indicator" 
                    style={{ backgroundColor: bolinhaCor, cursor: 'pointer', transform: 'scale(1.2)' }}
                    onClick={() => setColorPicker({ isOpen: true, tipo, item })}
                    title="Escolher cor do item"
                  ></div>
                )}
                
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
                      style={{ color: corTextoValor, textAlign: 'center' }} 
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
        </React.Fragment>
      );
    });
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
      <div className={`login-wrapper ${isSignupMode ? 'signup-mode' : ''}`}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
          html, body, #root { width: 100vw; height: 100vh; margin: 0; overflow: hidden; }
          
          .login-wrapper { width: 100%; height: 100%; background-color: #0EA5E9; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: background-color 0.5s ease; padding: 1rem; }
          .login-wrapper.signup-mode { background-color: #1E40AF; } 
          
          .login-icon-box { margin-bottom: 0.5rem; background-color: transparent; border-radius: 9999px; display: inline-block; width: 120px; height: 120px; }
          
          .login-app-title { 
            color: white; 
            font-family: 'Arial Black', Impact, sans-serif; 
            font-weight: 900; 
            font-size: 2.8rem; 
            margin-bottom: 1.5rem; 
            letter-spacing: -1px; 
            text-transform: uppercase;
            font-style: italic;
            text-shadow: 0 4px 15px rgba(0,0,0,0.2); 
            text-align: center;
          }
          
          .login-form { background-color: white; width: 100%; max-width: 400px; border-radius: 40px; padding: 2.5rem; display: flex; flex-direction: column; gap: 1rem; align-items: center; box-shadow: 0 20px 40px rgba(0,0,0,0.2); transition: all 0.3s; }
          .login-wrapper.signup-mode .login-form { border-radius: 20px; box-shadow: 0 20px 50px rgba(30, 64, 175, 0.4); }
          
          .login-title { font-size: 1.5rem; font-weight: 800; color: #374151; margin-bottom: 0.5rem; text-align: center; width: 100%; }
          .login-input { width: 100%; padding: 1.1rem; background-color: #F3F4F6; border-radius: 1rem; outline: none; border: none; font-family: inherit; font-size: 1rem; color: #111827;}
          .login-input:focus { box-shadow: 0 0 0 2px #0EA5E9; }
          
          .login-btn { width: 100%; padding: 1.1rem; background-color: #0EA5E9; color: white; font-weight: 900; border-radius: 1rem; border: none; cursor: pointer; transition: 0.2s; font-size: 1.1rem; margin-top: 0.5rem; }
          .login-btn:hover { background-color: #0284C7; }
          
          .toggle-mode-btn { background: transparent; border: none; color: #64748B; font-weight: 700; cursor: pointer; margin-top: 10px; font-size: 0.85rem;}
          .toggle-mode-btn:hover { color: #0EA5E9; text-decoration: underline;}
        `}</style>
        
        <div className="login-icon-box"><GuigoIcon /></div>
        <h1 className="login-app-title">APP GUIGO</h1>
        
        <form className="login-form" onSubmit={handleLogin}>
          <h2 className="login-title">{isSignupMode ? 'Criar Conta' : 'Entrar'}</h2>
          
          {isSignupMode && (
            <input type="text" placeholder="Nome de Exibição (Ex: Guilherme)" className="login-input" required value={signupName} onChange={(e) => setSignupName(e.target.value)} />
          )}
          
          <input type="text" placeholder={isSignupMode ? "Usuário Único (Ex: gui_123)" : "Nome de Usuário (Ex: gui_123)"} className="login-input" required value={isSignupMode ? signupUser : loginInputUser} onChange={(e) => isSignupMode ? setSignupUser(e.target.value) : setLoginInputUser(e.target.value)} />
          <input type="password" placeholder="Sua Senha" className="login-input" required value={isSignupMode ? signupPass : loginInputPass} onChange={(e) => isSignupMode ? setSignupPass(e.target.value) : setLoginInputPass(e.target.value)} />
          
          <button type="submit" className="login-btn">{isSignupMode ? 'Registrar Agora' : 'Acessar'}</button>
          
          <button type="button" className="toggle-mode-btn" onClick={() => setIsSignupMode(!isSignupMode)}>
            {isSignupMode ? 'Já tem conta? Faça Login' : 'Criar Novo Usuário'}
          </button>
        </form>
      </div>
    );
  }

  const selectedThemeName = TEMAS_APP.find(t => t.id === themeConfig)?.nome || 'Tema Customizado';

  const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>
  );

  // --- TELA PRINCIPAL DA APLICAÇÃO ---
  return (
    <>
      <style>{themeStyles}</style>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
        html, body, #root { width: 100vw; height: 100vh; margin: 0 !important; padding: 0 !important; max-width: none !important; background-color: var(--bg-color); color: var(--text-main); -webkit-font-smoothing: antialiased; overflow: hidden; text-align: left !important; }

        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }

        .app-container { width: 100vw; height: 100vh; display: flex; flex-direction: column; }
        
        .header { display: flex; justify-content: flex-start; align-items: center; gap: 1.5rem; background: var(--header-bg); padding: 1rem 2rem; border-bottom: 1px solid var(--border); box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); z-index: 50; transition: background 0.3s; }
        
        .header-left { display: flex; align-items: center; gap: 0.8rem; }
        .logo { font-weight: 800; color: var(--header-text); letter-spacing: -0.05em; display: flex; flex-direction: column; align-items: flex-start; gap: 2px; margin: 0;}
        
        .avatar-btn { background: rgba(255,255,255,0.2); border: 2px solid transparent; border-radius: 50%; width: 45px; height: 45px; padding: 2px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; }
        .avatar-btn:hover { background: rgba(255,255,255,0.3); transform: scale(1.05); }
        
        .profile-menu { position: absolute; left: 0; top: 60px; background: var(--surface); border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); border: 1px solid var(--border); overflow: hidden; z-index: 100; min-width: 180px; display: flex; flex-direction: column; }
        .profile-menu-header { padding: 1rem; background: var(--bg-color); border-bottom: 1px solid var(--border); }
        .profile-menu-name { font-weight: 800; font-size: 1rem; color: var(--text-main); display: block; }
        .profile-menu-item { padding: 1rem; background: transparent; border: none; text-align: left; font-weight: 700; font-size: 0.85rem; color: var(--text-main); cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 10px; }
        .profile-menu-item:hover { background: var(--bg-color); }
        .profile-menu-item.danger { color: var(--red); border-top: 1px solid var(--border); }
        .profile-menu-item.danger:hover { background: var(--red-bg); }
        
        .tabs { display: flex; gap: 0.5rem; background: rgba(255,255,255,0.1); padding: 0.4rem; border-radius: 12px; margin-left: auto; }
        .tab-btn { padding: 0.5rem 1rem; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; transition: all 0.2s; background: transparent; color: rgba(255,255,255,0.7); font-size: 0.76rem; white-space: nowrap;}
        .tab-btn.active { background: #fff; color: var(--brand); box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); }
        .tab-btn:not(.active):hover { color: #fff; }
        
        .content-area { padding: 1.5rem 2rem 2rem 2rem; flex: 1; overflow: hidden; display: flex; flex-direction: column; position: relative;}

        .controls-card { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; background: var(--surface); padding: 1rem 1.5rem; border-radius: 12px; border: 1px solid var(--border); box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03); flex-shrink: 0; }
        
        .form-input, .form-select { background: var(--bg-color); border: 1px solid var(--border-dark); padding: 0.52rem 0.8rem; border-radius: 8px; font-size: 0.52rem; outline: none; transition: all 0.2s; color: var(--text-main); font-weight: 600; width: 100%;}
        .form-input:focus, .form-select:focus { border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-light); }
        .btn-primary { background: var(--brand); color: white; border: none; padding: 0.52rem 1rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 0.52rem; }
        .btn-primary:hover { background: var(--brand-hover); transform: translateY(-1px); box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); }
        .btn-secondary { background: var(--bg-color); color: var(--text-muted); border: 1px solid var(--border-dark); padding: 0.52rem 1rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 0.52rem; }
        .btn-secondary:hover { background: var(--border); color: var(--text-main); }

        .table-container { width: 100%; flex: 1; overflow: auto; background: var(--bg-color); border-radius: 12px; border: 1px solid var(--border); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05); }
        table { width: 100%; border-collapse: separate; border-spacing: 0; min-width: 1200px; }
        
        th, td { border-bottom: 1px solid var(--border); border-right: 1px solid var(--border); background: var(--surface); }
        th:last-child, td:last-child { border-right: none; } 

        thead th { position: sticky; top: 0; z-index: 20; background: var(--highlight-bg); padding: 1.15rem 0.5rem; font-size: 0.55rem; font-weight: 800; color: var(--brand); text-transform: uppercase; text-align: center; letter-spacing: 0.05em; border-bottom: 2px solid var(--border-dark); box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05); }
        .sticky-col { position: sticky; left: 0; z-index: 10; background-color: var(--surface); border-right: 2px solid var(--border-dark); }
        thead th.sticky-col { z-index: 30; text-align: left; padding-left: 1.5rem; background-color: var(--highlight-bg); }
        
        .table-row { transition: background-color 0.15s; }
        .table-row:hover td { background: var(--bg-color); }
        .table-row:hover .sticky-col { background: var(--bg-color); }

        .spacer-row td { height: 2.5rem; background-color: var(--bg-color) !important; border: none !important; }
        .spacer-row td.sticky-col { border-right: none !important; }

        .category-cell { display: flex; align-items: center; padding: 0.25rem 1.5rem 0.25rem 0.5rem; }
        .category-indicator { width: 8px; height: 8px; border-radius: 50%; margin-right: 0.75rem; flex-shrink: 0; transition: 0.2s;}
        .category-indicator:hover { opacity: 0.8; box-shadow: 0 0 0 2px var(--border); }
        
        .item-name-input { flex: 1; font-size: 0.6rem; font-weight: 600; color: var(--text-main); background: transparent; border: 1px solid transparent; border-radius: 6px; padding: 0.35rem 0.5rem; outline: none; transition: 0.2s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;}
        .item-name-input:hover { border-color: var(--border); }
        .item-name-input:focus { border-color: var(--brand); background: var(--surface); box-shadow: 0 0 0 2px var(--brand-light); }
        
        .delete-btn { opacity: 0; background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 0.25rem; margin-left: 0.5rem; font-size: 0.6rem; transition: all 0.2s; }
        .table-row:hover .delete-btn { opacity: 1; }
        .delete-btn:hover { color: var(--red) !important; transform: scale(1.1); }

        .input-cell { padding: 0; position: relative; }
        .input-wrapper { width: 100%; height: 100%; position: relative; }
        
        .check-btn {
          position: absolute; left: 8px; top: 50%; transform: translateY(-50%);
          width: 12px; height: 12px; border: 1px solid var(--border-dark); border-radius: 3px;
          background: var(--surface); cursor: pointer; transition: 0.2s;
          display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: bold; color: transparent; z-index: 5;
        }
        .check-btn:hover { border-color: var(--brand); }
        .check-btn.checked { background: var(--green); border-color: var(--green); color: white; }

        .data-input { 
          width: 100%; height: 100%; border: 1px solid transparent; background: transparent; text-align: center; 
          padding: 0.85rem 0.5rem 0.85rem 26px; 
          font-size: 0.6rem; font-weight: 500; color: var(--text-main); outline: none; font-variant-numeric: tabular-nums; transition: all 0.2s; 
        }
        .data-input:hover { background: rgba(0,0,0,0.02); }
        .data-input:focus { background: var(--surface); border: 2px solid var(--brand); box-shadow: inset 0 0 0 1px var(--brand-light); }
        .data-input::placeholder { color: var(--text-muted); opacity: 0.5; }
        
        .is-checked .data-input { font-weight: 800; opacity: 1; }

        .note-indicator { position: absolute; top: 0; right: 0; width: 0; height: 0; border-style: solid; border-width: 0 10px 10px 0; border-color: transparent #F59E0B transparent transparent; pointer-events: none;}
        .has-note .data-input { background-color: rgba(245, 158, 11, 0.05); }

        .custom-tooltip {
          display: none; position: absolute; top: 100%; right: 0; margin-top: 4px;
          background-color: var(--surface); color: var(--text-main); font-size: 0.65rem; font-weight: 500;
          padding: 0.75rem; border-radius: 6px; border: 1px solid var(--border);
          box-shadow: 0 10px 25px rgba(0,0,0,0.15); z-index: 999;
          width: max-content; min-width: 150px; max-width: 250px; max-height: 120px; overflow-y: auto;
          text-align: left; white-space: pre-wrap; word-wrap: break-word; line-height: 1.4;
        }
        .input-wrapper:hover .custom-tooltip { display: block; }

        .modal-overlay {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(0, 0, 0, 0.6); display: flex; justify-content: center; align-items: center;
          z-index: 1000; backdrop-filter: blur(2px); padding: 1rem;
        }
        
        .theme-modal { 
          background: var(--bg-color); padding: 0; border-radius: 30px; 
          width: 100%; max-width: 450px; box-shadow: 0 20px 40px rgba(0,0,0,0.3); 
          display: flex; flex-direction: column; max-height: 90vh; border: 1px solid var(--border); overflow: hidden;
        }
        .theme-header { 
          background: var(--surface); padding: 1.5rem; display: flex; align-items: center; gap: 1rem; 
          border-bottom: 1px solid var(--border); flex-shrink: 0; 
        }
        .theme-btn-back { 
          background: var(--bg-color); border: 1px solid var(--border-dark); border-radius: 50%; 
          width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; 
          cursor: pointer; color: var(--text-main); transition: 0.2s; flex-shrink: 0;
        }
        .theme-btn-back:hover { background: var(--border); }
        .theme-body { padding: 1.5rem; overflow-y: auto; }
        
        .modal-actions { display: flex; justify-content: flex-end; gap: 0.8rem; margin-top: 1.5rem; }

        .note-textarea {
          width: 100%; min-height: 120px; padding: 1rem; border: 1px solid var(--border-dark);
          border-radius: 8px; font-family: inherit; font-size: 0.9rem; color: var(--text-main);
          outline: none; resize: vertical; line-height: 1.5; background: var(--bg-color);
        }
        .note-textarea:focus { border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-light); background: var(--surface);}
        
        .section-rendas td { background: var(--green-bg) !important; color: var(--green) !important; border-top: 1px solid var(--border); }
        .section-gastos td { background: var(--red-bg) !important; color: var(--red) !important; border-top: 1px solid var(--border); }
        .section-invest td { background: var(--blue-bg) !important; color: var(--blue) !important; border-top: 1px solid var(--border); }

        .category-total-row { height: 38px; cursor: pointer; transition: background-color 0.2s; }
        .category-total-row:hover td { background: var(--border) !important; }
        .category-total-row td { background: var(--highlight-bg); font-weight: 800; font-size: 0.69rem; padding: 0 0.5rem; text-align: center; border-top: 1px solid var(--border); vertical-align: middle; }
        .category-total-row td.sticky-col { text-align: left; padding-left: 2rem; font-size: 0.58rem; text-transform: uppercase; z-index: 10; }

        .section-title td.sticky-col { padding: 1.2rem 0 1.2rem 1.5rem; font-weight: 800; font-size: 0.67rem; text-transform: uppercase; text-align: left; letter-spacing: 0.05em; z-index: 10; display: flex; justify-content: space-between; align-items: center;}
        
        .subtotals-drawer-row { height: 32px; }
        .subtotals-drawer-row td { position: sticky; background: var(--surface); font-weight: 700; font-size: 0.55rem; padding: 0 0.5rem; text-align: center; border-top: 1px solid var(--border-dark); z-index: 40; vertical-align: middle; }
        .subtotals-drawer-row td.sticky-col { text-align: left; padding-left: 2.5rem; font-size: 0.48rem; text-transform: uppercase; z-index: 50; }

        .totals-row { height: 50px; cursor: pointer; transition: 0.2s; }
        .totals-row:hover td { background-color: var(--border) !important; }
        .totals-row td { position: sticky; bottom: 0; z-index: 40; padding: 0 0.5rem; font-weight: 800; font-size: 0.72rem; text-align: center; white-space: nowrap; border-top: 2px solid var(--border-dark); background-color: var(--highlight-bg); box-shadow: 0 -4px 10px rgba(0,0,0,0.05); vertical-align: middle;}
        .totals-row td.sticky-col { text-align: left; padding-left: 1.5rem; z-index: 50; }

        .dash-container { overflow-y: auto; height: 100%; display: flex; flex-direction: column; position: relative; }
        .dash-header-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        
        .dash-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
        .card { background: var(--surface); border-radius: 12px; padding: 1rem 1.2rem; border: 1px solid var(--border); box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03); display: flex; flex-direction: column; gap: 0.2rem; justify-content: center;}
        
        .card-top { display: flex; justify-content: space-between; align-items: center; } 
        .card-label { font-size: 0.66rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.8;}
        .card-icon { width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; }
        .card-value { font-size: 1rem; font-weight: 800; letter-spacing: -0.02em; }

        .chart-card { background: var(--surface); border-radius: 12px; padding: 1.5rem; border: 1px solid var(--border); flex: 1; min-height: 300px; box-shadow: 0 4px 15px rgba(0,0,0, 0.03); }
        
        .shared-table { width: 100%; border-collapse: separate; border-spacing: 0; min-width: 900px;}
        .shared-table th, .shared-table td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid var(--border); background: var(--surface); font-size: 0.6rem; }
        
        .shared-table th { color: var(--brand); font-weight: 800; font-size: 0.55rem; text-transform: uppercase; letter-spacing: 0.05em; position: sticky; top: 0; border-bottom: 2px solid var(--border-dark); background: var(--highlight-bg); z-index: 20; box-shadow: 0 4px 10px rgba(0,0,0, 0.05); }
        .shared-table tr:hover td { background-color: var(--bg-color); }
        
        .shared-table tr.settled td { opacity: 0.4; text-decoration: line-through; }
        .shared-table tr.settled td.action-cell { opacity: 1; text-decoration: none; }
        
        .badge { padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.52rem; font-weight: 700; display: inline-block; }
        .badge-guigo { background: rgba(79, 70, 229, 0.1); color: #4F46E5; }
        .badge-favu { background: rgba(219, 39, 119, 0.1); color: #DB2777; }
        .badge-split { background: rgba(217, 119, 6, 0.1); color: #D97706; }

        .action-btn { background: transparent; border: none; cursor: pointer; padding: 0.35rem 0.5rem; border-radius: 6px; font-weight: 700; font-size: 0.45rem; transition: 0.2s;}
        .action-btn:hover { background: rgba(0,0,0,0.05); transform: translateY(-1px); }
        .del-btn { color: var(--red); font-size: 0.85rem; padding: 0.2rem; }
        .del-btn:hover { background: var(--red-bg); }

        .debt-card { transition: all 0.2s; }
        .debt-card.clickable { cursor: pointer; }
        .debt-card.clickable:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(0,0,0, 0.15); }

        /* ======================================================== */
        /* 📱 MEDIA QUERIES PARA RESPONSIVIDADE (MOBILE EXCLUSIVO)  */
        /* ======================================================== */
        @media (max-width: 768px) {
          .header { flex-direction: column; align-items: flex-start; padding: 1rem; gap: 1rem; padding-bottom: 0.5rem;}
          .header-left { width: 100%; }
          
          /* Nav Inferior Fixa */
          .tabs {
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100vw;
            height: 65px;
            background: var(--surface);
            border-top: 1px solid var(--border);
            z-index: 1000;
            display: flex;
            justify-content: space-around;
            align-items: center;
            padding: 0;
            margin: 0;
            border-radius: 0;
          }
          .tab-btn {
            flex: 1;
            height: 100%;
            border-radius: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: var(--text-muted);
            font-size: 0.7rem !important;
            background: transparent !important;
            box-shadow: none !important;
            border-top: 3px solid transparent;
          }
          .tab-btn.active {
            color: var(--brand) !important;
            border-top: 3px solid var(--brand);
            background: var(--highlight-bg) !important;
          }

          .content-area { padding: 0.5rem 0.5rem 80px 0.5rem !important; } 
          
          /* Painéis de Controles em Linha Única */
          .controls-card {
            display: flex !important;
            flex-direction: row !important;
            flex-wrap: nowrap !important;
            align-items: center !important;
            justify-content: space-between !important;
            padding: 0.8rem 0.5rem !important;
            overflow-x: auto;
            gap: 0.5rem !important;
          }
          .controls-card::-webkit-scrollbar { display: none; }
          .controls-card > div {
            display: flex !important;
            flex-direction: row !important;
            flex-wrap: nowrap !important;
            width: auto !important;
            gap: 0.4rem !important;
            align-items: center !important;
          }
          .form-select, .btn-primary, .btn-secondary {
            font-size: 0.65rem !important;
            padding: 0.4rem 0.6rem !important;
            white-space: nowrap !important;
            width: auto !important;
          }
          .controls-card .btn-primary, .controls-card .btn-secondary { min-width: fit-content; }

          /* Sticky Header no Dashboard Mobile */
          .sticky-dash-header {
            position: sticky;
            top: 0;
            z-index: 50;
            background-color: var(--bg-color);
            padding: 10px 0;
            margin-top: -10px;
          }

          /* Coluna de Categoria Expandida e Snap Scroll */
          .table-container { scroll-snap-type: x mandatory; }
          table { min-width: max-content !important; }
          table col:first-child { width: 125px !important; min-width: 125px !important; max-width: 125px !important; }
          table col:nth-child(n+2) { width: 90px !important; min-width: 90px !important; max-width: 90px !important; }
          
          th.sticky-col, td.sticky-col { 
              width: 125px !important; 
              min-width: 125px !important; 
              max-width: 125px !important; 
              padding: 0.5rem 0.2rem !important; 
              font-size: 0.55rem !important;
          }
          th:not(.sticky-col), td.input-cell {
              scroll-snap-align: start;
              scroll-margin-left: 125px; /* Compensa a coluna fixa para o Snap */
          }
          
          thead th.sticky-col { padding-left: 0.5rem !important; }
          .section-title td.sticky-col { font-size: 0.55rem !important; padding-left: 0.2rem !important; }
          
          .category-cell { padding: 0.2rem !important; margin: 1px !important;}
          .drag-handle { display: none !important; }
          .category-indicator { width: 6px; height: 6px; margin-right: 0.2rem !important; }
          .item-name-input { font-size: 0.6rem !important; padding: 0.2rem !important; text-overflow: ellipsis; }
          .data-input { padding: 0.5rem 0.1rem 0.5rem 12px !important; font-size: 0.65rem !important; }
          .check-btn { width: 12px !important; height: 12px !important; left: 1px !important; }
          
          .category-total-row td.sticky-col, .totals-row td.sticky-col, .subtotals-drawer-row td.sticky-col { 
              padding-left: 0.2rem !important; 
              font-size: 0.55rem !important; 
              white-space: normal !important; 
              line-height: 1.1; 
          }
          .category-total-row td, .totals-row td { font-size: 0.7rem !important; padding: 0 0.2rem !important;}

          /* Tabela Compartilhados (Modo Card Seguro) */
          .shared-table thead { display: none !important; }
          .shared-table tbody, .shared-table tr, .shared-table td { display: block !important; width: 100% !important; }
          .shared-table tr { margin-bottom: 1rem !important; border: 1px solid var(--border-dark) !important; border-radius: 12px !important; padding: 0.5rem !important; background: var(--surface) !important; }
          
          .shared-table td { 
              display: flex !important; 
              flex-direction: row !important;
              justify-content: space-between !important; 
              align-items: center !important; 
              border-bottom: 1px dashed var(--border) !important; 
              padding: 0.4rem 0.2rem !important; 
              min-height: 30px !important;
          }
          .shared-table td::before { 
              content: attr(data-label); 
              font-weight: 800 !important; 
              color: var(--brand) !important; 
              font-size: 0.55rem !important; 
              text-transform: uppercase !important; 
              width: 35% !important; 
              flex-shrink: 0 !important; 
          }
          .shared-table td:last-child { border-bottom: none !important; justify-content: flex-end !important; padding-top: 0.4rem !important;}
          
          .shared-table td .item-name-input, .shared-table td select { 
              flex: 1 !important;
              text-align: right !important; 
              text-align-last: right !important;
              background: transparent !important; 
              border: none !important;
              padding: 0 !important; 
              margin-left: 10px !important;
              font-size: 0.65rem !important;
              color: var(--text-main) !important;
              font-weight: 600 !important;
              min-width: 0 !important;
              max-width: 65% !important;
              outline: none !important;
          }
          .shared-table td .action-btn { display: block !important; margin-left: auto; }
          .shared-table tr.settled { opacity: 0.6 !important; }
          
          .dash-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* MODAL DE EDIÇÃO DE PERFIL */}
      {isProfileEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsProfileEditModalOpen(false)}>
          <div className="theme-modal" onClick={e => e.stopPropagation()}>
            <div className="theme-header">
              <button className="theme-btn-back" onClick={() => setIsProfileEditModalOpen(false)}> <CloseIcon /> </button>
              <div>
                <h1 style={{fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-main)', margin: 0, lineHeight: 1}}>Editar Perfil</h1>
                <p style={{fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--brand)', margin: 0}}>APP GUIGO</p>
              </div>
            </div>
            <div className="theme-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>Nome de Exibição:</label>
                  <input type="text" className="form-input" style={{ width: '100%', marginTop: '5px' }} placeholder="Como quer ser chamado?" value={editProfileName} onChange={(e) => setEditProfileName(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>Usuário Único (@):</label>
                  <input type="text" className="form-input" style={{ width: '100%', marginTop: '5px' }} placeholder="Seu username de acesso" value={editProfileUser} onChange={(e) => setEditProfileUser(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>Nova Senha:</label>
                  <input type="password" className="form-input" style={{ width: '100%', marginTop: '5px' }} placeholder="Nova senha" value={editProfilePass} onChange={(e) => setEditProfilePass(e.target.value)} />
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setIsProfileEditModalOpen(false)}>Cancelar</button>
                <button className="btn-primary" onClick={salvarEdicaoPerfil}>Salvar Alterações</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE TEMA */}
      {isThemeModalOpen && (
        <div className="modal-overlay" onClick={() => setIsThemeModalOpen(false)}>
          <div className="theme-modal" onClick={e => e.stopPropagation()}>
            <div className="theme-header">
              <button className="theme-btn-back" onClick={() => setIsThemeModalOpen(false)}> <CloseIcon /> </button>
              <div>
                <h1 style={{fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-main)', margin: 0, lineHeight: 1}}>Aparência</h1>
                <p style={{fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--brand)', margin: 0}}>APP GUIGO</p>
              </div>
            </div>
            <div className="theme-body" style={{ textAlign: 'center' }}>
              <h3 style={{fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'}}>
                Tema do App
              </h3>
              <p style={{fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '20px'}}>Esta cor define o estilo do aplicativo e seus gráficos.</p>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 55px)', gap: '15px', justifyContent: 'center', marginBottom: '20px'}}>
                {TEMAS_APP.map(tema => (
                  <button 
                    key={tema.id}
                    onClick={() => setThemeConfig(tema.id)} 
                    style={{
                      width:'55px', height:'55px', borderRadius:'50%', background: tema.cor, cursor:'pointer', transition:'0.2s', 
                      border: themeConfig === tema.id ? '4px solid var(--text-main)' : '4px solid var(--surface)', 
                      boxShadow:'0 4px 10px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: themeConfig === tema.id ? '1' : '0.7'
                    }} 
                    title={tema.nome}
                  >
                    {tema.id === 'dark' && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"></path></svg>}
                    {themeConfig === tema.id && tema.id !== 'dark' && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.801 10A10 10 0 1 1 17 3.335"></path><path d="m9 11 3 3L22 4"></path></svg>}
                  </button>
                ))}
              </div>
              <div style={{background: 'var(--surface)', padding: '8px 15px', borderRadius: '12px', display: 'inline-block', fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-main)', border: '1px solid var(--border)'}}>
                {selectedThemeName}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE NOTAS */}
      {noteModal.isOpen && (
        <div className="modal-overlay" onClick={() => setNoteModal({ isOpen: false, mes: '', item: '', text: '' })}>
          <div className="theme-modal" onClick={e => e.stopPropagation()}>
            <div className="theme-header">
              <button className="theme-btn-back" onClick={() => setNoteModal({ isOpen: false, mes: '', item: '', text: '' })}> <CloseIcon /> </button>
              <div>
                <h1 style={{fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-main)', margin: 0, lineHeight: 1}}>Anotação</h1>
                <p style={{fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--brand)', margin: 0}}>{noteModal.item} • {noteModal.mes}</p>
              </div>
            </div>
            <div className="theme-body">
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
        </div>
      )}

      {/* MODAL DO SELETOR DE CORES DA BOLINHA */}
      {colorPicker.isOpen && (
        <div className="modal-overlay" onClick={() => setColorPicker({ isOpen: false, tipo: '', item: null })}>
          <div className="theme-modal" style={{maxWidth: '320px'}} onClick={e => e.stopPropagation()}>
            <div className="theme-header">
              <button className="theme-btn-back" onClick={() => setColorPicker({ isOpen: false, tipo: '', item: null })}> <CloseIcon /> </button>
              <div>
                <h1 style={{fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-main)', margin: 0, lineHeight: 1}}>Cor do Item</h1>
                <p style={{fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--brand)', margin: 0}}>APP GUIGO</p>
              </div>
            </div>
            <div className="theme-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', justifyItems: 'center' }}>
                {PALETA_CORES.map(cor => (
                  <button
                    key={cor}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: cor, border: '2px solid var(--surface)', cursor: 'pointer', transition: '0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
                    onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
                    onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                    onClick={() => {
                      setItemColors(prev => {
                        const novo = { ...prev };
                        if (!novo[colorPicker.tipo]) novo[colorPicker.tipo] = {};
                        novo[colorPicker.tipo][colorPicker.item] = cor;
                        return novo;
                      });
                      setColorPicker({ isOpen: false, tipo: '', item: null });
                    }}
                  />
                ))}
              </div>
              <button
                className="btn-secondary"
                style={{ marginTop: '20px', width: '100%', fontSize: '0.75rem' }}
                onClick={() => {
                  setItemColors(prev => {
                    const novo = { ...prev };
                    if (novo[colorPicker.tipo] && novo[colorPicker.tipo][colorPicker.item]) {
                      delete novo[colorPicker.tipo][colorPicker.item];
                    }
                    return novo;
                  });
                  setColorPicker({ isOpen: false, tipo: '', item: null });
                }}
              >
                Remover Cor Pessoal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP PARA ADICIONAR ITEM NA PLANILHA */}
      {isAddItemModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddItemModalOpen(false)}>
          <div className="theme-modal" onClick={e => e.stopPropagation()}>
            <div className="theme-header">
              <button className="theme-btn-back" onClick={() => setIsAddItemModalOpen(false)}> <CloseIcon /> </button>
              <div>
                <h1 style={{fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-main)', margin: 0, lineHeight: 1}}>Novo Item</h1>
                <p style={{fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--brand)', margin: 0}}>APP GUIGO</p>
              </div>
            </div>
            <div className="theme-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input type="text" className="form-input" placeholder="Nome do item (Ex: Mercado)" value={novoItemNome} onChange={(e) => setNovoItemNome(e.target.value)} autoFocus />
                <select className="form-select" value={novoItemTipo} onChange={(e) => setNovoItemTipo(e.target.value)}>
                  <option value="Rendas">Rendas</option>
                  <option value="Gastos">Despesas</option>
                  <option value="Investimentos">Investimentos</option>
                  {Object.keys(categoryConfigs).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '10px' }}>Cor do Item (Opcional):</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', justifyItems: 'center' }}>
                  {PALETA_CORES.map(cor => (
                    <button
                      key={`itemCor-${cor}`}
                      style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: cor, border: novoItemCor === cor ? '3px solid var(--text-main)' : '2px solid var(--surface)', cursor: 'pointer', transition: '0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
                      onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
                      onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                      onClick={() => setNovoItemCor(cor)}
                    />
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setIsAddItemModalOpen(false)}>Cancelar</button>
                <button className="btn-primary" onClick={adicionarItem}>Adicionar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP PARA CRIAR NOVA CATEGORIA */}
      {isAddCategoryModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddCategoryModalOpen(false)}>
          <div className="theme-modal" onClick={e => e.stopPropagation()}>
            <div className="theme-header">
              <button className="theme-btn-back" onClick={() => setIsAddCategoryModalOpen(false)}> <CloseIcon /> </button>
              <div>
                <h1 style={{fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-main)', margin: 0, lineHeight: 1}}>Nova Categoria</h1>
                <p style={{fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--brand)', margin: 0}}>APP GUIGO</p>
              </div>
            </div>
            <div className="theme-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input type="text" className="form-input" placeholder="Nome da Categoria (Ex: Viagem)" value={novaCatNome} onChange={(e) => setNovaCatNome(e.target.value)} autoFocus />
                <select className="form-select" value={novaCatOp} onChange={(e) => setNovaCatOp(e.target.value)}>
                  <option value="soma">Entrada (Soma ao Saldo)</option>
                  <option value="subtracao">Saída (Subtrai do Saldo)</option>
                </select>
                
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '10px' }}>Cor da Categoria:</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', justifyItems: 'center' }}>
                  {PALETA_CORES.map(cor => (
                    <button
                      key={`catCor-${cor}`}
                      style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: cor, border: novaCatCor === cor ? '3px solid var(--text-main)' : '2px solid var(--surface)', cursor: 'pointer', transition: '0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
                      onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
                      onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                      onClick={() => setNovaCatCor(cor)}
                    />
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setIsAddCategoryModalOpen(false)}>Cancelar</button>
                <button className="btn-primary" onClick={adicionarCategoria}>Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP PARA ADICIONAR CONTA COMPARTILHADA */}
      {isAddSharedModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddSharedModalOpen(false)}>
          <div className="theme-modal" onClick={e => e.stopPropagation()}>
            <div className="theme-header">
              <button className="theme-btn-back" onClick={() => setIsAddSharedModalOpen(false)}> <CloseIcon /> </button>
              <div>
                <h1 style={{fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-main)', margin: 0, lineHeight: 1}}>Nova Conta</h1>
                <p style={{fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--brand)', margin: 0}}>APP GUIGO</p>
              </div>
            </div>
            <div className="theme-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input type="text" className="form-input" placeholder="Nome do Item" value={sharedTitle} onChange={(e) => setSharedTitle(e.target.value)} autoFocus />
                <input type="text" className="form-input" placeholder="Valor (R$ 0,00)" value={sharedAmount} onChange={(e) => setSharedAmount(e.target.value.replace(/[^0-9.,]/g, ''))} />
                <input type="text" className="form-input" placeholder="Descrição do item" value={sharedDescription} onChange={(e) => setSharedDescription(e.target.value)} />
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select className="form-select" value={sharedPaidBy} onChange={(e) => setSharedPaidBy(e.target.value)}>
                    {appUsers.map(u => (
                      <option key={u.username} value={u.username}>{u.name} pagou</option>
                    ))}
                  </select>
                  <select className="form-select" value={sharedSplitMode} onChange={(e) => setSharedSplitMode(e.target.value)}>
                    <option value="50_50">Dividir 50% / 50%</option>
                    <option value="100">100%</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setIsAddSharedModalOpen(false)}>Cancelar</button>
                <button className="btn-primary" onClick={handleSaveSharedExpense}>Adicionar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL "TE DEVE" PARA QUITAR COMPARTILHADOS */}
      {settleModalOpen && (
        <div className="modal-overlay" onClick={() => setSettleModalOpen(false)}>
          <div className="theme-modal" onClick={e => e.stopPropagation()}>
            <div className="theme-header">
              <button className="theme-btn-back" onClick={() => setSettleModalOpen(false)}> <CloseIcon /> </button>
              <div>
                <h1 style={{fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-main)', margin: 0, lineHeight: 1}}>Pendentes</h1>
                <p style={{fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--brand)', margin: 0}}>APP GUIGO</p>
              </div>
            </div>
            <div className="theme-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredSharedExpenses.filter(e => !e.is_settled).map(exp => {
                   const payerName = exp.paid_by === loggedUser ? 'Eu' : (appUsers.find(u => u.username === exp.paid_by)?.name || exp.paid_by);
                   return (
                     <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                       <div>
                         <strong style={{ fontSize: '0.8rem', color: 'var(--text-main)', display: 'block' }}>{exp.title}</strong>
                         <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{payerName} pagou • {formatarMoeda(exp.amount)}</span>
                       </div>
                     </div>
                   );
                })}
                {filteredSharedExpenses.filter(e => !e.is_settled).length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>Não há contas pendentes.</p>}
              </div>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setSettleModalOpen(false)}>Fechar</button>
                {filteredSharedExpenses.filter(e => !e.is_settled).length > 0 && (
                  <button 
                    className="btn-primary" 
                    style={{ background: 'var(--green)' }} 
                    onClick={async () => {
                      const ids = filteredSharedExpenses.filter(e => !e.is_settled).map(e => e.id);
                      setSharedExpenses(prev => prev.map(e => ids.includes(e.id) ? { ...e, is_settled: true } : e));
                      await supabase.from('shared_expenses').update({ is_settled: true }).in('id', ids);
                      setSettleModalOpen(false);
                    }}
                  >
                    Quitar Tudo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="app-container">
        <header className="header">
          <div className="header-left">
            <div style={{ position: 'relative' }}>
              <button className="avatar-btn" onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
                <GuigoIcon />
              </button>
              
              {isProfileMenuOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setIsProfileMenuOpen(false)}></div>
                  <div className="profile-menu" style={{ zIndex: 100 }}>
                    <div className="profile-menu-header">
                      <span className="profile-menu-name">Olá, {loggedName || loggedUser}</span>
                    </div>
                    <button className="profile-menu-item" onClick={() => { setIsThemeModalOpen(true); setIsProfileMenuOpen(false); }}>
                      Tema
                    </button>
                    <button className="profile-menu-item" onClick={() => { 
                       setEditProfileName(loggedName || loggedUser);
                       setEditProfileUser(loggedUser);
                       setEditProfilePass(''); 
                       setIsProfileEditModalOpen(true); 
                       setIsProfileMenuOpen(false); 
                    }}>
                      Editar Perfil
                    </button>
                    <button className="profile-menu-item danger" onClick={handleLogout}>
                      Sair
                    </button>
                  </div>
                </>
              )}
            </div>
            <div className="logo">
              <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>
                 {abaAtual === 'lancamentos' ? 'Planilha' : (abaAtual === 'compartilhados' ? 'Compartilhados' : 'Visão Geral')}
              </span>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.7)', letterSpacing: '0.5px' }}>APP GUIGO</span>
            </div>
            {isLoading && <span style={{ marginLeft: 15, fontSize: '0.7rem', opacity: 0.8, fontWeight: 700, color: 'var(--header-text)' }}>Sincronizando...</span>}
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
                <div>
                  <select 
                    className="form-select" 
                    style={{ fontWeight: 800, color: 'var(--brand)' }}
                    value={anoSelecionado} 
                    onChange={(e) => setAnoSelecionado(Number(e.target.value))}
                  >
                    {listaAnos.map(ano => <option key={ano} value={ano}>Ano: {ano}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <button className="btn-primary" onClick={() => setIsAddCategoryModalOpen(true)}>+ Categoria</button>
                  <button className="btn-primary" onClick={() => setIsAddItemModalOpen(true)}>+ Item</button>
                </div>
              </div>

              <div className="table-container hide-scroll" ref={tableContainerRef}>
                <table>
                  <colgroup>
                    <col style={{ width: '16%', minWidth: '180px' }} />
                    {meses.map(mes => <col key={`col-${mes}`} style={{ width: '7%', minWidth: '90px' }} />)}
                  </colgroup>
                  
                  <thead>
                    <tr>
                      <th className="sticky-col">Categorias</th>
                      {meses.map(mes => <th key={mes}>{mes}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {/* RENDAS */}
                    <tr className="section-title section-rendas">
                      <td className="sticky-col">
                        <span style={{ display: 'flex', alignItems: 'center' }}><span style={{ marginRight: '8px', fontSize: '0.8rem' }}>↗</span> Rendas</span>
                      </td>
                      <td colSpan={12} className="filler-cell" style={{ textAlign: 'right', paddingRight: '1rem', verticalAlign: 'middle' }}>
                        {selectionMode === 'Rendas' ? (
                          <div style={{display: 'inline-flex', gap: '0.4rem'}}>
                            <button onClick={() => agruparSelecionados('Rendas')} className="badge badge-guigo" style={{cursor:'pointer', border:'none', padding:'4px 8px'}}>Agrupar</button>
                            <button onClick={() => desagruparSelecionados('Rendas')} className="badge" style={{background: 'var(--border-dark)', color: 'var(--text-main)', cursor:'pointer', border:'none', padding:'4px 8px'}}>Desagrupar</button>
                            <button onClick={() => deleteSelected('Rendas')} className="badge badge-favu" style={{cursor:'pointer', border:'none', padding:'4px 8px'}}>Apagar</button>
                            <button onClick={() => {setSelectionMode(null); setSelectedItems([])}} style={{background:'transparent', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'0.7rem', padding:'2px'}}>✕</button>
                          </div>
                        ) : (
                          <button onClick={() => setSelectionMode('Rendas')} style={{background:'transparent', border:'1px solid var(--border-dark)', color:'var(--text-muted)', borderRadius:'4px', padding:'4px 10px', fontSize:'0.55rem', cursor:'pointer', textTransform:'uppercase', fontWeight:800}}>Selecionar</button>
                        )}
                      </td>
                    </tr>
                    {renderizarLinhasTabela('Rendas', categorias.Rendas, 'var(--green)')}
                    
                    {showFaltaReceber && (
                      <tr className="subtotals-drawer-row drawer-rendas">
                        <td className="sticky-col" style={{color: 'var(--green)'}}>FALTA RECEBER</td>
                        {meses.map(mes => <td key={`pendR-${mes}`} style={{color: 'var(--green)'}}>{formatarMoeda(calcularTotal(mes, categorias.Rendas, 'pendentes'))}</td>)}
                      </tr>
                    )}
                    <tr className="category-total-row" onClick={() => setShowFaltaReceber(!showFaltaReceber)} title="Clique para ver o valor que falta receber">
                      <td className="sticky-col" style={{color: 'var(--green)'}}>
                        TOTAL RENDAS <span style={{fontSize: '0.4rem', marginLeft: '5px'}}>{showFaltaReceber ? '▼' : '▲'}</span>
                      </td>
                      {meses.map(mes => <td key={`subR-${mes}`} style={{color: 'var(--green)'}}>{formatarMoeda(calcularTotal(mes, categorias.Rendas, 'todos'))}</td>)}
                    </tr>
                    
                    <tr className="spacer-row"><td className="sticky-col"></td><td colSpan={12}></td></tr>

                    {/* DESPESAS */}
                    <tr className="section-title section-gastos">
                      <td className="sticky-col">
                        <span style={{ display: 'flex', alignItems: 'center' }}><span style={{ marginRight: '8px', fontSize: '0.8rem' }}>↘</span> Despesas</span>
                      </td>
                      <td colSpan={12} className="filler-cell" style={{ textAlign: 'right', paddingRight: '1rem', verticalAlign: 'middle' }}>
                        {selectionMode === 'Gastos' ? (
                          <div style={{display: 'inline-flex', gap: '0.4rem'}}>
                            <button onClick={() => agruparSelecionados('Gastos')} className="badge badge-guigo" style={{cursor:'pointer', border:'none', padding:'4px 8px'}}>Agrupar</button>
                            <button onClick={() => desagruparSelecionados('Gastos')} className="badge" style={{background: 'var(--border-dark)', color: 'var(--text-main)', cursor:'pointer', border:'none', padding:'4px 8px'}}>Desagrupar</button>
                            <button onClick={() => deleteSelected('Gastos')} className="badge badge-favu" style={{cursor:'pointer', border:'none', padding:'4px 8px'}}>Apagar</button>
                            <button onClick={() => {setSelectionMode(null); setSelectedItems([])}} style={{background:'transparent', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'0.7rem', padding:'2px'}}>✕</button>
                          </div>
                        ) : (
                          <button onClick={() => setSelectionMode('Gastos')} style={{background:'transparent', border:'1px solid var(--border-dark)', color:'var(--text-muted)', borderRadius:'4px', padding:'4px 10px', fontSize:'0.55rem', cursor:'pointer', textTransform:'uppercase', fontWeight:800}}>Selecionar</button>
                        )}
                      </td>
                    </tr>
                    {renderizarLinhasTabela('Gastos', categorias.Gastos, 'var(--red)')}
                    
                    {showFaltaPagar && (
                      <tr className="subtotals-drawer-row drawer-despesas">
                        <td className="sticky-col" style={{color: 'var(--red)'}}>FALTA PAGAR</td>
                        {meses.map(mes => <td key={`pendD-${mes}`} style={{color: 'var(--red)'}}>{formatarMoeda(calcularTotal(mes, categorias.Gastos, 'pendentes'))}</td>)}
                      </tr>
                    )}
                    <tr className="category-total-row" onClick={() => setShowFaltaPagar(!showFaltaPagar)} title="Clique para ver o valor que falta pagar">
                      <td className="sticky-col" style={{color: 'var(--red)'}}>
                        TOTAL DESPESAS <span style={{fontSize: '0.4rem', marginLeft: '5px'}}>{showFaltaPagar ? '▼' : '▲'}</span>
                      </td>
                      {meses.map(mes => <td key={`subD-${mes}`} style={{color: 'var(--red)'}}>{formatarMoeda(calcularTotal(mes, categorias.Gastos, 'todos'))}</td>)}
                    </tr>
                    
                    <tr className="spacer-row"><td className="sticky-col"></td><td colSpan={12}></td></tr>

                    {/* INVESTIMENTOS */}
                    <tr className="section-title section-invest">
                      <td className="sticky-col">
                        <span style={{ display: 'flex', alignItems: 'center' }}><span style={{ marginRight: '8px', fontSize: '0.8rem' }}>❖</span> Investimentos</span>
                      </td>
                      <td colSpan={12} className="filler-cell" style={{ textAlign: 'right', paddingRight: '1rem', verticalAlign: 'middle' }}>
                        {selectionMode === 'Investimentos' ? (
                          <div style={{display: 'inline-flex', gap: '0.4rem'}}>
                            <button onClick={() => agruparSelecionados('Investimentos')} className="badge badge-guigo" style={{cursor:'pointer', border:'none', padding:'4px 8px'}}>Agrupar</button>
                            <button onClick={() => desagruparSelecionados('Investimentos')} className="badge" style={{background: 'var(--border-dark)', color: 'var(--text-main)', cursor:'pointer', border:'none', padding:'4px 8px'}}>Desagrupar</button>
                            <button onClick={() => deleteSelected('Investimentos')} className="badge badge-favu" style={{cursor:'pointer', border:'none', padding:'4px 8px'}}>Apagar</button>
                            <button onClick={() => {setSelectionMode(null); setSelectedItems([])}} style={{background:'transparent', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'0.7rem', padding:'2px'}}>✕</button>
                          </div>
                        ) : (
                          <button onClick={() => setSelectionMode('Investimentos')} style={{background:'transparent', border:'1px solid var(--border-dark)', color:'var(--text-muted)', borderRadius:'4px', padding:'4px 10px', fontSize:'0.55rem', cursor:'pointer', textTransform:'uppercase', fontWeight:800}}>Selecionar</button>
                        )}
                      </td>
                    </tr>
                    {renderizarLinhasTabela('Investimentos', categorias.Investimentos, 'var(--blue)')}
                    
                    {showFaltaInvestir && (
                      <tr className="subtotals-drawer-row drawer-invest">
                        <td className="sticky-col" style={{color: 'var(--blue)'}}>FALTA INVESTIR</td>
                        {meses.map(mes => <td key={`pendI-${mes}`} style={{color: 'var(--blue)'}}>{formatarMoeda(calcularTotal(mes, categorias.Investimentos, 'pendentes'))}</td>)}
                      </tr>
                    )}
                    <tr className="category-total-row" onClick={() => setShowFaltaInvestir(!showFaltaInvestir)} title="Clique para ver o valor que falta investir">
                      <td className="sticky-col" style={{color: 'var(--blue)'}}>
                        TOTAL INVESTIMENTOS <span style={{fontSize: '0.4rem', marginLeft: '5px'}}>{showFaltaInvestir ? '▼' : '▲'}</span>
                      </td>
                      {meses.map(mes => <td key={`subI-${mes}`} style={{color: 'var(--blue)'}}>{formatarMoeda(calcularTotal(mes, categorias.Investimentos, 'todos'))}</td>)}
                    </tr>
                    
                    <tr className="spacer-row"><td className="sticky-col"></td><td colSpan={12}></td></tr>

                    {/* CATEGORIAS CUSTOMIZADAS DINÂMICAS */}
                    {Object.keys(categoryConfigs).map(catNome => {
                      const config = categoryConfigs[catNome];
                      const isSoma = config.operacao === 'soma';
                      const symbol = isSoma ? '↗' : '↘';

                      return (
                        <React.Fragment key={catNome}>
                          <tr className="section-title">
                            <td className="sticky-col" style={{ backgroundColor: `${config.cor}1A`, color: config.cor, borderTop: '1px solid var(--border)' }}>
                              <span style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ marginRight: '8px', fontSize: '0.8rem' }}>{symbol}</span> {catNome}
                              </span>
                            </td>
                            <td colSpan={12} className="filler-cell" style={{ backgroundColor: `${config.cor}1A`, borderTop: '1px solid var(--border)', textAlign: 'right', paddingRight: '1rem', verticalAlign: 'middle' }}>
                              {selectionMode === catNome ? (
                                <div style={{display: 'inline-flex', gap: '0.4rem'}}>
                                  <button onClick={() => agruparSelecionados(catNome)} className="badge badge-guigo" style={{cursor:'pointer', border:'none', padding:'4px 8px'}}>Agrupar</button>
                                  <button onClick={() => desagruparSelecionados(catNome)} className="badge" style={{background: 'var(--border-dark)', color: 'var(--text-main)', cursor:'pointer', border:'none', padding:'4px 8px'}}>Desagrupar</button>
                                  <button onClick={() => deleteSelected(catNome)} className="badge badge-favu" style={{cursor:'pointer', border:'none', padding:'4px 8px'}}>Apagar</button>
                                  <button onClick={() => {setSelectionMode(null); setSelectedItems([])}} style={{background:'transparent', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'0.7rem', padding:'2px'}}>✕</button>
                                </div>
                              ) : (
                                <button onClick={() => setSelectionMode(catNome)} style={{background:'transparent', border:'1px solid var(--border-dark)', color:'var(--text-muted)', borderRadius:'4px', padding:'4px 10px', fontSize:'0.55rem', cursor:'pointer', textTransform:'uppercase', fontWeight:800}}>Selecionar</button>
                              )}
                            </td>
                          </tr>
                          {renderizarLinhasTabela(catNome, categorias[catNome], config.cor)}
                          
                          {showFaltaCustom[catNome] && (
                            <tr className="subtotals-drawer-row">
                              <td className="sticky-col" style={{color: config.cor}}>FALTA {catNome.toUpperCase()}</td>
                              {meses.map(mes => <td key={`pendC-${catNome}-${mes}`} style={{color: config.cor}}>{formatarMoeda(calcularTotal(mes, categorias[catNome], 'pendentes'))}</td>)}
                            </tr>
                          )}

                          <tr className="category-total-row" style={{height: '38px'}} onClick={() => toggleFaltaCustom(catNome)} title={`Clique para ver o que falta em ${catNome}`}>
                            <td className="sticky-col" style={{color: config.cor}}>
                              TOTAL {catNome.toUpperCase()} <span style={{fontSize: '0.4rem', marginLeft: '5px'}}>{showFaltaCustom[catNome] ? '▼' : '▲'}</span>
                            </td>
                            {meses.map(mes => <td key={`subC-${catNome}-${mes}`} style={{color: config.cor}}>{formatarMoeda(calcularTotal(mes, categorias[catNome], 'todos'))}</td>)}
                          </tr>
                          <tr className="spacer-row"><td className="sticky-col"></td><td colSpan={12}></td></tr>
                        </React.Fragment>
                      );
                    })}

                    {/* SALDO CONFIRMADO */}
                    {showSaldoConfirmado && (
                      <tr className="subtotals-drawer-row">
                        <td className="sticky-col" style={{ color: 'var(--brand)', backgroundColor: 'var(--surface)', borderTop: '1px solid var(--border-dark)', position: 'sticky', bottom: '50px', zIndex: 60 }}>
                           SALDO CONFIRMADO
                        </td>
                        {meses.map(mes => {
                          const saldoConf = calcularSaldoMensal(mes, 'validados');
                          return (
                            <td key={`conf-${mes}`} style={{ color: saldoConf < 0 ? 'var(--red)' : (saldoConf > 0 ? 'var(--green)' : 'var(--text-muted)'), backgroundColor: 'var(--surface)', borderTop: '1px solid var(--border-dark)', position: 'sticky', bottom: '50px', zIndex: 40 }}>
                              {formatarMoeda(saldoConf)}
                            </td>
                          );
                        })}
                      </tr>
                    )}

                    {/* SALDO MENSAL */}
                    <tr className="totals-row">
                      <td className="sticky-col" style={{ color: 'var(--text-main)' }}>
                        SALDO MENSAL
                      </td>
                      {meses.map(mes => {
                        const saldo = calcularSaldoMensal(mes, 'todos');
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
              <div className="dash-header-bar" style={{ display: 'none' }}></div>

              <div className="dash-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="card">
                  <div className="card-top">
                    <span className="card-label">VOCÊ PAGOU</span>
                  </div>
                  <span className="card-value" style={{color: 'var(--text-main)'}}>{formatarMoeda(splitwiseData.myPaidTotal)}</span>
                </div>
                
                <div 
                  className={`card debt-card ${splitwiseData.myBalance < 0 ? 'clickable' : ''}`} 
                  style={{ 
                    background: splitwiseData.myBalance > 0 ? 'var(--green)' : (splitwiseData.myBalance < 0 ? 'var(--red)' : 'var(--surface)'),
                    color: splitwiseData.myBalance !== 0 ? 'white' : 'var(--text-main)',
                    cursor: splitwiseData.myBalance !== 0 ? 'pointer' : 'default'
                  }}
                  onClick={() => {
                    if (splitwiseData.myBalance !== 0) setSettleModalOpen(true);
                  }}
                  title={splitwiseData.myBalance !== 0 ? "Clique para gerenciar itens pendentes" : ""}
                >
                  <div className="card-top" style={{ minHeight: '14px' }}>
                    <span className="card-label" style={{ color: splitwiseData.myBalance !== 0 ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {splitwiseData.myBalance > 0 ? `${splitwiseData.partnerName} TE DEVE` : 
                      (splitwiseData.myBalance < 0 ? `VOCÊ DEVE A ${splitwiseData.partnerName} (PAGAR)` : 'SALDO DEVEDOR')}
                    </span>
                  </div>
                  <span className="card-value" style={{ color: splitwiseData.myBalance !== 0 ? 'white' : 'var(--text-main)' }}>
                    {formatarMoeda(Math.abs(splitwiseData.myBalance))}
                  </span>
                </div>
              </div>

              <div className="controls-card">
                <div style={{ display: 'flex', gap: '1rem', width: isMobile ? '100%' : 'auto' }}>
                  <select className="form-select" value={filterMesShared} onChange={e => setFilterMesShared(e.target.value)} style={{ fontWeight: 800, color: 'var(--brand)', backgroundColor: 'var(--surface)' }}>
                    <option value="Todos">Mês: Todos</option>
                    {meses.map((m, i) => <option key={m} value={mesesNum[i]}>{m}</option>)}
                  </select>
                  <select className="form-select" value={filterAnoShared} onChange={e => setFilterAnoShared(e.target.value)} style={{ fontWeight: 800, color: 'var(--brand)', backgroundColor: 'var(--surface)' }}>
                    <option value="Todos">Ano: Todos</option>
                    {listaAnos.map(ano => <option key={ano} value={ano}>{ano}</option>)}
                  </select>
                </div>
                <div>
                  <button className="btn-primary" onClick={() => setIsAddSharedModalOpen(true)}>
                    + Add Conta
                  </button>
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
                      <th style={{width: '40px', textAlign: 'center'}}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSharedExpenses.length === 0 ? (
                      <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Nenhuma despesa listada.</td></tr>
                    ) : (
                      filteredSharedExpenses.map(exp => (
                        <tr key={exp.id} className={exp.is_settled ? 'settled' : ''}>
                          <td data-label="Data" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                             <input type="text" className="item-name-input" defaultValue={exp.date} onBlur={e => updateSharedField(exp.id, 'date', e.target.value)} />
                          </td>
                          <td data-label="Item">
                            <input type="text" className="item-name-input" defaultValue={exp.title} onBlur={e => updateSharedField(exp.id, 'title', e.target.value)} />
                          </td>
                          <td data-label="Descrição">
                            <input type="text" className="item-name-input" style={{color: 'var(--text-muted)'}} defaultValue={exp.description || exp.desc} onBlur={e => updateSharedField(exp.id, 'description', e.target.value)} />
                          </td>
                          <td data-label="Quem Pagou?">
                            <select className="item-name-input" value={exp.paid_by} onChange={e => updateSharedField(exp.id, 'paid_by', e.target.value)}>
                              {appUsers.map(u => (
                                <option key={u.username} value={u.username}>{u.name}</option>
                              ))}
                            </select>
                          </td>
                          <td data-label="Divisão">
                            <select className="item-name-input" value={exp.split_mode} onChange={e => updateSharedField(exp.id, 'split_mode', e.target.value)}>
                              <option value="50_50">50%</option>
                              <option value="100">100%</option>
                            </select>
                          </td>
                          <td data-label="Valor (R$)">
                            <input 
                              type="text" 
                              className="item-name-input" 
                              style={{ fontWeight: 700, color: 'var(--red)' }} 
                              defaultValue={formatarMoeda(exp.amount)} 
                              onBlur={e => {
                                const val = parseFloat(e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.'));
                                if(!isNaN(val)) updateSharedField(exp.id, 'amount', val);
                              }}
                            />
                          </td>
                          <td data-label="Ações" className="action-cell" style={{textAlign: 'center', borderBottom: 'none'}}>
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
              <div className="dash-header-bar sticky-dash-header">
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand)', margin: 0 }}></h2>
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
                    <span className="card-label" style={{color: 'var(--green)'}}>RENDAS</span>
                    <div className="card-icon" style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>↗</div>
                  </div>
                  <span className="card-value" style={{color:'var(--green)'}}>{formatarMoeda(meses.reduce((acc, mes) => acc + calcularTotal(mes, categorias.Rendas, true), 0))}</span>
                </div>

                <div className="card">
                  <div className="card-top">
                    <span className="card-label" style={{color: 'var(--red)'}}>DESPESAS</span>
                    <div className="card-icon" style={{ background: 'var(--red-bg)', color: 'var(--red)' }}>↘</div>
                  </div>
                  <span className="card-value" style={{color:'var(--red)'}}>{formatarMoeda(meses.reduce((acc, mes) => acc + calcularTotal(mes, categorias.Gastos, true), 0))}</span>
                </div>

                <div className="card">
                  <div className="card-top">
                    <span className="card-label" style={{color: 'var(--blue)'}}>INVESTIMENTOS</span>
                    <div className="card-icon" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>❖</div>
                  </div>
                  <span className="card-value" style={{color:'var(--blue)'}}>{formatarMoeda(meses.reduce((acc, mes) => acc + calcularTotal(mes, categorias.Investimentos, true), 0))}</span>
                </div>
                
                {Object.keys(categoryConfigs).map(cat => (
                  <div className="card" key={`dash-${cat}`}>
                     <div className="card-top">
                       <span className="card-label" style={{color: categoryConfigs[cat].cor}}>{cat.toUpperCase()}</span>
                       <div className="card-icon" style={{ background: `${categoryConfigs[cat].cor}22`, color: categoryConfigs[cat].cor }}>
                         {categoryConfigs[cat].operacao === 'soma' ? '↗' : '↘'}
                       </div>
                     </div>
                     <span className="card-value" style={{color: categoryConfigs[cat].cor}}>
                       {formatarMoeda(meses.reduce((acc, mes) => acc + calcularTotal(mes, categorias[cat], true), 0))}
                     </span>
                  </div>
                ))}

                <div className="card" style={{ background: meses.reduce((acc, mes) => acc + calcularSaldoMensal(mes, true), 0) >= 0 ? 'var(--green)' : 'var(--red)', border: 'none' }}>
                  <div className="card-top">
                    <span className="card-label" style={{ color: 'rgba(255,255,255,0.8)' }}>SALDO FINAL</span>
                    <div className="card-icon" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>💳</div>
                  </div>
                  <span className="card-value" style={{ color: 'white' }}>
                    {formatarMoeda(meses.reduce((acc, mes) => acc + calcularSaldoMensal(mes, true), 0))}
                  </span>
                </div>
              </div>

              <div className="chart-card">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={meses.map(mes => {
                    const d = {
                      mes: mes,
                      Receita: calcularTotal(mes, categorias.Rendas, true),
                      Despesa: calcularTotal(mes, categorias.Gastos, true),
                      Investimento: calcularTotal(mes, categorias.Investimentos, true),
                    };
                    Object.keys(categoryConfigs).forEach(cat => {
                        d[cat] = calcularTotal(mes, categorias[cat], true);
                    });
                    return d;
                  })} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={(val) => `R$ ${val}`} dx={-10} />
                    <Tooltip formatter={(value) => formatarMoeda(value)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <Legend verticalAlign="bottom" align="center" wrapperStyle={{ display: 'flex', justifyContent: 'center', gap: '2rem', width: '100%', fontSize: '11px', fontWeight: 800, paddingTop: '20px', flexWrap: 'wrap' }} />
                    
                    <Line type="monotone" name="Rendas" dataKey="Receita" stroke="var(--green)" strokeWidth={3} dot={{r:4, strokeWidth: 2}} activeDot={{r: 6}} isAnimationActive={false} />
                    <Line type="monotone" name="Despesas" dataKey="Despesa" stroke="var(--red)" strokeWidth={3} dot={{r:4, strokeWidth: 2}} isAnimationActive={false} />
                    <Line type="monotone" name="Investimentos" dataKey="Investimento" stroke="var(--blue)" strokeWidth={3} dot={{r:4, strokeWidth: 2}} isAnimationActive={false} />
                    
                    {Object.keys(categoryConfigs).map(cat => (
                      <Line key={cat} type="monotone" name={cat} dataKey={cat} stroke={categoryConfigs[cat].cor} strokeWidth={3} dot={{r:4, strokeWidth: 2}} isAnimationActive={false} />
                    ))}
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
