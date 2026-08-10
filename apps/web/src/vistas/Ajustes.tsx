import { useInventario } from '../estado/InventarioProvider';

const UMBRALES = [1, 2, 3, 5, 7];

export function Ajustes() {
  const { ajustes, cambiarAjustes } = useInventario();

  return (
    <>
      <div className="block" style={{ marginTop: 14 }}>
        <h3>Aviso de caducidad</h3>
        <label style={{ margin: 0 }}>
          <span className="lbl">Avisar con antelación de</span>
          <select
            value={ajustes.diasAviso}
            onChange={(e) => cambiarAjustes({ ...ajustes, diasAviso: Number(e.target.value) })}
          >
            {UMBRALES.map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? 'día' : 'días'}
              </option>
            ))}
          </select>
        </label>
        <p className="hint" style={{ margin: '9px 0 0' }}>
          Lo que quede por debajo de este umbral se marca en ámbar y aparece en el horizonte de
          caducidad.
        </p>
      </div>

      <div className="block">
        <h3>Método de salida de stock</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong style={{ fontSize: 14.5 }}>FEFO</strong>
            <p className="p-meta" style={{ marginTop: 3 }}>
              First Expired, First Out
            </p>
          </div>
          <span className="badge b-f">Activo</span>
        </div>
        <p className="hint" style={{ margin: '11px 0 0' }}>
          Al registrar un consumo se descuenta primero del lote que antes caduca. FIFO y LIFO ya
          existen en el motor, pero se activan en la fase de negocio.
        </p>
      </div>

      <div className="block">
        <h3>Alcance de esta versión</h3>
        <p className="hint" style={{ margin: 0 }}>
          Sprint 1 completo: alta de productos y lotes, ubicaciones, consumo con FEFO, avisos de
          caducidad y lista de la compra dinámica. El menú semanal es un adelanto del Sprint 3. El
          escaneo de tickets por foto llega en el Sprint 2.
        </p>
      </div>
    </>
  );
}
