type FeatureGroup = {
  title: string;
  items: string[];
};

type FeatureGroupGridProps = {
  groups: FeatureGroup[];
};

export function FeatureGroupGrid({ groups }: FeatureGroupGridProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {groups.map((group) => (
        <article key={group.title} className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">{group.title}</h2>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            {group.items.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}
