export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-navy/6 flex items-center justify-center mb-4">
          <Icon size={24} className="text-navy/30" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-charcoal mb-1">{title}</h3>
      {description && <p className="text-xs text-charcoal-muted mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  )
}
