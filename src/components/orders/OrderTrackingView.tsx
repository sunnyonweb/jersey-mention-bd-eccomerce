import { useState, FormEvent, useEffect } from 'react';
import { Search, Package, Clock, CheckCircle2, Truck, AlertCircle, Shirt, Printer, MessageCircle, ArrowLeft, Eye, X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Order } from '../../types';
import { getWhatsAppLink } from '../../utils/whatsapp';

interface InvoiceModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onPrint: () => void;
}

function InvoiceModal({ order, isOpen, onClose, onPrint }: InvoiceModalProps) {
  const { siteSettings } = useStore();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 flex flex-col animate-in scale-in duration-300">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-900 text-white rounded-t-3xl shadow-md">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-base tracking-tight">Official Order Invoice</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-xl transition-all cursor-pointer text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Invoice Sheet */}
        <div className="p-6 sm:p-8 space-y-6 flex-1 text-slate-800 text-xs">
          
          {/* Top Banner Success */}
          <div className="bg-emerald-50 border border-emerald-200/60 text-emerald-900 p-4 rounded-2xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-black text-sm text-emerald-800">Order Placed Successfully!</h4>
              <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                Thank you for your order! Your purchase has been logged in our system. Once our administration team verifies your payment transaction ID, your order fulfillment status will be updated.
              </p>
            </div>
          </div>

          {/* Invoice Header Details */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 border-b border-slate-150 pb-6">
            <div className="space-y-1">
              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded border border-slate-250 font-black uppercase text-slate-500">Merchant</span>
              <h4 className="font-black text-lg text-slate-900 leading-tight">JERSEY MENTION BD</h4>
              <p className="text-slate-550 leading-relaxed">
                Rampura, Dhaka<br />
                admin@jerseymentionbd.com | {siteSettings.whatsappNumber || '01640581442'}
              </p>
            </div>
            
            <div className="space-y-1 sm:text-right">
              <span className="text-[10px] bg-emerald-100 text-emerald-850 px-2 py-0.5 rounded font-black uppercase">Invoice details</span>
              <h4 className="font-black text-base text-slate-950 mt-1">Invoice #: {order.orderNumber}</h4>
              <p className="text-slate-550">
                <strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-slate-555">
                <strong>Payment Method:</strong> <span className="uppercase font-bold text-slate-900">{order.paymentMethod}</span> ({order.payment?.type === '25_percent_advance' ? '25% Advance + COD' : '100% Advance'})
              </p>
              {order.paymentDetails?.transactionId && (
                <p className="text-slate-555 font-mono">
                  <strong>TrxID:</strong> <span className="uppercase font-bold text-emerald-700">{order.paymentDetails.transactionId}</span>
                </p>
              )}
              <p className="text-slate-555">
                <strong>Payment Status:</strong>{' '}
                {order.paymentStatus === 'paid' ? (
                  <span className="font-bold text-emerald-600">Paid (Verified)</span>
                ) : order.paymentStatus === 'failed' ? (
                  <span className="font-bold text-red-650">Failed / Rejected</span>
                ) : (
                  <span className="font-bold text-amber-600">Pending Verification</span>
                )}
              </p>
            </div>
          </div>

          {/* Billed To vs Shipping Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-slate-150 pb-6">
            <div>
              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded border border-slate-250 font-black uppercase text-slate-500">Billed to</span>
              <h5 className="font-extrabold text-sm text-slate-900 mt-1">{order.customerName}</h5>
              <p className="text-slate-550 leading-relaxed mt-0.5">
                {order.customerPhone}<br />
                {order.customerEmail}
              </p>
            </div>
            <div>
              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded border border-slate-250 font-black uppercase text-slate-500">Shipping destination</span>
              <h5 className="font-extrabold text-sm text-slate-900 mt-1">{order.shippingAddress.name || order.customerName}</h5>
              <p className="text-slate-550 leading-relaxed mt-0.5">
                {order.shippingAddress.address}<br />
                {order.shippingAddress.city}, Bangladesh
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-3">
            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded border border-slate-250 font-black uppercase text-slate-500 block w-fit">Order Items</span>
            <div className="border border-slate-150 rounded-2xl overflow-hidden bg-slate-50">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-150 text-slate-600 font-extrabold">
                    <th className="p-3">Product details</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Price</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {order.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-3">
                        <div className="font-extrabold text-slate-900">{item.productName || item.name}</div>
                        <div className="text-[10px] text-slate-500 mt-1 flex flex-wrap items-center gap-1.5 font-bold">
                          {item.isKidsSize || (item.size && ['3Y','4Y','5Y','6Y','7Y','8Y','9Y','10Y','11Y','12Y','13Y','14Y'].includes(item.size)) ? (
                            <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-black">Kids Size: {item.size}</span>
                          ) : item.size ? (
                            <span className="bg-slate-100 text-slate-800 border border-slate-300 px-2 py-0.5 rounded text-[10px] font-black">Size: {item.size}</span>
                          ) : null}
                          {item.sku && <span className="bg-slate-50 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded font-mono text-[9px]">SKU: {item.sku}</span>}
                          {item.color && <span>Color: {item.color}</span>}
                        </div>
                        {item.customization?.nameNumber?.enabled && (
                          <div className="text-[10px] font-bold text-emerald-700 mt-1 flex items-center gap-1">
                            <Shirt className="w-3 h-3 text-emerald-555" />
                            Squad Print: {item.customization.nameNumber.name} #{item.customization.nameNumber.number} (+৳{item.customization.nameNumber.price})
                          </div>
                        )}
                        {item.customization?.sleeveBadges?.enabled && (
                          <div className="text-[10px] text-blue-700 font-bold mt-1 space-y-1 bg-blue-50/70 p-2 rounded-lg border border-blue-100">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1 font-black">
                                <CheckCircle2 className="w-3 h-3 text-blue-500" /> Sleeve Badges ({item.customization.sleeveBadges.quantity}):
                              </span>
                              <span className="font-extrabold text-blue-900">+৳{item.customization.sleeveBadges.totalPrice}</span>
                            </div>
                            <div className="space-y-0.5 pt-0.5">
                              {item.customization.sleeveBadges.selectedBadges.map((b: any, idx: number) => {
                                const img = b.badgeImage || b.image;
                                const name = b.badgeName || b.name;
                                const price = b.badgePrice ?? b.price;
                                return (
                                  <div key={idx} className="flex items-center justify-between text-[9px] text-slate-700 pl-1">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <div className="w-3.5 h-3.5 rounded bg-white border border-blue-200 overflow-hidden shrink-0 flex items-center justify-center">
                                        {img ? (
                                          <img src={img} alt={name} className="w-full h-full object-contain" />
                                        ) : (
                                          <Shirt className="w-2.5 h-2.5 text-blue-500" />
                                        )}
                                      </div>
                                      <span className="truncate font-semibold">{name}</span>
                                    </div>
                                    {price !== undefined && (
                                      <span className="text-blue-700 font-bold shrink-0">+৳{price}</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {!item.customization?.sleeveBadges?.enabled && item.customization?.patches?.enabled && (
                          <div className="text-[10px] font-bold text-blue-700 mt-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-blue-500" />
                            Sleeve Patches: {item.customization.patches.quantity} Patch(es) (+৳{item.customization.patches.totalPrice})
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-center text-slate-700 font-bold">{item.quantity}</td>
                      <td className="p-3 text-right text-slate-700">৳{item.price.toLocaleString()}</td>
                      <td className="p-3 text-right text-slate-900 font-extrabold">৳{(item.price * item.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Totals */}
          <div className="flex justify-end pt-4">
            <div className="w-64 space-y-2.5">
              <div className="flex justify-between text-slate-600">
                <span>Cart Subtotal:</span>
                <span className="font-semibold text-slate-800">৳{order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping Charge:</span>
                <span className="font-semibold text-slate-800">৳{order.shippingFee.toLocaleString()}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon Discount:</span>
                  <span>-৳{order.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-slate-900 text-sm pt-2 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="text-emerald-600 text-base">৳{order.totalAmount.toLocaleString()}</span>
              </div>
              {order.payment && (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 space-y-1 mt-2 text-[10px] font-bold text-left">
                  <div className="text-slate-500 uppercase text-[9px] font-extrabold mb-1">
                    Advance Payment Option: {order.payment.type === '25_percent_advance' ? '25% Advance' : '100% Advance'}
                  </div>
                  <div className="flex justify-between text-emerald-750">
                    <span>Advance Amount Paid:</span>
                    <span>৳{order.payment.advanceAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-red-650">
                    <span>Remaining Balance:</span>
                    <span>৳{order.payment.remainingAmount.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-slate-100 bg-slate-50 rounded-b-3xl">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-250 hover:bg-slate-100 rounded-xl font-bold cursor-pointer text-slate-700 transition-colors"
          >
            Close Invoice
          </button>
          
          <button
            onClick={onPrint}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-2 rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print or Download PDF</span>
          </button>
        </div>

      </div>
    </div>
  );
}

export default function OrderTrackingView() {
  const { currentOrderTracking, setCurrentOrderTracking, user, siteSettings, showToast } = useStore();

  const [searchOrderNo, setSearchOrderNo] = useState('');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Fetch logged in user's orders
  useEffect(() => {
    if (user) {
      setLoadingOrders(true);
      fetch('/api/orders/my-orders')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.orders) {
            setUserOrders(data.orders);
          }
        })
        .catch((err) => console.error('Error fetching user orders:', err))
        .finally(() => setLoadingOrders(false));
    } else {
      setUserOrders([]);
    }
  }, [user]);

  const handleTrackOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchOrderNo.trim()) {
      setError('Order ID is required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const url = `/api/orders/track?orderNumber=${encodeURIComponent(searchOrderNo.trim())}&identifier=${encodeURIComponent(phoneOrEmail.trim())}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success && data.order) {
        setCurrentOrderTracking(data.order);
      } else {
        setCurrentOrderTracking(null);
        setError(data.message || 'Order not found. Please check your Order ID and phone number/email and try again.');
      }
    } catch (err) {
      setCurrentOrderTracking(null);
      setError('Server error tracking order. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUserOrder = (selectedOrder: Order) => {
    setCurrentOrderTracking(selectedOrder);
    setSearchOrderNo(selectedOrder.orderNumber);
    setPhoneOrEmail(selectedOrder.customerEmail || selectedOrder.customerPhone);
    setError(null);
  };

  const handlePrintInvoice = (orderData: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = orderData.items.map((item) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px; font-size: 12px; color: #1e293b;">
          <div style="font-weight: 700; color: #0f172a;">${item.productName || item.name}</div>
          ${item.size ? `<span style="font-size: 10px; color: #64748b; margin-right: 8px;">Size: ${item.size}</span>` : ''}
          ${item.color ? `<span style="font-size: 10px; color: #64748b;">Color: ${item.color}</span>` : ''}
          ${item.customPrint?.playerName ? `
            <div style="font-size: 10px; font-weight: 700; color: #059669; margin-top: 4px;">
              Squad Print: ${item.customPrint.playerName} #${item.customPrint.playerNumber || '0'}
            </div>
          ` : ''}
        </td>
        <td style="padding: 12px; font-size: 12px; color: #1e293b; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; font-size: 12px; color: #1e293b; text-align: right;">৳${item.price.toLocaleString()}</td>
        <td style="padding: 12px; font-size: 12px; font-weight: 700; color: #0f172a; text-align: right;">৳${(item.price * item.quantity).toLocaleString()}</td>
      </tr>
    `).join('');

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice #${orderData.orderNumber}</title>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #334155; margin: 0; padding: 40px; background: #fff; }
            .invoice-box { max-width: 800px; margin: auto; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .logo-area h1 { margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a; }
            .logo-area p { margin: 4px 0 0 0; font-size: 11px; color: #64748b; }
            .invoice-title { text-align: right; }
            .invoice-title h2 { margin: 0; font-size: 22px; font-weight: 800; color: #059669; }
            .invoice-title p { margin: 4px 0 0 0; font-size: 11px; color: #64748b; }
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; }
            .details-col h3 { margin: 0 0 8px 0; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
            .details-col p { margin: 0; font-size: 12px; line-height: 1.5; color: #1e293b; }
            .details-col strong { color: #0f172a; }
            table { w-full border-collapse: collapse; margin-bottom: 30px; }
            th { background: #f8fafc; color: #475569; font-weight: 800; font-size: 11px; text-transform: uppercase; padding: 12px; border-bottom: 2px solid #cbd5e1; text-align: left; }
            .totals-table { margin-left: auto; width: 300px; margin-top: 20px; }
            .totals-table tr td { padding: 8px 12px; font-size: 12px; color: #475569; }
            .totals-table tr.grand-total td { font-size: 15px; font-weight: 900; color: #059669; border-top: 2px solid #059669; padding-top: 12px; }
            .footer { text-align: center; margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; }
            .footer p { margin: 4px 0; }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header">
              <div class="logo-area">
                <h1>JERSEY MENTION BD</h1>
                <p>Premium Authentic Jerseys & Apparel</p>
              </div>
              <div class="invoice-title">
                <h2>INVOICE</h2>
                <p>Order Reference: <strong>${orderData.orderNumber}</strong></p>
              </div>
            </div>

            <div class="details-grid">
              <div class="details-col">
                <h3>Billed To</h3>
                <p>
                  <strong>${orderData.customerName}</strong><br>
                  Phone: ${orderData.customerPhone}<br>
                  Email: ${orderData.customerEmail}
                </p>
              </div>
              <div class="details-col">
                <h3>Shipping Destination</h3>
                <p>
                  <strong>${orderData.shippingAddress.name || orderData.customerName}</strong><br>
                  ${orderData.shippingAddress.address}<br>
                  ${orderData.shippingAddress.city}, Bangladesh
                </p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 50%;">Item Details</th>
                  <th style="width: 10%; text-align: center;">Qty</th>
                  <th style="width: 20%; text-align: right;">Unit Price</th>
                  <th style="width: 20%; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <table class="totals-table">
              <tr>
                <td>Subtotal:</td>
                <td style="text-align: right; font-weight: 700; color: #0f172a;">৳${orderData.subtotal.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Delivery Charge:</td>
                <td style="text-align: right; font-weight: 700; color: #0f172a;">৳${orderData.shippingFee.toLocaleString()}</td>
              </tr>
              ${orderData.discount > 0 ? `
                <tr>
                  <td>Coupon Discount:</td>
                  <td style="text-align: right; font-weight: 700; color: #dc2626;">-৳${orderData.discount.toLocaleString()}</td>
                </tr>
              ` : ''}
              <tr class="grand-total">
                <td>Grand Total:</td>
                <td style="text-align: right;">৳${orderData.totalAmount.toLocaleString()}</td>
              </tr>
            </table>

            <div class="footer">
              <p>Thank you for shopping with Jersey Mention BD!</p>
              <p>This is a computer-generated invoice. No physical signature is required.</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  // Stepper Visual Progress Timeline Stages
  const steps = [
    { key: 'pending', label: 'Order Placed', desc: 'Order received' },
    { key: 'confirmed', label: 'Confirmed', desc: 'Confirmed by store' },
    { key: 'processing', label: 'Processing', desc: 'Custom squad printing' },
    { key: 'shipped', label: 'Shipped', desc: 'In transit to destination' },
    { key: 'delivered', label: 'Delivered', desc: 'Package delivered' }
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'pending': return 0;
      case 'confirmed': return 1;
      case 'processing': return 2;
      case 'shipped': return 3;
      case 'delivered': return 4;
      default: return 0;
    }
  };

  const order: Order | null = currentOrderTracking;
  const currentStep = order ? getStepIndex(order.orderStatus) : 0;

  return (
    <div className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2 animate-in fade-in duration-300">
          <span className="text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full">
            Live Order Status
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            TRACK YOUR MATCH KITS
          </h1>
          <p className="text-xs text-slate-500">
            Check real-time package delivery status and print invoices easily.
          </p>
        </div>

        {/* Dynamic Logged-in Customer Panel */}
        {user && userOrders.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs animate-in fade-in duration-300">
            <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-3">
              Your Orders ({userOrders.length})
            </h3>
            {loadingOrders ? (
              <div className="animate-pulse h-12 bg-slate-100 rounded-2xl" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {userOrders.map((ord) => (
                  <button
                    key={ord.id}
                    onClick={() => handleSelectUserOrder(ord)}
                    className={`flex flex-col p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      order?.id === ord.id
                        ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-emerald-500 bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between w-full">
                      <span className="font-extrabold text-slate-900 text-xs">{ord.orderNumber}</span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        ord.orderStatus === 'delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.orderStatus === 'cancelled'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ord.orderStatus}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-2">
                      {new Date(ord.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} • ৳{ord.totalAmount.toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search Panel Form */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-center">
            TRACK YOUR ORDER
          </h3>
          <form onSubmit={handleTrackOrder} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Order ID"
                value={searchOrderNo}
                onChange={(e) => setSearchOrderNo(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 text-xs pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:outline-hidden uppercase font-semibold"
              />
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Phone Number or Email"
                value={phoneOrEmail}
                onChange={(e) => setPhoneOrEmail(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 text-xs px-4 py-3.5 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-slate-900 hover:bg-emerald-600 text-white font-black text-xs px-6 py-3.5 rounded-2xl transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {loading ? 'Searching...' : 'TRACK ORDER'}
            </button>
          </form>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
            <p className="text-xs text-slate-500">Searching and verifying order logs...</p>
          </div>
        )}

        {/* Order Details Display */}
        {!loading && order && (
          <div className="space-y-6">
            
            {/* Promotion / Notice alert for pending */}
            {order.orderStatus === 'pending' && (
              <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5 sm:mt-0 shadow-xs">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">Order Placed Successfully!</h4>
                    <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
                      Your order #{order.orderNumber} is received. <strong>Payment Verification: Pending verification by admin.</strong> We will confirm your payment details shortly.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsInvoiceOpen(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-black px-4.5 py-2.5 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span>View Official Invoice</span>
                </button>
              </div>
            )}

            {/* Cancelled Banner */}
            {order.orderStatus === 'cancelled' && (
              <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center space-y-2 animate-in fade-in duration-300">
                <AlertCircle className="w-12 h-12 text-rose-600 mx-auto animate-bounce" />
                <h3 className="font-extrabold text-rose-900 text-lg">Order Cancelled</h3>
                <p className="text-xs text-rose-700 max-w-md mx-auto leading-relaxed">
                  This order has been cancelled. If you believe this is an error or have questions, please reach out to our customer helpline at {siteSettings.contactPhone || '01640581442'}.
                </p>
              </div>
            )}

            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-8">
              
              {/* Top Bar Info Details */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
                <div>
                  <span className="text-xs text-slate-400 font-bold block">Order ID</span>
                  <h2 className="text-xl font-black text-slate-900">Order #{order.orderNumber}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <a
                    href={getWhatsAppLink(siteSettings.whatsappNumber, `Hi Jersey Mention BD, I need assistance regarding my Order #${order.orderNumber}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20ba5c] text-white text-xs font-bold px-3.5 py-1.5 rounded-full transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer"
                    title="Chat with support on WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Support</span>
                  </a>
                  <span className={`text-xs font-black px-3.5 py-1.5 rounded-full uppercase ${
                    order.orderStatus === 'delivered'
                      ? 'bg-emerald-100 text-emerald-800'
                      : order.orderStatus === 'cancelled'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    Order: {order.orderStatus.replace('_', ' ')}
                  </span>

                  <span className={`text-xs font-black px-3.5 py-1.5 rounded-full uppercase ${
                    order.paymentVerificationStatus === 'verified'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : order.paymentVerificationStatus === 'rejected'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    Payment: {order.paymentVerificationStatus === 'verified' ? 'Verified' : order.paymentVerificationStatus === 'rejected' ? 'Rejected' : 'Pending Verification'}
                  </span>

                  <button
                    onClick={() => setIsInvoiceOpen(true)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 p-2 rounded-xl transition-colors cursor-pointer text-xs font-bold flex items-center gap-1.5"
                    title="View & Print Invoice"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Invoice</span>
                  </button>
                </div>
              </div>

              {/* Order Status Timeline Stepper */}
              {order.orderStatus !== 'cancelled' && (
                <div>
                  <h3 className="font-bold text-slate-900 text-xs mb-6 uppercase tracking-wider">
                    Order Delivery Timeline
                  </h3>

                  <div className="relative flex items-center justify-between">
                    {/* Connecting Line */}
                    <div className="absolute top-4 left-0 right-0 h-1 bg-slate-200 -z-0" />
                    <div
                      className="absolute top-4 left-0 h-1 bg-emerald-600 transition-all duration-500 -z-0"
                      style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                    />

                    {steps.map((step, idx) => {
                      const isDone = idx <= currentStep;
                      return (
                        <div key={step.key} className="flex flex-col items-center text-center space-y-2 z-10 w-1/5">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                              isDone
                                ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                                : 'bg-slate-200 text-slate-500'
                            }`}
                          >
                            {isDone ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                          </div>
                          <div className="hidden sm:block">
                            <span className="font-extrabold text-slate-900 text-xs block">{step.label}</span>
                            <span className="text-[10px] text-slate-400 block">{step.desc}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Courier Tracking Info Box */}
              {order.courierTrackingCode && order.orderStatus !== 'cancelled' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span>Courier Provider: {order.courierProvider || 'Pathao Express'}</span>
                    <span className="bg-white px-2 py-0.5 rounded border border-slate-300 font-mono text-emerald-700">
                      {order.courierTrackingCode}
                    </span>
                  </div>
                  <a
                    href={`https://pathao.com/courier/tracking/?consignment_id=${order.courierTrackingCode}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-600 hover:underline font-bold"
                  >
                    Track on Pathao →
                  </a>
                </div>
              )}

              {/* Items Table */}
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm mb-3">Order Items</h3>
                <div className="space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                      {item.productImage || item.image ? (
                        <img
                          src={item.productImage || item.image}
                          alt={item.productName || item.name}
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 object-contain p-1 rounded-xl bg-white border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                          <Shirt className="w-6 h-6 opacity-45" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-extrabold text-slate-900">{item.productName || item.name}</h4>
                        <p className="text-slate-550 text-[11px] mt-0.5">
                          Size: {item.size} | Color: {item.color || 'Standard'} | Qty: {item.quantity}
                        </p>
                        {item.customization?.nameNumber?.enabled && (
                          <p className="text-[11px] text-emerald-800 font-bold flex items-center gap-1 mt-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 w-fit">
                            <Shirt className="w-3 h-3 text-emerald-655" /> Squad Print: {item.customization.nameNumber.name} #{item.customization.nameNumber.number} (+৳{item.customization.nameNumber.price})
                          </p>
                        )}
                        {item.customization?.sleeveBadges?.enabled && (
                          <div className="text-[11px] text-blue-800 font-bold mt-1 bg-blue-50 px-2 py-1 rounded border border-blue-200 w-fit space-y-0.5">
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-blue-655" />
                              Sleeve Badges ({item.customization.sleeveBadges.quantity}): (+৳{item.customization.sleeveBadges.totalPrice})
                            </div>
                            <div className="pl-4 text-[10px] text-slate-600 font-bold">
                              {item.customization.sleeveBadges.selectedBadges.map((b: any, idx: number) => (
                                <div key={idx}>• {b.name}</div>
                              ))}
                            </div>
                          </div>
                        )}
                        {!item.customization?.sleeveBadges?.enabled && item.customization?.patches?.enabled && (
                          <p className="text-[11px] text-blue-800 font-bold flex items-center gap-1 mt-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 w-fit">
                            <CheckCircle2 className="w-3 h-3 text-blue-655" /> Sleeve Patches: {item.customization.patches.quantity} Patch(es) (+৳{item.customization.patches.totalPrice})
                          </p>
                        )}
                      </div>
                      <span className="font-extrabold text-slate-900 text-sm">
                        ৳{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                <div className="text-slate-650 space-y-1.5">
                  <p><strong>Shipping Address:</strong> {order.shippingAddress.address}, {order.shippingAddress.city}</p>
                  <p><strong>Contact Phone:</strong> {order.customerPhone}</p>
                  <p><strong>Payment Method:</strong> <span className="uppercase font-bold text-slate-900">{order.paymentMethod}</span></p>
                  {(order.paymentMobileNumber || order.paymentDetails?.senderNumber) && (
                    <p><strong>Sender Mobile:</strong> <span className="font-bold text-slate-900">{order.paymentMobileNumber || order.paymentDetails?.senderNumber}</span></p>
                  )}
                  {(order.transactionId || order.paymentDetails?.transactionId) && (
                    <p><strong>Transaction ID / TrxID:</strong> <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-250">{order.transactionId || order.paymentDetails?.transactionId}</span></p>
                  )}
                  <p className="flex items-center gap-2 pt-0.5">
                    <strong>Payment Verification:</strong>
                    <span className={`font-black px-2.5 py-0.5 rounded-full text-[10px] uppercase ${
                      order.paymentVerificationStatus === 'verified'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : order.paymentVerificationStatus === 'rejected'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {order.paymentVerificationStatus === 'verified'
                        ? 'Verified'
                        : order.paymentVerificationStatus === 'rejected'
                        ? 'Rejected'
                        : 'Pending verification by admin'}
                    </span>
                  </p>
                </div>

                <div className="text-right space-y-1 sm:w-48 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>৳{order.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Delivery</span>
                    <span>৳{order.shippingFee}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount</span>
                      <span>-৳{order.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-slate-900 text-sm pt-2 border-t border-slate-200">
                    <span>Total</span>
                    <span className="text-emerald-700">৳{order.totalAmount.toLocaleString()}</span>
                  </div>
                  {order.payment && (
                    <div className="border-t border-slate-250 pt-2 mt-2 space-y-1 text-[10px] font-bold text-left">
                      <div className="text-slate-500 uppercase text-[9px] font-extrabold mb-1">
                        Advance Payment Option: {order.payment.type === '25_percent_advance' ? '25% Advance' : '100% Advance'}
                      </div>
                      <div className="flex justify-between text-emerald-700">
                        <span>Advance Paid:</span>
                        <span>৳{order.payment.advanceAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-red-655">
                        <span>Remaining Balance:</span>
                        <span>৳{order.payment.remainingAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Render the detailed Invoice Modal */}
            <InvoiceModal
              order={order}
              isOpen={isInvoiceOpen}
              onClose={() => setIsInvoiceOpen(false)}
              onPrint={() => handlePrintInvoice(order)}
            />
          </div>
        )}

        {/* Initial Search Placeholder */}
        {!loading && !order && !error && (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-xs animate-in fade-in duration-300">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-extrabold text-slate-800 text-base">Track Your Jersey Package</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Please enter your Order ID and associated Phone Number or Email address above to verify and check real-time courier progress.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
