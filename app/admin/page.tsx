'use client';
import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, updateDoc, doc, query, orderBy, setDoc, getDoc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { Pizza, LogOut, CheckCircle, Clock, Truck, XCircle, ArrowRight, Home, Settings, Megaphone, Save, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  platform: string;
  status: 'pending' | 'preparing' | 'dispatched' | 'completed' | 'cancelled';
  createdAt: number;
}

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  preparing: 'bg-orange-100 text-orange-800 border-orange-200',
  dispatched: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

const STATUS_LABELS = {
  pending: 'Pendente',
  preparing: 'Preparando',
  dispatched: 'Enviado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [promoText, setPromoText] = useState('');
  const [isSavingPromo, setIsSavingPromo] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsLoading(false);
      // Fetch promo on login
      if (u) {
        getDoc(doc(db, 'settings', 'promo')).then((docSnapshot) => {
          if (docSnapshot.exists()) {
             setPromoText(docSnapshot.data().text || '');
          }
        });
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
    }, (error) => {
      console.error('Error fetching orders:', error);
    });
    
    return () => unsub();
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      console.error('Login error:', e);
      if (e.code === 'auth/operation-not-allowed') {
        setLoginError('Habilite o provedor "Google" no Firebase Console (Authentication > Sign-in method).');
      } else if (e.code === 'auth/unauthorized-domain') {
        setLoginError('Vá no Firebase Console > Authentication > Settings > Authorized domains, e adicione: ais-dev-yegsonfon3s2idi66n6maf-207687469383.us-east1.run.app');
      } else if (e.code === 'auth/popup-closed-by-user') {
        setLoginError('O login foi cancelado ou bloqueado pelo navegador. DICA: Verifique se o seu navegador está bloqueando pop-ups na barra de endereços (URL). Libere os pop-ups e tente novamente.');
      } else {
        setLoginError('Erro ao logar com Google: ' + e.message);
      }
    }
  };

  const savePromoText = async () => {
    setIsSavingPromo(true);
    try {
      await setDoc(doc(db, 'settings', 'promo'), { text: promoText });
      setIsSettingsOpen(false);
      alert('Promoção atualizada com sucesso!');
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar promoção.');
    } finally {
      setIsSavingPromo(false);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const updateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
    } catch (e) {
      console.error('Failed to update status', e);
      alert('Erro ao atualizar status.');
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-stone-50"><p>Carregando...</p></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center border border-stone-100">
          <Pizza className="w-16 h-16 text-orange-500 mx-auto mb-6" />
          <h1 className="text-2xl font-display font-bold text-stone-900 mb-2">Acesso Restrito</h1>
          <p className="text-stone-500 mb-6 text-sm">Faça login com o Google para acessar o painel.</p>

          {loginError && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-4 text-left border border-red-100 flex flex-col gap-3">
              <p>{loginError}</p>
            </div>
          )}

          <button 
            type="button"
            onClick={handleLogin}
            className="w-full bg-stone-900 hover:bg-stone-800 text-white font-medium py-3 rounded-xl transition-colors"
          >
            Entrar com Google
          </button>
          
          <Link href="/" className="inline-flex items-center gap-2 mt-6 text-sm text-stone-400 hover:text-stone-600">
            <ArrowRight className="w-4 h-4" /> Voltar ao Cardápio
          </Link>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Pizza className="w-6 h-6 text-orange-600" />
            <h1 className="text-xl font-display font-bold text-stone-800 tracking-tight">Peter Pizzas Admin</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSettingsOpen(true)} className="text-sm font-medium text-stone-500 hover:text-orange-600 flex items-center gap-2">
              <Megaphone className="w-4 h-4" /> <span className="hidden sm:inline">Promoções</span>
            </button>
            <div className="w-px h-6 bg-stone-200 hidden sm:block"></div>
            <Link href="/" className="text-sm font-medium text-stone-500 hover:text-stone-800 flex items-center gap-2 hidden sm:flex">
              <Home className="w-4 h-4" /> <span>Ver Site</span>
            </Link>
            <div className="w-px h-6 bg-stone-200 hidden sm:block"></div>
            <span className="text-sm text-stone-600 hidden sm:inline">Admin (softwork)</span>
            <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-2">
              <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6 items-start">
          {/* Columns for each status */}
          {(['pending', 'preparing', 'dispatched', 'completed', 'cancelled'] as Order['status'][]).map(status => (
            <div key={status} className="flex flex-col gap-3 min-h-[300px]">
              <div className={`px-4 py-3 rounded-xl font-semibold border text-sm flex justify-between items-center ${STATUS_COLORS[status]}`}>
                {STATUS_LABELS[status]}
                <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs">
                  {orders.filter(o => o.status === status).length}
                </span>
              </div>
              
              <div className="flex flex-col gap-3">
                <AnimatePresence>
                  {orders.filter(o => o.status === status).map(order => (
                    <motion.div
                      key={order.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-white p-4 rounded-xl shadow-sm border border-stone-200 flex flex-col group hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-stone-800 text-sm">{order.customerName}</h3>
                          <p className="text-xs text-stone-500">{order.customerPhone}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-1 bg-stone-100 rounded text-stone-600 uppercase tracking-widest">
                          {order.platform}
                        </span>
                      </div>
                      
                      <div className="bg-stone-50 p-2 rounded-lg mb-3">
                        <ul className="text-xs text-stone-600 space-y-1">
                          {order.items.map((item, idx) => (
                            <li key={idx} className="flex justify-between">
                              <span><span className="font-bold">{item.quantity}x</span> {item.name}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs text-stone-400">
                          {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="font-bold text-green-700 text-sm">R$ {order.totalAmount.toFixed(2)}</span>
                      </div>
                      
                      {/* Action Buttons based on status */}
                      <div className="flex gap-2 mt-auto">
                        {status === 'pending' && (
                          <>
                            <button onClick={() => updateStatus(order.id, 'preparing')} className="flex-1 bg-orange-100 hover:bg-orange-200 text-orange-800 text-xs py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1"><Clock className="w-3 h-3" /> Preparar</button>
                            <button onClick={() => updateStatus(order.id, 'cancelled')} className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><XCircle className="w-4 h-4" /></button>
                          </>
                        )}
                        {status === 'preparing' && (
                          <button onClick={() => updateStatus(order.id, 'dispatched')} className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1"><Truck className="w-3 h-3" /> Enviar</button>
                        )}
                        {status === 'dispatched' && (
                          <button onClick={() => updateStatus(order.id, 'completed')} className="flex-1 bg-green-100 hover:bg-green-200 text-green-800 text-xs py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3" /> Concluir</button>
                        )}
                        {(status === 'completed' || status === 'cancelled') && (
                          <p className="text-xs text-stone-400 text-center w-full italic">Finalizado</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {orders.filter(o => o.status === status).length === 0 && (
                  <div className="text-center p-6 border-2 border-dashed border-stone-200 rounded-xl text-stone-400 text-xs">
                    Vazio
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: 50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 50, opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl"
            >
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 bg-stone-100 hover:bg-stone-200 p-2 rounded-full transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3 mb-6">
                <Megaphone className="w-8 h-8 text-orange-500" />
                <h2 className="text-2xl font-display font-bold text-stone-900">Faixa de Promoções</h2>
              </div>
              
              <p className="text-stone-500 text-sm mb-4">Escreva a mensagem que vai rolar no topo do site para todos os clientes verem.</p>
              
              <textarea 
                value={promoText}
                onChange={(e) => setPromoText(e.target.value)}
                placeholder="Ex: 🍕 HOJE É DIA DE PROMOÇÃO! COMPRE 1 GANHE REFRI GRÁTIS!"
                className="w-full h-32 bg-stone-50 border border-stone-200 rounded-xl p-4 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all font-medium text-stone-800 resize-none mb-6"
              />
              
              <button 
                onClick={savePromoText}
                disabled={isSavingPromo}
                className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
              >
                {isSavingPromo ? 'Salvando...' : (
                  <>
                    <Save className="w-5 h-5" />
                    Salvar Faixa de Promoção
                  </>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
