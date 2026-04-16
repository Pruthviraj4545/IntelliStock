import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Printer, Download, AlertCircle } from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { getShopDetails, createInvoice } from '../api/shopService'
import { useToast } from './Toast'

export function ProfessionalBilling({ cartItems = [], customerId = null, customerDetails = null }) {
  const toast = useToast()
  const [shopDetails, setShopDetails] = useState(null)
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [discountPercentage, setDiscountPercentage] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [generating, setGenerating] = useState(false)
  const [invoiceData, setInvoiceData] = useState(null)

  const GST_RATE = 18 // Default GST for India

  useEffect(() => {
    loadShopDetails()
  }, [])

  const loadShopDetails = async () => {
    try {
      const details = await getShopDetails()
      setShopDetails(details)
    } catch (error) {
      console.error('Error loading shop details:', error)
      toast.error('Failed to load shop details. Please configure them first.')
    }
  }

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0)
  const discount = (subtotal * discountPercentage) / 100
  const subtotalAfterDiscount = subtotal - discount
  const gst = (subtotalAfterDiscount * GST_RATE) / 100
  const total = subtotalAfterDiscount + gst

  const generateInvoice = async () => {
    if (!shopDetails) {
      toast.error('Shop details not configured')
      return
    }

    if (cartItems.length === 0) {
      toast.error('Cart is empty')
      return
    }

    try {
      setGenerating(true)

      // Generate invoice via API
      const invoiceItems = cartItems.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        rate: item.selling_price
      }))

      const invoice = await createInvoice({
        customerId: customerId || null,
        items: invoiceItems,
        subtotal: subtotal,
        taxPercentage: GST_RATE,
        discountAmount: discount,
        discountPercentage: discountPercentage,
        paymentMethod: paymentMethod,
        notes: ''
      })

      setInvoiceData({
        ...invoice,
        items: cartItems,
        customer: customerDetails,
        shop: shopDetails
      })

      setInvoiceNumber(invoice.invoice_number)
      toast.success(`Invoice ${invoice.invoice_number} created successfully`)
    } catch (error) {
      console.error('Error generating invoice:', error)
      toast.error('Failed to generate invoice')
    } finally {
      setGenerating(false)
    }
  }

  const downloadPDF = async () => {
    try {
      const element = document.getElementById('invoice-print')
      if (!element) return

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      })

      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgData = canvas.toDataURL('image/png')
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297)
      pdf.save(`Invoice-${invoiceNumber}.pdf`)

      toast.success('Invoice downloaded successfully')
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('Failed to download invoice')
    }
  }

  const printInvoice = () => {
    const printWindow = window.open('', '', 'height=600,width=800')
    const element = document.getElementById('invoice-print')
    if (element) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice ${invoiceNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; color: #0f172a; }
              .invoice-shell { border: 1px solid #dbe3ef; border-radius: 14px; overflow: hidden; }
              .invoice-header { background: linear-gradient(135deg, #0f766e, #0f4c81); color: #fff; padding: 20px; }
              .invoice-body { padding: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 14px; }
              th, td { border-bottom: 1px solid #e2e8f0; padding: 10px; font-size: 12px; }
              th { text-align: left; background: #f1f5f9; }
              .totals { width: 320px; margin-left: auto; margin-top: 14px; }
              .totals-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e2e8f0; }
              .totals-grand { font-weight: 700; font-size: 18px; border: 1px solid #0f766e; padding: 10px; margin-top: 8px; border-radius: 8px; }
            </style>
          </head>
          <body>
            ${element.outerHTML}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  // Invoice Preview Template
  if (invoiceData) {
    return (
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex gap-2 justify-end">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={printInvoice}
            className="flex items-center gap-2 px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-lg"
          >
            <Printer className="w-4 h-4" /> Print
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={downloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg"
          >
            <Download className="w-4 h-4" /> Download PDF
          </motion.button>
        </div>

        {/* Invoice Document */}
        <div id="invoice-print" className="invoice-shell bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="invoice-header bg-gradient-to-r from-teal-700 via-cyan-700 to-blue-800 px-8 py-8 text-white">
            <div className="flex justify-between items-start gap-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold tracking-wide">{shopDetails?.name || 'Your Shop'}</h1>
                <p className="text-teal-100 mt-2 text-sm">Tax Invoice</p>
                <div className="text-sm text-teal-50 mt-4 space-y-1">
                  <p>{shopDetails?.address}, {shopDetails?.city}, {shopDetails?.state} {shopDetails?.postal_code}</p>
                  <p>Phone: {shopDetails?.contact_number || 'N/A'} | Email: {shopDetails?.email || 'N/A'}</p>
                  <p>GSTIN: {shopDetails?.gst_number || 'Not Provided'}</p>
                </div>
              </div>

              <div className="text-right text-sm bg-white/15 rounded-xl p-4 backdrop-blur-sm min-w-[220px]">
                <p className="text-teal-100 uppercase tracking-wider text-xs">Invoice No.</p>
                <p className="font-bold text-xl">{invoiceNumber}</p>
                <p className="mt-3 text-teal-100">Date: <span className="text-white font-semibold">{new Date().toLocaleDateString()}</span></p>
                <p className="text-teal-100">Time: <span className="text-white font-semibold">{new Date().toLocaleTimeString()}</span></p>
              </div>
            </div>
          </div>

          <div className="invoice-body p-8">
            <div className="border border-slate-200 rounded-xl p-4 mb-6 bg-slate-50">
              {invoiceData.customer && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2 text-sm uppercase tracking-wide">Bill To</h3>
                  <div className="text-sm text-slate-700 space-y-1">
                    <p><span className="font-semibold">{invoiceData.customer.name}</span></p>
                    <p>Mobile: {invoiceData.customer.mobile_number}</p>
                    {invoiceData.customer.email && <p>Email: {invoiceData.customer.email}</p>}
                    {invoiceData.customer.address && <p>Address: {invoiceData.customer.address}</p>}
                  </div>
                </div>
              )}
            </div>

            <table className="w-full mb-6 text-sm rounded-xl overflow-hidden border border-slate-200">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200">
                  <th className="text-left py-3 px-3 font-semibold text-slate-700">#</th>
                  <th className="text-left py-3 px-3 font-semibold text-slate-700">Product</th>
                  <th className="text-center py-3 px-3 font-semibold text-slate-700">Qty</th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-700">Rate (₹)</th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-700">GST (18%)</th>
                  <th className="text-right py-3 px-3 font-semibold text-slate-700">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.items.map((item, idx) => {
                  const lineTotal = item.selling_price * item.quantity
                  const lineGST = (lineTotal * GST_RATE) / 100
                  return (
                    <tr key={item.id} className="border-b border-slate-100 odd:bg-white even:bg-slate-50/60">
                      <td className="py-2.5 px-3 text-slate-600">{idx + 1}</td>
                      <td className="py-2.5 px-3 text-slate-800 font-medium">{item.name}</td>
                      <td className="text-center py-2.5 px-3 text-slate-700">{item.quantity}</td>
                      <td className="text-right py-2.5 px-3 text-slate-700">₹{item.selling_price.toFixed(2)}</td>
                      <td className="text-right py-2.5 px-3 text-slate-700">₹{lineGST.toFixed(2)}</td>
                      <td className="text-right py-2.5 px-3 font-semibold text-slate-900">₹{(lineTotal + lineGST).toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <div className="flex justify-end mb-8">
              <div className="totals w-80 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="totals-row flex justify-between py-2 text-sm border-b border-slate-200">
                  <span className="text-slate-600">Subtotal:</span>
                  <span className="font-semibold text-slate-900">₹{subtotal.toFixed(2)}</span>
                </div>
                {discountPercentage > 0 && (
                  <div className="totals-row flex justify-between py-2 text-sm text-emerald-600 border-b border-slate-200">
                    <span>Discount ({discountPercentage}%):</span>
                    <span className="font-semibold">-₹{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="totals-row flex justify-between py-2 text-sm border-b border-slate-200">
                  <span className="text-slate-600">Taxable Amount:</span>
                  <span className="font-semibold text-slate-900">₹{subtotalAfterDiscount.toFixed(2)}</span>
                </div>
                <div className="totals-row flex justify-between py-2 text-sm border-b border-slate-200">
                  <span className="text-slate-600">GST (18%):</span>
                  <span className="font-semibold text-slate-900">₹{gst.toFixed(2)}</span>
                </div>
                <div className="totals-grand flex justify-between py-3 text-lg font-bold border-2 border-teal-600 mt-2 px-3 rounded-lg bg-white">
                  <span>Total Amount:</span>
                  <span className="text-teal-700">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 text-xs text-slate-600 space-y-2">
              <p><span className="font-semibold">Payment Method:</span> {paymentMethod.toUpperCase()}</p>
              <p><span className="font-semibold">Terms:</span> Goods once sold are subject to store return/exchange policy. Please keep this invoice for warranty support.</p>
              <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between">
                <div>
                  <p className="font-semibold text-slate-800">Authorized Signatory</p>
                  <div className="h-12"></div>
                </div>
                <div className="text-right">
                  <p className="text-slate-500">Generated on {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Billing Form
  return (
    <div className="card p-6 space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Professional Billing</h2>

      {!shopDetails && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3"
        >
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">Shop Details Required</p>
            <p className="text-sm text-amber-800">Please configure your shop details in settings before generating invoices.</p>
          </div>
        </motion.div>
      )}

      {/* Bill Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Discount */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Discount (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={discountPercentage}
            onChange={(e) => setDiscountPercentage(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="0"
          />
          <p className="text-xs text-slate-600 mt-1">Discount: ₹{discount.toFixed(2)}</p>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Method</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
            <option value="wallet">Wallet</option>
            <option value="cheque">Cheque</option>
          </select>
        </div>

        {/* Total Amount */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Total Amount</label>
          <div className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50">
            <p className="text-2xl font-bold text-primary-600">₹{total.toFixed(2)}</p>
            <p className="text-xs text-slate-600">Inc. GST (18%)</p>
          </div>
        </div>
      </div>

      {/* Generate Invoice Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={generateInvoice}
        disabled={generating || !shopDetails || cartItems.length === 0}
        className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 text-white font-bold rounded-lg transition-colors"
      >
        {generating ? 'Generating...' : `Generate Invoice (₹${total.toFixed(2)})`}
      </motion.button>
    </div>
  )
}

export default ProfessionalBilling
