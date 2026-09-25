import { PageHeader } from '../components/PageHeader'
import { ComisionesSection } from '../components/ComisionesSection'
import { GastosSection } from '../components/GastosSection'
import { ResumenFinanciero } from '../components/ResumenFinanciero'

export const FinanzasPage = () => (
    <div className="max-w-4xl space-y-6">
        <PageHeader titulo="Finanzas" descripcion="Ingresos, gastos y comisiones de pasarela del negocio." />
        <ResumenFinanciero />
        <GastosSection />
        <ComisionesSection />
    </div>
)
