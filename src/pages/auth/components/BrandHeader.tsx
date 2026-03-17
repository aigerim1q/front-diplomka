import { useTranslation } from 'react-i18next'

const BrandHeader = () => {
  const { t } = useTranslation()
  return (
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2563EB] rounded-2xl shadow-lg mb-4">
        <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 tracking-tight">MyHome</h1>
      <p className="text-gray-500 mt-1 font-medium">Residential Complex Management</p>
    </div>
  )
}

export default BrandHeader