'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { menuItems, menuCategories, MenuItem } from '@/data/menu';
import { ShoppingCart, Plus, Minus, Phone, Pizza, Store, ExternalLink, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CartItem extends MenuItem {
  quantity: number;
}

export default function MenuPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customItems, setCustomItems] = useState<MenuItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [addressReference, setAddressReference] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isPlatformModalOpen, setIsPlatformModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promoText, setPromoText] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'promo'), (doc) => {
      if (doc.exists()) {
        setPromoText(doc.data().text || '');
      }
    });
    
    const unsubMenu = onSnapshot(collection(db, 'custom_menu'), (snapshot) => {
      setCustomItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem)));
    });

    return () => { unsub(); unsubMenu(); }
  }, []);

  const allItems = [...menuItems, ...customItems];
  const allCategories = Array.from(new Set([...menuCategories, ...customItems.map(i => i.category)]));

  const handlePlatformClick = (platform: 'ifood' | '99food', webUrl: string) => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      if (platform === 'ifood') {
        const intentUrl = 'intent://delivery/duque-de-caxias-rj/peter-pizzas-pantanal/b782938f-8c5b-4e40-9a60-789181b4524b#Intent;scheme=https;package=br.com.brainweb.ifood;end';
        window.location.href = intentUrl;
        // Fallback for iOS or if intent fails
        setTimeout(() => {
           window.open(webUrl, '_blank');
        }, 1500);
      } else {
        window.open(webUrl, '_blank');
      }
    } else {
      window.open(webUrl, '_blank');
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const getPrice = (item: MenuItem) => item.priceWhatsapp || item.priceIfood;
  
  const cartTotal = cart.reduce((total, item) => total + (getPrice(item) * item.quantity), 0);
  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0 || !customerName || !customerPhone || !customerAddress || !paymentMethod) {
      alert('Por favor, preencha todos os campos obrigatórios e adicione itens ao carrinho.');
      return;
    }
    setIsSubmitting(true);
    
    try {
      const orderPayload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        paymentMethod: paymentMethod.trim(),
        addressReference: addressReference.trim(),
        orderNotes: orderNotes.trim(),
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: getPrice(item)
        })),
        totalAmount: cartTotal,
        platform: 'WhatsApp',
        status: 'pending',
        // eslint-disable-next-line react-hooks/purity
        createdAt: Date.now()
      };

      await addDoc(collection(db, 'orders'), orderPayload);
      
      const whatsAppNumber = '5521980483120';
      let message = `*Novo Pedido - Peter Pizzas*\\n\\n`;
      message += `*DADOS DO CLIENTE*\\n`;
      message += `Nome: ${customerName}\\n`;
      message += `Telefone: ${customerPhone}\\n`;
      message += `Endereço: ${customerAddress}\\n`;
      if (addressReference) message += `Ponto de Referência: ${addressReference}\\n`;
      message += `Forma de Pagamento: ${paymentMethod}\\n`;
      if (orderNotes) message += `Detalhes/Observações: ${orderNotes}\\n`;
      
      message += `\\n*ITENS DO PEDIDO:*\\n`;
      cart.forEach(item => {
        message += `${item.quantity}x ${item.name} - R$ ${(getPrice(item) * item.quantity).toFixed(2)}\\n`;
      });
      message += `\\n*TOTAL: R$ ${cartTotal.toFixed(2)}*\\n\\nObrigado!`;
      
      const whatsappUrl = `https://wa.me/${whatsAppNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      
      setCart([]);
      setIsCartOpen(false);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setPaymentMethod('');
      setAddressReference('');
      setOrderNotes('');
      
    } catch (e: any) {
      console.error(e);
      alert('Erro ao enviar o pedido: ' + e.message + '\n\nDICA: Se for erro de permissão (Missing or insufficient permissions), vá no Firebase Console > Firestore Database > Regras (Rules) e verifique se as regras estão corretas, ou se o banco de dados foi criado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-32 relative bg-stone-900">
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20 pointer-events-none"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070&auto=format&fit=crop")' }}
      ></div>
      <div className="relative z-10">
        <header className="bg-orange-600 text-white shadow-md sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <Pizza className="w-8 h-8 text-yellow-300" />
               <div>
                 <h1 className="text-2xl font-display font-bold uppercase tracking-tight">Peter Pizzas</h1>
                 <p className="text-xs text-orange-200 hidden sm:block">Sua pizza favorita, feita com carinho e qualidade!</p>
               </div>
            </div>
            <a href="/admin" className="text-xs bg-orange-700 hover:bg-orange-800 px-3 py-1.5 rounded-full transition-colors">Admin</a>
          </div>
          <div className="bg-yellow-400 text-yellow-950 text-center py-3 text-sm font-semibold px-4 flex justify-center items-center gap-2">
            <Phone className="w-5 h-5 flex-shrink-0" /> <span className="text-2xl md:text-3xl font-black tracking-tight drop-shadow-sm">(21) 98048-3120</span> <span className="hidden sm:inline ml-2">| PEDIDO DIRETO NA LOJA</span>
          </div>
          {promoText && (
            <div className="bg-orange-900 text-amber-100 overflow-hidden relative border-b-4 border-orange-800 py-3 shadow-inner">
              <div className="flex whitespace-nowrap animate-marquee items-center">
                <span className="mx-4 text-lg md:text-xl font-black tracking-widest flex items-center gap-3 uppercase">
                  <Zap className="w-6 h-6 text-yellow-400" fill="currentColor" />
                  {promoText}
                  <Zap className="w-6 h-6 text-yellow-400" fill="currentColor" />
                </span>
                <span className="mx-4 text-lg md:text-xl font-black tracking-widest flex items-center gap-3 uppercase" aria-hidden="true">
                  <Zap className="w-6 h-6 text-yellow-400" fill="currentColor" />
                  {promoText}
                  <Zap className="w-6 h-6 text-yellow-400" fill="currentColor" />
                </span>
              </div>
              <style jsx>{`
                @keyframes marquee {
                  0% { transform: translateX(100%); }
                  100% { transform: translateX(-100%); }
                }
                .animate-marquee {
                  animation: marquee 20s linear infinite;
                }
              `}</style>
            </div>
          )}
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8 relative">
          <div className="bg-white border border-amber-200 rounded-3xl p-5 mb-10 shadow-lg flex flex-col md:flex-row items-center justify-center gap-6 text-sm text-stone-700 backdrop-blur-sm bg-white/95">
             <button 
               onClick={() => setIsPlatformModalOpen(true)}
               className="flex items-center gap-2 hover:bg-orange-50 px-4 py-3 rounded-2xl transition-colors border border-transparent hover:border-orange-200 group font-bold text-orange-800"
             >
               <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div> 
               Plataformas (iFood / 99Food)
               <ExternalLink className="w-4 h-4 text-orange-400 group-hover:text-orange-600 transition-colors" />
             </button>
             <div className="flex items-center gap-2 px-4 py-3"><div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div> <strong className="text-lg">Pedido Direto (WhatsApp)</strong></div>
          </div>

          {allCategories.map(category => (
            <section key={category} className="mb-12">
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-3xl font-display font-black text-white drop-shadow-md uppercase tracking-wider">{category}</h2>
                <div className="flex-1 h-1 bg-gradient-to-r from-orange-500/50 to-transparent rounded-full"></div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {allItems.filter(item => item.category === category).sort((a, b) => a.name.localeCompare(b.name)).map(item => (
                  <div key={item.id} className="bg-white/95 backdrop-blur-sm rounded-3xl overflow-hidden shadow-xl border-2 border-stone-100 hover:border-amber-400 transition-all flex flex-col group hover:-translate-y-1">
                    <div className="relative h-48 w-full overflow-hidden bg-stone-200">
                      <Image 
                        src={`/image/${item.id}.jpg`} 
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                      {item.isNew && (
                        <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full animate-pulse shadow-md z-10">
                          NOVO!
                        </span>
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col pt-4">
                      <h3 className="font-bold text-stone-900 text-xl mb-2 leading-tight">{item.name}</h3>
                      {item.description && <p className="text-stone-600 font-medium text-sm mb-5 leading-relaxed flex-1">{item.description}</p>}
                      
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex flex-col">
                          <span className="text-stone-400 line-through text-sm font-semibold">R$ {item.priceIfood.toFixed(2)}</span>
                          <span className="text-green-600 font-black text-2xl drop-shadow-sm leading-none mt-1">R$ {getPrice(item).toFixed(2)}</span>
                        </div>
                        <button 
                          onClick={() => addToCart(item)}
                          className="bg-amber-100 hover:bg-amber-300 text-amber-900 rounded-2xl w-12 h-12 flex items-center justify-center transition-all shrink-0 hover:scale-110 shadow-sm border border-amber-200"
                        >
                          <Plus className="w-6 h-6 font-bold" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </main>
      </div>

      <AnimatePresence>
        {cartItemCount > 0 && !isCartOpen && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
          >
            <button 
              onClick={() => setIsCartOpen(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-4 font-semibold text-lg transition-transform hover:scale-105 active:scale-95 border-2 border-white"
            >
              <div className="relative">
                <ShoppingCart className="w-6 h-6" />
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-950 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartItemCount}
                </span>
              </div>
              Ver Carrinho — R$ {cartTotal.toFixed(2)}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 w-full max-w-lg mx-auto bg-white rounded-t-3xl shadow-2xl z-50 h-[85vh] flex flex-col"
            >
              <div className="p-4 text-center border-b border-stone-100 flex justify-between items-center bg-orange-50 rounded-t-3xl">
                <h2 className="font-display font-bold text-orange-950 text-xl">Seu Pedido</h2>
                <button onClick={() => setIsCartOpen(false)} className="text-orange-900 hover:text-orange-700 bg-orange-200/50 hover:bg-orange-200 px-3 py-1 rounded-full text-sm font-medium transition-colors">
                  Fechar
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center text-stone-500 py-10 flex flex-col items-center">
                    <ShoppingCart className="w-16 h-16 text-stone-200 mb-4" />
                    <p>Seu carrinho está vazio.</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-100 gap-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-stone-800">{item.name}</h4>
                        <p className="text-stone-500 text-sm">R$ {getPrice(item).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-3 bg-white border border-stone-200 rounded-lg p-1 shrink-0 self-start sm:self-auto">
                        <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors"><Minus className="w-4 h-4" /></button>
                        <span className="font-medium w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"><Plus className="w-4 h-4" /></button>
                      </div>
                      <div className="text-right font-semibold text-stone-700 w-20 shrink-0 self-start sm:self-auto pt-2 sm:pt-0">
                        R$ {(getPrice(item) * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
                
                {cart.length > 0 && (
                  <div className="pt-6 border-t border-stone-100 space-y-4 pb-4">
                    <h3 className="font-display font-semibold text-lg text-stone-800">Seus Dados</h3>
                    <input 
                      type="text" 
                      placeholder="Seu nome" 
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all font-medium text-stone-800"
                    />
                    <input 
                      type="tel" 
                      placeholder="Seu telefone (WhatsApp)" 
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all font-medium text-stone-800"
                    />
                    <input 
                      type="text" 
                      placeholder="Endereço para entrega" 
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all font-medium text-stone-800"
                    />
                    <input 
                      type="text" 
                      placeholder="Ponto de Referência (Opcional)" 
                      value={addressReference}
                      onChange={(e) => setAddressReference(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all font-medium text-stone-800 text-sm"
                    />
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all font-medium text-stone-800 appearance-none"
                    >
                      <option value="" disabled>Selecione a forma de pagamento</option>
                      <option value="Pix">Pix</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="Cartão de Débito">Cartão de Débito</option>
                    </select>
                    <textarea 
                      placeholder="Detalhes (Opcional) Ex: Troco para R$50, Tirar cebola..." 
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      rows={2}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all font-medium text-stone-800 text-sm resize-none"
                    />
                  </div>
                )}
              </div>

              <div className="p-4 bg-white border-t border-stone-100">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-stone-500">Total</span>
                  <span className="text-2xl font-bold text-green-700">R$ {cartTotal.toFixed(2)}</span>
                </div>
                <button 
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || isSubmitting}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-bold py-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Enviando...' : (
                    <>
                      <Phone className="w-5 h-5 fill-current" />
                      Enviar Pedido p/ WhatsApp
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPlatformModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPlatformModalOpen(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: 50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 50, opacity: 0, scale: 0.95 }}
              className="relative bg-yellow-400 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border-4 border-yellow-500"
            >
              <button 
                onClick={() => setIsPlatformModalOpen(false)}
                className="absolute top-4 right-4 text-yellow-900 bg-yellow-300 hover:bg-yellow-200 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <Pizza className="w-20 h-20 text-orange-600 mx-auto mb-6 drop-shadow-md" />
              <h2 className="text-3xl font-display font-black text-orange-950 mb-2 uppercase tracking-tight">Faça seu Pedido</h2>
              <p className="text-orange-900 font-medium mb-8">Escolha sua plataforma preferida para continuar</p>
              
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => handlePlatformClick('ifood', 'https://www.ifood.com.br/delivery/duque-de-caxias-rj/peter-pizzas-pantanal/b782938f-8c5b-4e40-9a60-789181b4524b')}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-lg py-4 px-6 rounded-2xl shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-3 w-full"
                >
                  <Store className="w-5 h-5" />
                  Pedir no iFood
                </button>
                
                <button 
                  onClick={() => handlePlatformClick('99food', 'https://99food.com/PeterPizzas')}
                  className="bg-white/50 hover:bg-white text-orange-950 font-bold text-lg py-4 px-6 rounded-2xl shadow-sm transition-all hover:scale-105 flex items-center justify-center gap-3 border-2 border-orange-500/50 hover:border-orange-500 w-full"
                >
                  <Store className="w-5 h-5" />
                  Pedir no 99Food
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
