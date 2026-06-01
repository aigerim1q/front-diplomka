const BrandHeader = () => {
  return (
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center w-14 h-14 bg-zinc-900 rounded-2xl mb-4">
        <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">MyHome</h1>
      <p className="text-zinc-500 text-sm mt-1">Residential Complex Management</p>
    </div>
  )
}

export default BrandHeader
