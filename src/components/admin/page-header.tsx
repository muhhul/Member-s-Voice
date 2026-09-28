export function PageHeader({
  title,
  subtitle,
  icon,
  actions,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="page-head">
      <div className="page-head__text">
        <h1 className="page-head__title">
          {icon ? (
            <span className="page-head__icon" aria-hidden="true">
              {icon}
            </span>
          ) : null}
          {title}
        </h1>
        {subtitle ? <p className="page-head__sub">{subtitle}</p> : null}
      </div>
      {actions ? <div className="row-actions">{actions}</div> : null}
    </div>
  );
}
