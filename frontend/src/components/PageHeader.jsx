export default function PageHeader({ title, mobileTitle, subtitle, mobileSubtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        {mobileTitle && <h1 className="text-2xl font-bold text-gray-900 md:hidden">{mobileTitle}</h1>}
        <h1 className={`text-2xl font-bold text-gray-900 ${mobileTitle ? 'hidden md:block' : ''}`}>{title}</h1>
        {subtitle && (
          <>
            {mobileSubtitle && (
              <p className="text-gray-500 mt-1 md:hidden">{mobileSubtitle}</p>
            )}
            <p className={`text-gray-500 mt-1 ${mobileSubtitle ? 'hidden md:block' : ''}`}>
              {subtitle}
            </p>
          </>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
