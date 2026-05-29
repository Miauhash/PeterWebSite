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
      let message = `*Novo Pedido - Peter Pizzas*\n\n`;
      message += `*DADOS DO CLIENTE*\n`;
      message += `Nome: ${customerName}\n`;
      message += `Telefone: ${customerPhone}\n`;
      message += `Endereço: ${customerAddress}\n`;
      if (addressReference) message += `Ponto de Referência: ${addressReference}\n`;
      message += `Forma de Pagamento: ${paymentMethod}\n`;
      if (orderNotes) message += `Detalhes/Observações: ${orderNotes}\n`;
      
      message += `\n*ITENS DO PEDIDO:*\n`;
      cart.forEach(item => {
        message += `${item.quantity}x ${item.name} - R$ ${(getPrice(item) * item.quantity).toFixed(2)}\n`;
      });
      message += `\n*TOTAL: R$ ${cartTotal.toFixed(2)}*\n\nObrigado!`;
      
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
    <div className="min-h-screen pb-32 bg-[#FDFCF8] text-zinc-900 font-sans selection:bg-amber-200">
      <header className="bg-zinc-950 text-zinc-50 py-4 px-6 sticky top-0 z-40 shadow-sm border-b border-zinc-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
               <Pizza className="w-8 h-8 text-amber-500" />
               <div>
                 <h1 className="text-xl md:text-2xl font-display font-semibold tracking-wide uppercase text-white">Peter Pizzas</h1>
                 <p className="text-xs text-zinc-400 hidden sm:block tracking-wide">Qualidade & Tradição</p>
               </div>
          </div>
          <div className="flex items-center gap-6">
             <a href="tel:21980483120" className="hidden md:flex items-center gap-2 text-zinc-300 hover:text-white transition-colors">
               <Phone className="w-4 h-4" />
               <span className="text-sm font-medium tracking-wider">(21) 98048-3120</span>
             </a>
             <a href="/admin" className="text-xs border border-zinc-700 hover:bg-zinc-800 text-zinc-300 px-4 py-1.5 rounded-full transition-all">Peter</a>
          </div>
        </div>
      </header>

      {promoText && (
        <div className="bg-amber-500 text-amber-950 py-2.5 overflow-hidden relative shadow-sm">
          <div className="flex whitespace-nowrap animate-marquee items-center text-sm font-bold tracking-widest uppercase">
              <span className="mx-4 flex items-center gap-2"><Zap className="w-4 h-4" /> {promoText}</span>
              <span className="mx-4 flex items-center gap-2"><Zap className="w-4 h-4" /> {promoText}</span>
              <span className="mx-4 flex items-center gap-2"><Zap className="w-4 h-4" /> {promoText}</span>
              <span className="mx-4 flex items-center gap-2"><Zap className="w-4 h-4" /> {promoText}</span>
          </div>
          <style jsx>{`
            @keyframes marquee {
              0% { transform: translateX(0%); }
              100% { transform: translateX(-50%); }
            }
            .animate-marquee {
              animation: marquee 15s linear infinite;
            }
          `}</style>
        </div>
      )}

      <motion.section 
        className="relative w-full h-[55vh] min-h-[400px] flex justify-center items-center overflow-hidden bg-zinc-950"
      >
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.5 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat mix-blend-overlay"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?q=80&w=2070&auto=format&fit=crop")' }}
        ></motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/40 to-transparent z-0"></div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-8">
            <motion.h2 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl md:text-7xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-amber-500 tracking-tight mb-6 drop-shadow-xl"
            >
              A Verdadeira Arte da Pizza.
            </motion.h2>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg md:text-2xl text-zinc-200 font-medium tracking-wide drop-shadow-md mb-8"
            >
              Sabores inesquecíveis entregues diretamente na sua casa.
            </motion.p>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#FDFCF8] to-transparent z-10"></div>
      </motion.section>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 relative z-20 -mt-16 mb-20"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 md:p-8 shadow-2xl shadow-zinc-900/5 flex flex-col md:flex-row items-center justify-between gap-6 border border-white">
           <div className="flex-1 text-center md:text-left">
             <h3 className="text-xl font-bold text-zinc-900 mb-1">Peça Online ou pelo WhatsApp</h3>
             <p className="text-sm text-zinc-500">Escolha a plataforma de sua preferência para realizar o pedido.</p>
           </div>
           <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
             <button 
               onClick={() => setIsPlatformModalOpen(true)}
               className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-zinc-50 text-zinc-900 px-8 py-4 rounded-2xl transition-colors font-bold shadow-sm border border-zinc-100"
             >
               <Store className="w-5 h-5 text-amber-500" />
               Apps de Delivery
               <ExternalLink className="w-4 h-4 text-zinc-400 ml-1" />
             </button>
             <a 
               href="#cardapio"
               className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 px-8 py-4 rounded-2xl transition-all hover:scale-105 font-bold shadow-lg shadow-amber-500/20"
             >
               <Phone className="w-5 h-5" /> Pedido Direto
             </a>
           </div>
        </div>
      </motion.div>

      <main id="cardapio" className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        {allCategories.map(category => (
          <section key={category} className="mb-24">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="flex items-baseline gap-4 mb-10 border-b border-zinc-200/60 pb-5"
            >
              <h2 className="text-3xl lg:text-5xl font-display font-black text-zinc-900 tracking-tight">{category}</h2>
              <span className="text-sm text-amber-600 font-bold uppercase tracking-widest bg-amber-100/50 px-3 py-1 rounded-full">
                {allItems.filter(item => item.category === category).length} opções
              </span>
            </motion.div>
            
            <motion.div 
               initial="hidden"
               whileInView="visible"
               viewport={{ once: true, margin: "-50px" }}
               variants={{
                 visible: {
                   transition: {
                     staggerChildren: 0.1
                   }
                 }
               }}
               className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8"
            >
              {allItems.filter(item => item.category === category).sort((a, b) => a.name.localeCompare(b.name)).map(item => (
                <motion.article 
                  key={item.id} 
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
                  }}
                  className="group flex flex-col bg-white rounded-2xl sm:rounded-[2rem] overflow-hidden border-2 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.6)] hover:-translate-y-1 transition-all duration-500"
                >
                  <div className="relative pt-[75%] w-full bg-zinc-50 overflow-hidden border-b border-orange-200">
                    <Image 
                      src={`/image/${item.id}.jpg`} 
                      alt={item.name}
                      fill
                      className="object-cover object-center group-hover:scale-110 transition-transform duration-1000 ease-out" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    {item.isNew && (
                      <span className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-rose-500 text-white text-[9px] sm:text-[10px] font-black px-2 py-1 sm:px-3 sm:py-1.5 rounded-full uppercase tracking-widest z-10 shadow-lg shadow-rose-500/30">
                        Novo
                      </span>
                    )}
                  </div>
                  <div className="p-4 sm:p-7 flex-1 flex flex-col">
                    <h3 className="font-display font-bold text-zinc-900 text-base sm:text-xl leading-tight mb-1 sm:mb-3 group-hover:text-amber-600 transition-colors">{item.name}</h3>
                    {item.description && <p className="text-zinc-500 text-xs sm:text-sm mb-4 sm:mb-6 leading-relaxed flex-1 line-clamp-3 sm:line-clamp-none">{item.description}</p>}
                    
                    <div className="flex items-end justify-between mt-auto pt-3 sm:pt-5 border-t border-zinc-100">
                      <div className="flex flex-col">
                        <span className="text-zinc-400 line-through text-[10px] sm:text-xs font-semibold mb-0.5">R$ {item.priceIfood.toFixed(2)}</span>
                        <span className="text-zinc-900 font-extrabold text-lg sm:text-2xl leading-none tracking-tight">R$ {getPrice(item).toFixed(2)}</span>
                      </div>
                      <button 
                        onClick={() => addToCart(item)}
                        className="bg-orange-100 ring-1 ring-orange-500/50 hover:bg-orange-500 text-orange-900 hover:text-white rounded-xl sm:rounded-2xl w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center transition-all duration-300 active:scale-95 shadow-sm"
                      >
                        <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          </section>
        ))}
      </main>

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
              className="bg-zinc-900 hover:bg-zinc-800 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-4 font-semibold text-lg transition-transform hover:scale-105 active:scale-95 border border-zinc-700"
            >
              <div className="relative">
                <ShoppingCart className="w-6 h-6" />
                <span className="absolute -top-2 -right-2 bg-amber-500 text-amber-950 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartItemCount}
                </span>
              </div>
              <span className="pr-4 border-r border-zinc-700">Ver Pedido</span>
              <span className="text-amber-400 font-bold">R$ {cartTotal.toFixed(2)}</span>
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
              className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 w-full max-w-2xl mx-auto bg-white rounded-t-[2.5rem] shadow-2xl z-50 h-[85vh] flex flex-col overflow-hidden"
            >
              <div className="p-6 text-center border-b border-zinc-100 flex justify-between items-center bg-zinc-50 rounded-t-[2.5rem]">
                <h2 className="font-display font-bold text-zinc-900 text-2xl">Seu Pedido</h2>
                <button onClick={() => setIsCartOpen(false)} className="text-zinc-500 hover:text-zinc-800 bg-white hover:bg-zinc-200 w-10 h-10 flex items-center justify-center rounded-full transition-colors border border-zinc-200 shadow-sm">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="text-center text-zinc-400 py-12 flex flex-col items-center">
                    <ShoppingCart className="w-20 h-20 text-zinc-200 mb-6" />
                    <p className="text-lg">Seu carrinho está vazio.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map(item => (
                      <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm gap-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-zinc-900 text-lg">{item.name}</h4>
                          <p className="text-zinc-500 font-medium">R$ {getPrice(item).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-xl p-1.5 shrink-0 self-start sm:self-auto">
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 rounded-lg transition-colors"><Minus className="w-4 h-4" /></button>
                          <span className="font-bold w-6 text-center text-zinc-900">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 rounded-lg transition-colors"><Plus className="w-4 h-4" /></button>
                        </div>
                        <div className="text-right font-bold text-zinc-900 w-24 shrink-0 self-start sm:self-auto pt-2 sm:pt-0 text-lg">
                          R$ {(getPrice(item) * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {cart.length > 0 && (
                  <div className="pt-8 border-t border-zinc-100 space-y-5 pb-4">
                    <h3 className="font-display font-bold text-xl text-zinc-900 mb-2">Dados para Entrega</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <input 
                        type="text" 
                        placeholder="Nome completo" 
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all font-medium text-zinc-900 placeholder:text-zinc-400"
                      />
                      <input 
                        type="tel" 
                        placeholder="WhatsApp com DDD" 
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all font-medium text-zinc-900 placeholder:text-zinc-400"
                      />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Endereço completo (Rua, Número, Bairro)" 
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all font-medium text-zinc-900 placeholder:text-zinc-400"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <input 
                        type="text" 
                        placeholder="Ponto de Referência (Opcional)" 
                        value={addressReference}
                        onChange={(e) => setAddressReference(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all font-medium text-zinc-900 placeholder:text-zinc-400"
                      />
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all font-medium text-zinc-900"
                      >
                        <option value="" disabled>Forma de pagamento</option>
                        <option value="Pix">Pix</option>
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="Cartão de Crédito">Cartão de Crédito</option>
                        <option value="Cartão de Débito">Cartão de Débito</option>
                      </select>
                    </div>
                    <textarea 
                      placeholder="Observações do pedido (Opcional) Ex: Troco para 50, Sem cebola..." 
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      rows={3}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all font-medium text-zinc-900 placeholder:text-zinc-400 resize-none"
                    />
                  </div>
                )}
              </div>

              <div className="p-6 bg-zinc-50 border-t border-zinc-200">
                <div className="flex justify-between items-end mb-6">
                  <span className="text-zinc-500 font-semibold text-lg">Total do Pedido</span>
                  <span className="text-3xl font-display font-bold text-zinc-900">R$ {cartTotal.toFixed(2)}</span>
                </div>
                <button 
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || isSubmitting}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-bold py-4 rounded-xl shadow-lg shadow-green-600/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  {isSubmitting ? 'Enviando...' : (
                    <>
                      <Phone className="w-6 h-6 fill-current" />
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
              className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: 50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 50, opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl border border-zinc-100"
            >
              <button 
                onClick={() => setIsPlatformModalOpen(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 p-2.5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <Pizza className="w-20 h-20 text-amber-500 mx-auto mb-6" />
              <h2 className="text-2xl font-display font-bold text-zinc-900 mb-2">Faça seu Pedido</h2>
              <p className="text-zinc-500 font-medium mb-8">Escolha sua plataforma preferida</p>
              
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => handlePlatformClick('ifood', 'https://www.ifood.com.br/delivery/duque-de-caxias-rj/peter-pizzas-pantanal/b782938f-8c5b-4e40-9a60-789181b4524b')}
                  className="bg-[#EA1D2C] hover:bg-[#c91825] text-white font-bold text-lg py-4 px-6 rounded-2xl shadow-md transition-transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 w-full"
                >
                  <Store className="w-5 h-5" />
                  Pedir no iFood
                </button>
                
                <button 
                  onClick={() => handlePlatformClick('99food', 'https://99food.com/PeterPizzas')}
                  className="bg-zinc-50 hover:bg-zinc-100 text-zinc-900 font-bold text-lg py-4 px-6 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 border border-zinc-200 w-full"
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
