const nbCols = 9;
const nbRows = 5;

export function renderSkeleton() {
  return (
    <div className="p-4 text-left">
      <div className="w-full overflow-x-auto">
        <table className="table w-full">
          <tbody>
            {Array.from({ length: nbRows }, (_el, rowIdx) => (
              <tr key={rowIdx}>
                {Array.from({ length: nbCols }, (_colEl, colIdx) => (
                  <td key={colIdx}>
                    <div className="h-4 w-full skeleton" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
