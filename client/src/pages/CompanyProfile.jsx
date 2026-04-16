import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Building2, Upload, Save, Loader2, FileText } from 'lucide-react'
import { getShopDetails, createOrUpdateShopDetails } from '../api/shopService'
import { useToast } from '../components/Toast'

const OWNER_NAME_STORAGE_KEY = 'companyProfileOwnerName'
const LOGO_DATA_STORAGE_KEY = 'companyProfileLogoData'

function CompanyProfile() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoPreview, setLogoPreview] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    owner_name: '',
    contact_number: '',
    email: '',
    website: '',
    address: '',
    gst_number: '',
    logo_url: '',
    city: '',
    state: '',
    postal_code: '',
    business_type: 'retail',
    pan_number: ''
  })

  useEffect(() => {
    loadCompanyProfile()
  }, [])

  const loadCompanyProfile = async () => {
    try {
      setLoading(true)
      const details = await getShopDetails()
      const savedOwnerName = localStorage.getItem(OWNER_NAME_STORAGE_KEY) || ''
      const savedLogoData = localStorage.getItem(LOGO_DATA_STORAGE_KEY) || ''

      if (details) {
        setFormData({
          name: details.name || '',
          owner_name: savedOwnerName || '',
          contact_number: details.contact_number || '',
          email: details.email || '',
          website: details.website || '',
          address: details.address || '',
          gst_number: details.gst_number || '',
          logo_url: details.logo_url || '',
          city: details.city || '',
          state: details.state || '',
          postal_code: details.postal_code || '',
          business_type: details.business_type || 'retail',
          pan_number: details.pan_number || ''
        })
        setLogoPreview(savedLogoData || details.logo_url || '')
      } else if (savedOwnerName || savedLogoData) {
        setFormData(prev => ({
          ...prev,
          owner_name: savedOwnerName || prev.owner_name,
          logo_url: prev.logo_url
        }))
        setLogoPreview(savedLogoData)
      }
    } catch (error) {
      console.error('Error loading company profile:', error)
      toast.error('Failed to load company profile')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const imageData = String(reader.result || '')
      setLogoPreview(imageData)
      // Keep uploaded local image in browser storage; backend logo_url expects a short URL.
      localStorage.setItem(LOGO_DATA_STORAGE_KEY, imageData)
      setFormData(prev => ({ ...prev, logo_url: prev.logo_url && !prev.logo_url.startsWith('data:') ? prev.logo_url : '' }))
      toast.success('Logo selected. Click Save Company Profile to save details.')
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.owner_name || !formData.contact_number || !formData.email || !formData.address || !formData.gst_number) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      setSaving(true)

      const persistedLogoUrl = (formData.logo_url || '').startsWith('data:')
        ? ''
        : (formData.logo_url || '')

      await createOrUpdateShopDetails({
        name: formData.name,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postal_code,
        contact_number: formData.contact_number,
        email: formData.email,
        gst_number: formData.gst_number,
        pan_number: formData.pan_number,
        business_type: formData.business_type,
        website: formData.website,
        logo_url: persistedLogoUrl
      })

      localStorage.setItem(OWNER_NAME_STORAGE_KEY, formData.owner_name)
      toast.success('Company profile saved successfully')
    } catch (error) {
      console.error('Error saving company profile:', error)
      const backendMessage = error?.response?.data?.message || error?.response?.data?.error
      toast.error(backendMessage ? `Failed to save company profile: ${backendMessage}` : 'Failed to save company profile')
    } finally {
      setSaving(false)
    }
  }

  const hasLogo = useMemo(() => Boolean(logoPreview || formData.logo_url), [logoPreview, formData.logo_url])
  const labelClass = 'block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2'
  const inputClass = 'w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500'
  const compactInputClass = 'px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <Loader2 className="w-7 h-7 text-primary-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Company Profile</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Manage business details used in invoices and print documents.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <label className={labelClass}>Company Logo</label>
            <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/50 text-center">
              <div className="w-36 h-36 mx-auto rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 flex items-center justify-center overflow-hidden">
                {hasLogo ? (
                  <img src={logoPreview || formData.logo_url} alt="Company logo" className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-500" />
                )}
              </div>

              <label className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 dark:bg-primary-600 text-white text-sm font-medium cursor-pointer hover:bg-slate-800 dark:hover:bg-primary-700 transition-colors">
                <Upload className="w-4 h-4" /> Upload Logo
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">Or paste a logo URL below</p>
              <input
                type="url"
                name="logo_url"
                value={formData.logo_url}
                onChange={handleChange}
                placeholder="https://example.com/logo.png"
                className="mt-2 w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="lg:col-span-2 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Shop / Company Name *</label>
                <input name="name" value={formData.name} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Owner Name *</label>
                <input name="owner_name" value={formData.owner_name} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Phone Number *</label>
                <input name="contact_number" value={formData.contact_number} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Email Address *</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Website (Optional)</label>
                <input type="url" name="website" value={formData.website} onChange={handleChange} placeholder="https://yourcompany.com" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>GST Number *</label>
                <input name="gst_number" value={formData.gst_number} onChange={handleChange} placeholder="27AABCT1234H1Z0" className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Full Address *</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input name="city" value={formData.city} onChange={handleChange} placeholder="City" className={compactInputClass} />
              <input name="state" value={formData.state} onChange={handleChange} placeholder="State" className={compactInputClass} />
              <input name="postal_code" value={formData.postal_code} onChange={handleChange} placeholder="Postal Code" className={compactInputClass} />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
              <FileText className="w-4 h-4" />
              Company profile details are auto-used in invoice print layout.
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 text-white rounded-lg font-semibold"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Company Profile'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}

export default CompanyProfile
