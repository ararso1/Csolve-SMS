import EmptyState from "./EmptyState";

const Table = ({
  columns,
  renderRow,
  data,
  emptyTitle,
  emptyDescription,
}: {
  columns: { header: string; accessor: string; className?: string }[];
  renderRow: (item: any) => React.ReactNode;
  data: any[];
  emptyTitle?: string;
  emptyDescription?: string;
}) => {
  if (data.length === 0) {
    return (
      <div className="mt-4">
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <table className="w-full mt-4">
      <thead>
        <tr className="text-left text-muted-foreground text-sm">
          {columns.map((col) => (
            <th key={col.accessor} className={col.className}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{data.map((item) => renderRow(item))}</tbody>
    </table>
  );
};

export default Table;
